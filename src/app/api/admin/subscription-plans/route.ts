import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

// Default subscription plans that always exist
const DEFAULT_SUBSCRIPTION_PLANS = [
  // Monthly Plans
  {
    _type: 'subscriptionPlan',
    name: 'Student',
    description: 'Perfect for students and learners getting started with design',
    price: 12,
    originalPrice: 20,
    period: 'per month',
    planId: 'student-monthly',
    enabled: true,
    highlighted: false,
    badge: 'Popular',
    downloadLimit: 15,
    features: [
      'Access to all design resources',
      '15 downloads per month',
      'Community support',
      'Basic tutorials access',
      'Mobile app access',
      'Cancel anytime'
    ],
    targetAudience: 'Students, beginners, junior high to high school',
    billingCycle: 'monthly',
    trialDays: 14,
    planGroup: 'student'
  },
  {
    _type: 'subscriptionPlan',
    name: 'Individual',
    description: 'Ideal for hobbyists, college students, and individual creators',
    price: 29,
    originalPrice: 39,
    period: 'per month',
    planId: 'individual-monthly',
    enabled: true,
    highlighted: true,
    badge: 'Most Popular',
    downloadLimit: 50,
    features: [
      'Access to all design resources',
      '50 downloads per month',
      'Premium tutorials & courses',
      'Advanced templates library',
      'Priority community support',
      'Mobile & desktop apps',
      'Cloud storage (10GB)',
      'License for personal & commercial use'
    ],
    targetAudience: 'College students, hobbyists, individual creators',
    billingCycle: 'monthly',
    trialDays: 7,
    planGroup: 'individual'
  },
  {
    _type: 'subscriptionPlan',
    name: 'Professional',
    description: 'Complete solution for freelancers and professional designers',
    price: 79,
    originalPrice: 120,
    period: 'per month',
    planId: 'professional-monthly',
    enabled: true,
    highlighted: false,
    badge: 'Pro Choice',
    downloadLimit: 200,
    features: [
      'Unlimited access to all resources',
      '200+ downloads per month',
      'Exclusive professional templates',
      'Advanced workflow tutorials',
      'Priority email support',
      'Commercial license included',
      'Cloud storage (50GB)',
      'Early access to new releases',
      'Asset collaboration tools',
      'Custom workspace features'
    ],
    targetAudience: 'Freelancers, professional designers, consultants',
    billingCycle: 'monthly',
    trialDays: 14,
    planGroup: 'professional'
  },
  {
    _type: 'subscriptionPlan',
    name: 'Team',
    description: 'Enterprise solution for studios, agencies, and design teams',
    price: 199,
    originalPrice: 299,
    period: 'per month (5+ seats)',
    planId: 'team-monthly',
    enabled: true,
    highlighted: false,
    badge: 'Enterprise',
    downloadLimit: 1000,
    features: [
      'Everything in Professional',
      '1000+ downloads per month per user',
      'Team collaboration workspace',
      'Advanced admin controls',
      'Dedicated account manager',
      'Custom branding options',
      'Unlimited cloud storage',
      'API access for integrations',
      'Custom training sessions',
      'SLA guarantee',
      'Invoice billing',
      'Multi-seat management'
    ],
    targetAudience: 'Studios, agencies, design teams, enterprises',
    billingCycle: 'monthly',
    trialDays: 30,
    planGroup: 'team'
  },
  // Yearly Plans (2 months free = ~17% discount)
  {
    _type: 'subscriptionPlan',
    name: 'Student',
    description: 'Perfect for students and learners getting started with design',
    price: 96,
    originalPrice: 144,
    period: 'per year',
    planId: 'student-yearly',
    enabled: true,
    highlighted: false,
    badge: 'Save $24',
    downloadLimit: 15,
    features: [
      'Access to all design resources',
      '15 downloads per month',
      'Community support',
      'Basic tutorials access',
      'Mobile app access',
      'Cancel anytime',
      '2 months FREE (vs monthly)'
    ],
    targetAudience: 'Students, beginners, junior high to high school',
    billingCycle: 'yearly',
    trialDays: 14,
    planGroup: 'student'
  },
  {
    _type: 'subscriptionPlan',
    name: 'Individual',
    description: 'Ideal for hobbyists, college students, and individual creators',
    price: 290,
    originalPrice: 390,
    period: 'per year',
    planId: 'individual-yearly',
    enabled: true,
    highlighted: true,
    badge: 'Save $58',
    downloadLimit: 50,
    features: [
      'Access to all design resources',
      '50 downloads per month',
      'Premium tutorials & courses',
      'Advanced templates library',
      'Priority community support',
      'Mobile & desktop apps',
      'Cloud storage (10GB)',
      'License for personal & commercial use',
      '2 months FREE (vs monthly)'
    ],
    targetAudience: 'College students, hobbyists, individual creators',
    billingCycle: 'yearly',
    trialDays: 7,
    planGroup: 'individual'
  },
  {
    _type: 'subscriptionPlan',
    name: 'Professional',
    description: 'Complete solution for freelancers and professional designers',
    price: 790,
    originalPrice: 1200,
    period: 'per year',
    planId: 'professional-yearly',
    enabled: true,
    highlighted: false,
    badge: 'Save $158',
    downloadLimit: 200,
    features: [
      'Unlimited access to all resources',
      '200+ downloads per month',
      'Exclusive professional templates',
      'Advanced workflow tutorials',
      'Priority email support',
      'Commercial license included',
      'Cloud storage (50GB)',
      'Early access to new releases',
      'Asset collaboration tools',
      'Custom workspace features',
      '2 months FREE (vs monthly)'
    ],
    targetAudience: 'Freelancers, professional designers, consultants',
    billingCycle: 'yearly',
    trialDays: 14,
    planGroup: 'professional'
  },
  {
    _type: 'subscriptionPlan',
    name: 'Team',
    description: 'Enterprise solution for studios, agencies, and design teams',
    price: 1990,
    originalPrice: 2990,
    period: 'per year (5+ seats)',
    planId: 'team-yearly',
    enabled: true,
    highlighted: false,
    badge: 'Save $398',
    downloadLimit: 1000,
    features: [
      'Everything in Professional',
      '1000+ downloads per month per user',
      'Team collaboration workspace',
      'Advanced admin controls',
      'Dedicated account manager',
      'Custom branding options',
      'Unlimited cloud storage',
      'API access for integrations',
      'Custom training sessions',
      'SLA guarantee',
      'Invoice billing',
      'Multi-seat management',
      '2 months FREE (vs monthly)'
    ],
    targetAudience: 'Studios, agencies, design teams, enterprises',
    billingCycle: 'yearly',
    trialDays: 30,
    planGroup: 'team'
  }
]

