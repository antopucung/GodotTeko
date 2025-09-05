import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getUserById } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

interface UserStats {
  totalPurchases: number
  totalSpent: number
  downloadsThisMonth: number
  favoriteCategories: string[]
  lastLoginAt: string
}

interface SubscriptionPlan {
  id: string
  name: string
  tier: 'student' | 'individual' | 'professional' | 'team'
  price: {
    monthly: number
    yearly: number
  }
  features: string[]
}

interface SubscriptionStatus {
  plan: SubscriptionPlan | null
  status: 'active' | 'inactive' | 'trial' | 'canceled' | 'expired'
  currentPeriodEnd?: string
  trialEndsAt?: string
  isYearly: boolean
  nextBillingAmount?: number
}

interface RecentDownload {
  id: string
  productName: string
  downloadedAt: string
  fileSize: string
  category: string
}

// GET - Fetch user profile with subscription and stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Fetching profile for user:', session.user.id)

    // Get user basic info
    const user = await getUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user statistics
    const userStats = await getUserStats(session.user.id)

    // Get subscription status
    const subscriptionStatus = await getUserSubscription(session.user.id)

    // Get recent downloads
    const recentDownloads = await getRecentDownloads(session.user.id)

    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      verified: user.verified,
      stats: userStats,
      subscription: subscriptionStatus,
      recentDownloads
    }

    console.log('✅ Profile loaded successfully for:', user.email)

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('❌ Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

// Helper function to get user statistics
async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // Query user orders and downloads
    const userOrders = await sanityClient.fetch(
      `*[_type == "order" && user._ref == $userId] {
        _id,
        total,
        status,
        createdAt,
        items[] {
          product->{title, category}
        }
      }`,
      { userId }
    )

    // Calculate stats
    const totalPurchases = userOrders.length || 0
    const totalSpent = userOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)

    // Calculate downloads this month
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const downloadsThisMonth = userOrders.filter((order: any) =>
      new Date(order.createdAt) >= thisMonth
    ).length

    // Get favorite categories from purchase history
    const allCategories = userOrders.flatMap((order: any) =>
      order.items?.map((item: any) => item.product?.category).filter(Boolean) || []
    )
    const categoryCount = allCategories.reduce((acc: any, category: string) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})

    const favoriteCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category]) => category)

    return {
      totalPurchases,
      totalSpent,
      downloadsThisMonth,
      favoriteCategories,
      lastLoginAt: new Date().toISOString() // Will be updated from user stats later
    }

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      totalPurchases: 0,
      totalSpent: 0,
      downloadsThisMonth: 0,
      favoriteCategories: [],
      lastLoginAt: new Date().toISOString()
    }
  }
}

// Helper function to get user subscription status
async function getUserSubscription(userId: string): Promise<SubscriptionStatus> {
  try {
    // Query subscription plans to get available plans
    const subscriptionPlans = await sanityClient.fetch(
      `*[_type == "subscriptionPlan" && settings.isActive == true] | order(pricing.monthly asc) {
        _id,
        name,
        tier,
        pricing {
          monthly,
          yearly
        },
        features
      }`
    )

    // For now, return a mock subscription status
    // In a real implementation, you'd query your billing provider (Stripe, etc.)
    const mockSubscription: SubscriptionStatus = {
      plan: subscriptionPlans[1] ? {
        id: subscriptionPlans[1]._id,
        name: subscriptionPlans[1].name,
        tier: subscriptionPlans[1].tier,
        price: {
          monthly: subscriptionPlans[1].pricing.monthly,
          yearly: subscriptionPlans[1].pricing.yearly
        },
        features: subscriptionPlans[1].features || []
      } : null,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      isYearly: false,
      nextBillingAmount: subscriptionPlans[1]?.pricing.monthly || 0
    }

    return mockSubscription

  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return {
      plan: null,
      status: 'inactive',
      isYearly: false
    }
  }
}

// Helper function to get recent downloads
async function getRecentDownloads(userId: string): Promise<RecentDownload[]> {
  try {
    // Query recent orders/downloads
    const recentOrders = await sanityClient.fetch(
      `*[_type == "order" && user._ref == $userId] | order(_createdAt desc)[0...5] {
        _id,
        _createdAt,
        items[] {
          product->{
            _id,
            title,
            category,
            images
          }
        }
      }`,
      { userId }
    )

    const recentDownloads: RecentDownload[] = recentOrders.flatMap((order: any) =>
      order.items?.map((item: any) => ({
        id: item.product?._id || order._id,
        productName: item.product?.title || 'Unknown Product',
        downloadedAt: order._createdAt,
        fileSize: '25 MB', // Mock file size
        category: item.product?.category || 'Digital Asset'
      })) || []
    ).slice(0, 5)

    return recentDownloads

  } catch (error) {
    console.error('Error fetching recent downloads:', error)
    return []
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, website, company, location, socialLinks, preferences } = body

    // Update user profile in Sanity
    const updatedUser = await sanityClient
      .patch(session.user.id)
      .set({
        ...(name && { name }),
        ...(bio && { bio }),
        ...(website && { website }),
        ...(company && { company }),
        ...(location && { location }),
        ...(socialLinks && { socialLinks }),
        ...(preferences && { preferences })
      })
      .commit()

    console.log('✅ User profile updated:', session.user.id)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
