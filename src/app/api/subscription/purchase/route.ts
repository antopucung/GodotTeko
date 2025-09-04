import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'
import { handleSubscriptionStarted, handleSubscriptionUpgrade, handleSubscriptionDowngrade } from '@/lib/subscription-events'

interface PurchaseRequest {
  planId: string
  paymentMethod: 'stripe' | 'paypal'
  paymentToken: string
  isUpgrade?: boolean
  currentSubscriptionId?: string
}

// POST - Purchase/Subscribe to a plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const {
      planId,
      paymentMethod,
      paymentToken,
      isUpgrade = false,
      currentSubscriptionId
    }: PurchaseRequest = body

    // Validate required fields
    if (!planId || !paymentMethod || !paymentToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the subscription plan details
    const plan = await sanityClient.fetch(`
      *[_type == "subscriptionPlan" && planId == $planId && enabled == true][0] {
        _id,
        planId,
        name,
        description,
        price,
        originalPrice,
        period,
        downloads,
        duration,
        features[enabled == true]
      }
    `, { planId })

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found or disabled' },
        { status: 404 }
      )
    }

    // Get user details
    const user = await sanityClient.fetch(`
      *[_type == "user" && _id == $userId][0] {
        _id,
        name,
        email,
        country
      }
    `, { userId: session.user.id })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check for existing active subscription if this is not an upgrade
    let currentSubscription = null
    if (isUpgrade && currentSubscriptionId) {
      currentSubscription = await sanityClient.fetch(`
        *[_type == "accessPass" && _id == $subscriptionId && userId == $userId][0]
      `, { subscriptionId: currentSubscriptionId, userId: session.user.id })
    } else {
      // Check for any active subscription
      const activeSubscriptions = await sanityClient.fetch(`
        *[_type == "accessPass" && userId == $userId && isActive == true]
      `, { userId: session.user.id })

      if (activeSubscriptions.length > 0) {
        return NextResponse.json({
          error: 'User already has an active subscription',
          suggestion: 'Use upgrade endpoint to change plans'
        }, { status: 400 })
      }
    }

    // In production, process payment with actual payment provider
    const paymentResult = await processPayment({
      amount: plan.price,
      currency: 'USD',
      paymentMethod,
      paymentToken,
      customerEmail: user.email,
      description: `${plan.name} subscription - ${plan.period}`
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Payment failed', details: paymentResult.error },
        { status: 400 }
      )
    }

    // Calculate expiry and renewal dates
    const expiryDate = calculateExpiryDate(plan.duration)
    const renewalDate = calculateRenewalDate(plan.duration)

    // Create or update subscription record
    let subscription
    if (isUpgrade && currentSubscription) {
      // Update existing subscription
      subscription = await sanityClient
        .patch(currentSubscription._id)
        .set({
          plan: plan._id,
          planId: plan.planId,
          planName: plan.name,
          price: plan.price,
          downloads: plan.downloads,
          expiryDate,
          renewalDate,
          upgradedAt: new Date().toISOString(),
          paymentHistory: [
            ...(currentSubscription.paymentHistory || []),
            {
              amount: plan.price,
              paymentId: paymentResult.paymentId,
              paymentMethod,
              date: new Date().toISOString(),
              type: 'upgrade'
            }
          ]
        })
        .commit()
    } else {
      // Create new subscription
      subscription = await sanityClient.create({
        _type: 'accessPass',
        userId: user._id,
        plan: plan._id,
        planId: plan.planId,
        planName: plan.name,
        price: plan.price,
        downloads: plan.downloads,
        downloadsUsed: 0,
        expiryDate,
        renewalDate,
        isActive: true,
        purchaseDate: new Date().toISOString(),
        paymentHistory: [{
          amount: plan.price,
          paymentId: paymentResult.paymentId,
          paymentMethod,
          date: new Date().toISOString(),
          type: 'purchase'
        }],
        metadata: {
          features: plan.features?.map((f: any) => f.feature) || [],
          originalPrice: plan.originalPrice,
          discount: plan.originalPrice - plan.price
        }
      })
    }

    // Determine previous plan for comparison
    const previousPlanId = currentSubscription?.planId || null
    const eventType = isUpgrade
      ? (isPlanUpgrade(previousPlanId, plan.planId) ? 'upgrade' : 'downgrade')
      : 'started'

    // Trigger appropriate email automation
    const emailEventParams = {
      userId: user._id,
      subscriptionId: subscription._id,
      planId: plan.planId,
      planName: plan.name,
      price: plan.price,
      downloads: plan.downloads,
      expiryDate,
      renewalDate,
      previousPlanId,
      metadata: {
        paymentId: paymentResult.paymentId,
        paymentMethod,
        purchaseDate: new Date().toISOString(),
        discount: plan.originalPrice - plan.price
      }
    }

    let emailResult
    if (eventType === 'started') {
      emailResult = await handleSubscriptionStarted(emailEventParams)
    } else if (eventType === 'upgrade') {
      emailResult = await handleSubscriptionUpgrade(emailEventParams)
    } else {
      emailResult = await handleSubscriptionDowngrade(emailEventParams)
    }

    // Log the purchase/subscription activity
    await sanityClient.create({
      _type: 'emailActivity',
      eventType: 'subscription_purchase',
      userId: user._id,
      subscriptionId: subscription._id,
      planId: plan.planId,
      eventData: {
        eventType: `subscription_${eventType}`,
        planName: plan.name,
        price: plan.price,
        paymentMethod,
        paymentId: paymentResult.paymentId,
        emailTriggered: emailResult.success,
        emailWorkflows: emailResult.triggeredWorkflows || 0
      },
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription._id,
        planId: plan.planId,
        planName: plan.name,
        price: plan.price,
        downloads: plan.downloads,
        expiryDate,
        renewalDate,
        isActive: true
      },
      payment: {
        paymentId: paymentResult.paymentId,
        amount: plan.price,
        method: paymentMethod
      },
      emailAutomation: {
        triggered: emailResult.success,
        workflows: emailResult.triggeredWorkflows || 0
      },
      message: `Successfully ${eventType} subscription to ${plan.name}`
    })

  } catch (error) {
    console.error('Error processing subscription purchase:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription purchase' },
      { status: 500 }
    )
  }
}

