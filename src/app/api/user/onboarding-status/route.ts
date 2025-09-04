import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has completed onboarding
    const onboardingRecord = await client.fetch(
      `*[_type == "userOnboarding" && user._ref == $userId][0] {
        _id,
        completedAt,
        version
      }`,
      { userId: session.user.id }
    )

    // Get user creation date and profile completeness
    const userInfo = await client.fetch(
      `*[_type == "user" && _id == $userId][0] {
        _id,
        _createdAt,
        bio,
        website,
        preferences,
        stats
      }`,
      { userId: session.user.id }
    )

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user was created recently (within last 24 hours)
    const userCreatedAt = new Date(userInfo._createdAt)
    const now = new Date()
    const hoursSinceCreation = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60)
    const isNewUser = hoursSinceCreation <= 24

    // Check profile completeness
    const hasBasicProfile = !!(userInfo.bio || userInfo.website)
    const hasPreferences = !!(userInfo.preferences?.favoriteCategories?.length > 0)

    // Determine if onboarding should be shown
    const shouldShowOnboarding =
      !onboardingRecord && // No onboarding completed
      isNewUser && // Created within 24 hours
      !hasBasicProfile && // Profile not filled out
      !hasPreferences // Preferences not set

    // Get recommended next steps if onboarding is not needed
    let nextSteps = []
    if (!shouldShowOnboarding) {
      if (!hasBasicProfile) {
        nextSteps.push({
          type: 'profile',
          title: 'Complete your profile',
          description: 'Add a bio and website to help others get to know you',
          url: '/user/profile'
        })
      }

      if (!hasPreferences) {
        nextSteps.push({
          type: 'preferences',
          title: 'Set your preferences',
          description: 'Choose your favorite categories for better recommendations',
          url: '/user/dashboard?tab=settings'
        })
      }

      if (userInfo.stats?.totalPurchases === 0) {
        nextSteps.push({
          type: 'first-purchase',
          title: 'Browse our products',
          description: 'Discover thousands of design resources',
          url: '/products'
        })
      }
    }

    return NextResponse.json({
      shouldShowOnboarding,
      onboardingCompleted: !!onboardingRecord,
      completedAt: onboardingRecord?.completedAt,
      userCreatedAt: userInfo._createdAt,
      isNewUser,
      profileCompleteness: {
        hasBasicProfile,
        hasPreferences,
        totalPurchases: userInfo.stats?.totalPurchases || 0
      },
      nextSteps
    })

  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}
