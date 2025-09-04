import { NextRequest, NextResponse } from 'next/server'
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
      '✨ Basic course access',
      '✨ Student certifications',
      'Community support',
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
      '✨ Premium courses & tutorials',
      '✨ Course creation tools',
      '✨ Professional certifications',
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
      '✨ Teacher dashboard access',
      '✨ Student management tools',
      '✨ Revenue from teaching',
      '✨ Advanced course creation',
      'Exclusive professional templates',
      'Priority email support',
      'Commercial license included',
      'Cloud storage (50GB)',
      'Early access to new releases',
      'Asset collaboration tools'
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
      '✨ Bulk student management',
      '✨ Corporate training programs',
      '✨ White-label course delivery',
      '✨ Advanced analytics dashboard',
      'Team collaboration workspace',
      'Advanced admin controls',
      'Dedicated account manager',
      'Custom branding options',
      'Unlimited cloud storage',
      'API access for integrations',
      'SLA guarantee',
      'Invoice billing'
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
      '✨ Basic course access',
      '✨ Student certifications',
      'Community support',
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
async function ensureDefaultPlansExist(): Promise<void> {
  try {
    console.log('🔍 Checking if subscription plans exist...')

    // Check if any plans exist
    const existingPlans = await sanityClient.fetch('*[_type == "subscriptionPlan"]')
    console.log(`📊 Found ${existingPlans.length} existing plans`)

    if (existingPlans.length === 0) {
      console.log('🌱 No subscription plans found, seeding default plans...')

      // Create default plans
      let successCount = 0
      for (const plan of DEFAULT_SUBSCRIPTION_PLANS) {
        try {
          // Add metadata for tracking
          const planWithMetadata = {
            ...plan,
            metadata: {
              createdAt: new Date().toISOString(),
              createdBy: 'system',
              version: 1,
              autoSeeded: true
            }
          }

          const created = await sanityClient.create(planWithMetadata)
          console.log(`✅ Created default plan: ${plan.planId} (ID: ${created._id})`)
          successCount++
        } catch (error) {
          console.error(`❌ Error creating plan ${plan.planId}:`, error)
        }
      }

      console.log(`🎉 Default subscription plans seeded successfully (${successCount}/${DEFAULT_SUBSCRIPTION_PLANS.length})`)
    } else {
      console.log('✅ Subscription plans already exist, skipping seeding')
    }
  } catch (error) {
    console.error('💥 Error checking/seeding subscription plans:', error)
    // Don't throw the error, just log it so the API can still return fallback data
  }
}

// GET - Fetch active subscription plans for public use
export async function GET(request: NextRequest) {
  console.log('🚀 GET /api/subscription-plans called')

  try {
    // First, ensure default plans exist
    await ensureDefaultPlansExist()

    const { searchParams } = new URL(request.url)
    const includeDisabled = searchParams.get('includeDisabled') === 'true'

    // Build query - only fetch enabled plans for public API
    let query = '*[_type == "subscriptionPlan" && enabled == true]'

    if (includeDisabled) {
      query = '*[_type == "subscriptionPlan"]'
    }

    console.log('📤 Fetching plans with query:', query)

    // Add sorting and select only public fields
    const plans = await sanityClient.fetch(`
      ${query} | order(sortOrder asc, price asc) {
        _id,
        planId,
        name,
        description,
        price,
        originalPrice,
        period,
        downloadLimit,
        features,
        highlighted,
        badge,
        enabled,
        sortOrder,
        billingCycle,
        planGroup,
        targetAudience,
        trialDays,
        "discount": round(((originalPrice - price) / originalPrice) * 100)
      }
    `)

    console.log(`📥 Retrieved ${plans.length} plans from Sanity`)

    // If still no plans after seeding attempt, return fallback
    if (plans.length === 0) {
      console.log('⚠️ No plans found even after seeding attempt, using fallback data')
      throw new Error('No plans available even after seeding attempt')
    }

    // Filter out sensitive metadata for public consumption
    const publicPlans = plans.map((plan: any) => ({
      id: plan.planId,
      planId: plan.planId,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      originalPrice: plan.originalPrice,
      period: plan.period,
      downloadLimit: plan.downloadLimit,
      features: plan.features || [],
      highlighted: plan.highlighted || false,
      badge: plan.badge || null,
      discount: plan.discount || 0,
      enabled: plan.enabled,
      billingCycle: plan.billingCycle,
      planGroup: plan.planGroup,
      targetAudience: plan.targetAudience,
      trialDays: plan.trialDays
    }))

    console.log(`✅ Returning ${publicPlans.length} public plans`)

    return NextResponse.json({
      success: true,
      plans: publicPlans,
      total: publicPlans.length,
      lastUpdated: new Date().toISOString(),
      seeded: plans.some((plan: any) => plan.metadata?.autoSeeded),
      source: 'sanity'
    })

  } catch (error) {
    console.error('💥 Error fetching public subscription plans:', error)

    // Return fallback data to prevent page breaking
    const fallbackPlans = DEFAULT_SUBSCRIPTION_PLANS.map(plan => ({
      id: plan.planId,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      originalPrice: plan.originalPrice,
      period: plan.period,
      downloadLimit: plan.downloadLimit,
      features: plan.features || [],
      highlighted: plan.highlighted || false,
      badge: plan.badge || null,
      discount: Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100),
      enabled: plan.enabled,
      targetAudience: plan.targetAudience,
      billingCycle: plan.billingCycle,
      trialDays: plan.trialDays,
      planGroup: plan.planGroup
    }))

    console.log(`🔄 Using fallback data with ${fallbackPlans.length} plans`)

    return NextResponse.json({
      success: true, // Changed to true so frontend accepts the fallback data
      plans: fallbackPlans,
      total: fallbackPlans.length,
      fallback: true,
      source: 'fallback',
      error: 'Database connection issue - using default plans'
    })
  }
}
