import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

// POST - Seed default subscription plans
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if plans already exist
    const existingPlans = await sanityClient.fetch('*[_type == "subscriptionPlan"]')

    if (existingPlans.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Subscription plans already exist',
        existing: existingPlans.length
      })
    }

    // Default subscription plans data
    const defaultPlans = [
      {
        _type: 'subscriptionPlan',
        planId: 'basic',
        name: 'Basic',
        description: 'Perfect for getting started with design resources',
        price: 150,
        originalPrice: 188,
        period: 'Paid quarterly',
        downloads: 10,
        duration: '3-month access',
        features: [
          { feature: '10 downloads per day', enabled: true },
          { feature: '3-month access', enabled: true },
          { feature: 'Access to all products', enabled: true },
          { feature: 'Cancel any time', enabled: true },
          { feature: 'Standard license', enabled: true }
        ],
        highlighted: false,
        badge: '',
        enabled: true,
        sortOrder: 1,
        metadata: {
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
          stripePriceId: '',
          paypalPlanId: '',
          maxUsers: 1,
          renewalDiscount: 15
        }
      },
      {
        _type: 'subscriptionPlan',
        planId: 'elite',
        name: 'Elite',
        description: 'Most popular choice for professional designers',
        price: 294,
        originalPrice: 368,
        period: 'Paid yearly',
        downloads: 30,
        duration: '1-year access',
        features: [
          { feature: '30 downloads per day', enabled: true },
          { feature: '1-year access', enabled: true },
          { feature: 'Access to all products', enabled: true },
          { feature: 'Cancel any time', enabled: true },
          { feature: 'Extended commercial license', enabled: true },
          { feature: 'Priority support', enabled: true }
        ],
        highlighted: true,
        badge: 'Most Popular',
        enabled: true,
        sortOrder: 2,
        metadata: {
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
          stripePriceId: '',
          paypalPlanId: '',
          maxUsers: 1,
          renewalDiscount: 15
        }
      },
      {
        _type: 'subscriptionPlan',
        planId: 'lifetime',
        name: 'Lifetime',
        description: 'One-time purchase for lifetime access',
        price: 710,
        originalPrice: 888,
        period: 'One-time purchase',
        downloads: 40,
        duration: 'Lifetime access',
        features: [
          { feature: '40 downloads per day', enabled: true },
          { feature: 'Lifetime access', enabled: true },
          { feature: 'Access to all products', enabled: true },
          { feature: 'One-time payment', enabled: true },
          { feature: 'Extended commercial license', enabled: true },
          { feature: 'Priority support', enabled: true },
          { feature: 'Early access to new content', enabled: true }
        ],
        highlighted: false,
        badge: 'Best Value',
        enabled: true,
        sortOrder: 3,
        metadata: {
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
          stripePriceId: '',
          paypalPlanId: '',
          maxUsers: 1,
          renewalDiscount: 0
        }
      }
    ]

    // Create the plans in Sanity
    const createdPlans = []
    for (const plan of defaultPlans) {
      try {
        const created = await sanityClient.create(plan)
        createdPlans.push(created)
      } catch (error) {
        console.error(`Error creating plan ${plan.planId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Default subscription plans created successfully',
      created: createdPlans.length,
      plans: createdPlans.map(plan => ({
        id: plan._id,
        planId: plan.planId,
        name: plan.name,
        price: plan.price
      }))
    })

  } catch (error) {
    console.error('Error seeding subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to seed subscription plans' },
      { status: 500 }
    )
  }
}