// Mock payment processing function - replace with actual payment provider integration
async function processPayment(paymentData: {
  amount: number
  currency: string
  paymentMethod: string
  paymentToken: string
  customerEmail: string
  description: string
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    // In production, integrate with Stripe, PayPal, etc.
    // For demo purposes, simulate payment processing

    if (paymentData.paymentToken === 'test_fail') {
      return { success: false, error: 'Payment declined' }
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock successful payment
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      success: true,
      paymentId
    }

  } catch (error) {
    console.error('Payment processing error:', error)
    return {
      success: false,
      error: 'Payment processing failed'
    }
  }
}

// Helper function to calculate expiry date based on plan duration
function calculateExpiryDate(duration: string): string {
  const now = new Date()

  if (duration.includes('3-month') || duration.includes('quarterly')) {
    now.setMonth(now.getMonth() + 3)
  } else if (duration.includes('1-year') || duration.includes('yearly')) {
    now.setFullYear(now.getFullYear() + 1)
  } else if (duration.toLowerCase().includes('lifetime')) {
    // Set expiry to 100 years from now for lifetime plans
    now.setFullYear(now.getFullYear() + 100)
  } else {
    // Default to 3 months if duration is unclear
    now.setMonth(now.getMonth() + 3)
  }

  return now.toISOString()
}

// Helper function to calculate renewal date
function calculateRenewalDate(duration: string): string | undefined {
  // Only recurring plans have renewal dates
  if (duration.toLowerCase().includes('lifetime')) {
    return undefined
  }

  return calculateExpiryDate(duration)
}

// Helper function to determine if a plan change is an upgrade
function isPlanUpgrade(fromPlanId: string | null, toPlanId: string): boolean {
  if (!fromPlanId) return true // New subscription is always considered an upgrade

  // Simple upgrade logic based on plan hierarchy
  const planHierarchy = ['basic', 'elite', 'lifetime']
  const fromIndex = planHierarchy.indexOf(fromPlanId)
  const toIndex = planHierarchy.indexOf(toPlanId)

  return toIndex > fromIndex
}

// GET - Get user's subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's active subscription
    const subscription = await sanityClient.fetch(`
      *[_type == "accessPass" && userId == $userId && isActive == true][0] {
        _id,
        planId,
        planName,
        price,
        downloads,
        downloadsUsed,
        expiryDate,
        renewalDate,
        isActive,
        purchaseDate,
        paymentHistory,
        metadata
      }
    `, { userId: session.user.id })

    if (!subscription) {
      return NextResponse.json({
        hasActiveSubscription: false,
        subscription: null
      })
    }

    // Calculate days until expiry
    const daysUntilExpiry = Math.ceil(
      (new Date(subscription.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      hasActiveSubscription: true,
      subscription: {
        ...subscription,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        isExpiringSoon: daysUntilExpiry <= 7,
        canUpgrade: subscription.planId !== 'lifetime'
      }
    })

  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
