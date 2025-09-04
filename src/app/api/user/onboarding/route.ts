import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, updateUserProfile } from '@/lib/auth'
import { client } from '@/lib/sanity'
import { EmailService } from '@/lib/email/emailService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const onboardingData = await request.json()

    // Update user profile with onboarding data
    await updateUserProfile(session.user.id, {
      bio: onboardingData.bio,
      website: onboardingData.website,
      preferences: {
        newsletter: true,
        notifications: true,
        theme: 'system',
        favoriteCategories: onboardingData.favoriteCategories || [],
        experience: onboardingData.experience,
        primaryUse: onboardingData.primaryUse
      }
    })

    // Create onboarding completion record
    await client.create({
      _type: 'userOnboarding',
      user: { _type: 'reference', _ref: session.user.id },
      completedAt: new Date().toISOString(),
      data: {
        interests: onboardingData.interests || [],
        experience: onboardingData.experience,
        primaryUse: onboardingData.primaryUse,
        favoriteCategories: onboardingData.favoriteCategories || [],
        bio: onboardingData.bio,
        website: onboardingData.website
      },
      version: '1.0'
    })

    // Send welcome email with personalized content
    try {
      await EmailService.sendWelcomeEmail(
        session.user.email!,
        session.user.name!
      )
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the onboarding if email fails
    }

    // Create personalized recommendations based on interests
    const recommendations = await generatePersonalizedRecommendations(
      onboardingData.favoriteCategories,
      onboardingData.experience,
      onboardingData.primaryUse
    )

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      recommendations
    })

  } catch (error) {
    console.error('Error processing onboarding:', error)
    return NextResponse.json(
      {
        error: 'Failed to complete onboarding',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function generatePersonalizedRecommendations(
  categories: string[],
  experience: string,
  primaryUse: string
) {
  try {
    // Generate category filter for GROQ query
    const categoryFilter = categories.length > 0
      ? `&& count((categories[]->slug.current)[@ in [${categories.map(c => `"${c.toLowerCase()}"`).join(', ')}]]) > 0`
      : ''

    // Get recommended products based on onboarding data
    const recommendations = await client.fetch(
      `{
        "featuredProducts": *[_type == "product" && featured == true ${categoryFilter}] | order(stats.downloads desc) [0...6] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "image": images[0].asset->url,
          "author": author->name,
          "category": categories[0]->title,
          stats,
          freebie
        },
        "popularInCategories": *[_type == "product" ${categoryFilter}] | order(stats.likes desc) [0...8] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "image": images[0].asset->url,
          "author": author->name,
          "category": categories[0]->title,
          stats,
          freebie
        },
        "beginnerFriendly": *[_type == "product" && difficulty == "beginner" ${categoryFilter}] | order(_createdAt desc) [0...4] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "image": images[0].asset->url,
          "author": author->name,
          "category": categories[0]->title,
          freebie
        },
        "freeResources": *[_type == "product" && freebie == true ${categoryFilter}] | order(stats.downloads desc) [0...6] {
          _id,
          title,
          slug,
          "image": images[0].asset->url,
          "author": author->name,
          "category": categories[0]->title,
          stats
        }
      }`
    )

    return {
      categories: categories,
      experience: experience,
      primaryUse: primaryUse,
      products: recommendations
    }

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return {
      categories: categories,
      experience: experience,
      primaryUse: primaryUse,
      products: null
    }
  }
}