// Function to automatically seed default plans if none exist
async function ensureDefaultPlansExist(userId?: string): Promise<void> {
  try {
    // Check if any plans exist
    const existingPlans = await sanityClient.fetch('*[_type == "subscriptionPlan"]')

    if (existingPlans.length === 0) {
      console.log('No subscription plans found, seeding default plans...')

      // Create default plans
      for (const plan of DEFAULT_SUBSCRIPTION_PLANS) {
        try {
          // Add metadata for tracking
          const planWithMetadata = {
            ...plan,
            metadata: {
              createdAt: new Date().toISOString(),
              createdBy: userId || 'system',
              version: 1,
              autoSeeded: true
            }
          }

          await sanityClient.create(planWithMetadata)
          console.log(`Created default plan: ${plan.planId}`)
        } catch (error) {
          console.error(`Error creating plan ${plan.planId}:`, error)
        }
      }

      console.log('Default subscription plans seeded successfully')
    }
  } catch (error) {
    console.error('Error checking/seeding subscription plans:', error)
  }
}

// GET - Fetch all subscription plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, ensure default plans exist
    await ensureDefaultPlansExist(session.user.id)

    const { searchParams } = new URL(request.url)
    const enabled = searchParams.get('enabled')
    const includeDisabled = searchParams.get('includeDisabled') === 'true'

    // Build query based on parameters
    let query = '*[_type == "subscriptionPlan"]'

    if (enabled === 'true') {
      query = '*[_type == "subscriptionPlan" && enabled == true]'
    } else if (enabled === 'false') {
      query = '*[_type == "subscriptionPlan" && enabled == false]'
    }

    // Add sorting
    query += ' | order(sortOrder asc, price asc)'

    const plans = await sanityClient.fetch(`
      ${query} {
        _id,
        _createdAt,
        _updatedAt,
        planId,
        name,
        description,
        price,
        originalPrice,
        period,
        downloads,
        duration,
        features,
        highlighted,
        badge,
        enabled,
        sortOrder,
        metadata
      }
    `)

    return NextResponse.json({
      success: true,
      plans,
      total: plans.length,
      seeded: plans.some((plan: any) => plan.metadata?.autoSeeded)
    })

  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}

// POST - Create new subscription plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      planId,
      name,
      description,
      price,
      originalPrice,
      period,
      downloads,
      duration,
      features = [],
      highlighted = false,
      badge,
      enabled = true,
      sortOrder = 0,
      metadata = {}
    } = body

    // Validate required fields
    if (!planId || !name || !price || !originalPrice || !period || !downloads || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if planId already exists
    const existingPlan = await sanityClient.fetch(
      '*[_type == "subscriptionPlan" && planId == $planId][0]',
      { planId }
    )

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Plan ID already exists' },
        { status: 400 }
      )
    }

    // Create the subscription plan
    const newPlan = await sanityClient.create({
      _type: 'subscriptionPlan',
      planId,
      name,
      description,
      price: Number(price),
      originalPrice: Number(originalPrice),
      period,
      downloads: Number(downloads),
      duration,
      features: features.map((feature: any) => ({
        feature: feature.feature || feature,
        enabled: feature.enabled !== false
      })),
      highlighted,
      badge,
      enabled,
      sortOrder: Number(sortOrder),
      metadata: {
        ...metadata,
        createdBy: session.user.id,
        createdAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      plan: newPlan,
      message: 'Subscription plan created successfully'
    })

  } catch (error) {
    console.error('Error creating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    )
  }
}

// PUT - Bulk update (reorder, enable/disable multiple)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    // Process bulk updates
    const results = []
    for (const update of updates) {
      const { _id, ...updateData } = update

      if (!_id) continue

      try {
        const updatedPlan = await sanityClient
          .patch(_id)
          .set({
            ...updateData,
            'metadata.lastModifiedBy': session.user.id,
            'metadata.lastModifiedAt': new Date().toISOString()
          })
          .commit()

        results.push({
          _id,
          success: true,
          plan: updatedPlan
        })
      } catch (error) {
        results.push({
          _id,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.length} updates`
    })

  } catch (error) {
    console.error('Error bulk updating subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription plans' },
      { status: 500 }
    )
  }
}
