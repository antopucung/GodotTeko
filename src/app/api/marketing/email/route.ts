import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// POST /api/marketing/email - Trigger email marketing campaigns
export async function POST(request: NextRequest) {
  try {
    const { campaignType, targetUserId, contentId, customData } = await request.json()

    if (!campaignType || !targetUserId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get target user
    const user = await client.fetch(
      `*[_type == "userEnhanced" && _id == $targetUserId][0] {
        _id, name, email, preferences, subscriptionTier, role
      }`,
      { targetUserId }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has opted in to marketing emails
    if (user.preferences?.emailMarketing === false) {
      return NextResponse.json({
        success: true,
        message: 'User has opted out of marketing emails',
        sent: false
      })
    }

    // Generate campaign based on type
    const campaign = await generateEmailCampaign(campaignType, user, contentId, customData)

    if (!campaign) {
      return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 })
    }

    // Send email (in production, this would integrate with email service)
    const emailResult = await sendMarketingEmail(user, campaign)

    // Log the campaign for analytics
    await logEmailCampaign({
      userId: targetUserId,
      campaignType,
      contentId,
      status: emailResult.success ? 'sent' : 'failed',
      campaign
    })

    return NextResponse.json({
      success: true,
      sent: emailResult.success,
      campaign: {
        type: campaignType,
        subject: campaign.subject,
        template: campaign.template
      }
    })

  } catch (error) {
    console.error('Error sending marketing email:', error)
    return NextResponse.json(
      { error: 'Failed to send marketing email' },
      { status: 500 }
    )
  }
}

// GET /api/marketing/email - Get campaign analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30d'

    // Get campaign analytics
    const analytics = await getEmailCampaignAnalytics(timeRange)

    return NextResponse.json({
      success: true,
      analytics,
      timeRange
    })

  } catch (error) {
    console.error('Error fetching email analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email analytics' },
      { status: 500 }
    )
  }
}

// Generate email campaign content based on type
async function generateEmailCampaign(campaignType: string, user: any, contentId?: string, customData?: any) {
  const campaigns: { [key: string]: any } = {
    // Welcome series
    welcome_new_user: {
      subject: `Welcome to Godot Tekko, ${user.name}! 🎮`,
      template: 'welcome',
      content: {
        heading: 'Welcome to the Creative Community!',
        message: `Hi ${user.name}, welcome to Godot Tekko! We're excited to have you join our community of game developers and digital artists.`,
        cta: 'Explore Featured Content',
        ctaUrl: '/featured',
        personalizedRecommendations: await getWelcomeRecommendations(user)
      }
    },

    // Course recommendations
    course_recommendation: {
      subject: `${user.name}, check out this course perfect for you! 📚`,
      template: 'recommendation',
      content: await generateCourseRecommendationContent(user, contentId)
    },

    // Asset recommendations
    asset_recommendation: {
      subject: `New asset that matches your interests 🎨`,
      template: 'recommendation',
      content: await generateAssetRecommendationContent(user, contentId)
    },

    // Abandoned cart
    abandoned_cart: {
      subject: `${user.name}, you left something in your cart! 🛒`,
      template: 'cart_recovery',
      content: {
        heading: 'Complete Your Purchase',
        message: `You have great items waiting in your cart. Complete your purchase now and start creating!`,
        cta: 'Complete Purchase',
        ctaUrl: '/cart',
        incentive: user.subscriptionTier === 'free' ? '10% off with code COMPLETE10' : null
      }
    },

    // Course completion congratulations
    course_completed: {
      subject: `Congratulations on completing your course! 🎉`,
      template: 'achievement',
      content: {
        heading: 'Course Completed!',
        message: `Well done on completing your course! Ready to level up with more advanced content?`,
        cta: 'Explore Advanced Courses',
        ctaUrl: '/learn?difficulty=advanced',
        achievement: 'Course Completion',
        nextSteps: await getNextCourseRecommendations(user, contentId)
      }
    },

    // Subscription upgrade
    upgrade_suggestion: {
      subject: `Unlock more with Godot Tekko Premium 👑`,
      template: 'upgrade',
      content: {
        heading: 'Ready to Level Up?',
        message: `Based on your activity, you might love our premium features. Get unlimited access to all courses and assets!`,
        cta: 'Upgrade Now',
        ctaUrl: '/all-access',
        benefits: [
          'Unlimited course access',
          'Premium asset downloads',
          'VIP project gallery',
          'Priority support'
        ],
        currentTier: user.subscriptionTier
      }
    },

    // New content from followed creators
    creator_new_content: {
      subject: `New content from creators you follow! ✨`,
      template: 'creator_update',
      content: await generateCreatorUpdateContent(user, contentId)
    },

    // Weekly digest
    weekly_digest: {
      subject: `Your weekly Godot Tekko digest 📊`,
      template: 'digest',
      content: await generateWeeklyDigestContent(user)
    },

    // Re-engagement for inactive users
    re_engagement: {
      subject: `We miss you, ${user.name}! Come back and see what's new 🔔`,
      template: 'reengagement',
      content: {
        heading: 'We Miss You!',
        message: `It's been a while since your last visit. Check out the amazing new content added just for you!`,
        cta: 'See What\'s New',
        ctaUrl: '/discover',
        incentive: 'Get 20% off your next purchase with code WELCOME20',
        highlights: await getReengagementHighlights(user)
      }
    }
  }

  return campaigns[campaignType] || null
}

// Helper functions for content generation
async function getWelcomeRecommendations(user: any) {
  // Get popular beginner-friendly content
  return await client.fetch(
    `{
      "courses": *[_type == "course" && difficulty == "beginner" && published == true] | order(enrollmentCount desc) [0...3] {
        _id, title, thumbnail, category, instructor
      },
      "assets": *[_type == "product" && published == true] | order(stats.views desc) [0...3] {
        _id, title, thumbnail, category, author
      }
    }`
  )
}

async function generateCourseRecommendationContent(user: any, courseId?: string) {
  if (!courseId) return null

  const course = await client.fetch(
    `*[_type == "course" && _id == $courseId][0] {
      _id, title, description, thumbnail, instructor, price, difficulty, category
    }`,
    { courseId }
  )

  return {
    heading: 'Perfect Course For You!',
    message: `Based on your interests, we think you'd love this ${course.difficulty} course on ${course.category}.`,
    cta: 'Start Learning',
    ctaUrl: `/courses/${course._id}`,
    course,
    whyRecommended: `Matches your interest in ${course.category}`
  }
}

async function generateAssetRecommendationContent(user: any, assetId?: string) {
  if (!assetId) return null

  const asset = await client.fetch(
    `*[_type == "product" && _id == $assetId][0] {
      _id, title, description, thumbnail, author, price, category
    }`,
    { assetId }
  )

  return {
    heading: 'New Asset You\'ll Love!',
    message: `Check out this amazing ${asset.category} asset that matches your style.`,
    cta: 'View Asset',
    ctaUrl: `/products/${asset._id}`,
    asset,
    whyRecommended: `Popular in ${asset.category}`
  }
}

async function getNextCourseRecommendations(user: any, completedCourseId?: string) {
  if (!completedCourseId) return []

  const completedCourse = await client.fetch(
    `*[_type == "course" && _id == $courseId][0] { category, difficulty, skills }`,
    { courseId: completedCourseId }
  )

  // Recommend next level courses
  return await client.fetch(
    `*[_type == "course" && category == $category && difficulty == $nextDifficulty && published == true] | order(enrollmentCount desc) [0...3] {
      _id, title, thumbnail, difficulty
    }`,
    {
      category: completedCourse.category,
      nextDifficulty: completedCourse.difficulty === 'beginner' ? 'intermediate' : 'advanced'
    }
  )
}

async function generateCreatorUpdateContent(user: any, contentId?: string) {
  // Get content from creators the user follows
  return {
    heading: 'New Content from Your Favorite Creators!',
    message: 'The creators you follow have published exciting new content.',
    cta: 'Check It Out',
    ctaUrl: '/following',
    updates: [] // Would fetch actual followed creator updates
  }
}

async function generateWeeklyDigestContent(user: any) {
  return {
    heading: 'Your Weekly Godot Tekko Digest',
    message: 'Here\'s what happened this week in your creative journey.',
    cta: 'View Full Activity',
    ctaUrl: '/user/activity',
    stats: {
      coursesCompleted: 0,
      timeSpent: '2h 30m',
      newFollowers: 3,
      contentViewed: 8
    },
    trending: await getTrendingContent()
  }
}

async function getReengagementHighlights(user: any) {
  return await client.fetch(
    `{
      "newCourses": *[_type == "course" && _createdAt > $oneWeekAgo && published == true] | order(_createdAt desc) [0...3] {
        _id, title, thumbnail, category
      },
      "trendingAssets": *[_type == "product" && published == true] | order(stats.views desc) [0...3] {
        _id, title, thumbnail, category
      }
    }`,
    { oneWeekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
  )
}

async function getTrendingContent() {
  return await client.fetch(
    `{
      "topCourse": *[_type == "course" && published == true] | order(enrollmentCount desc) [0] {
        title, enrollmentCount
      },
      "topAsset": *[_type == "product" && published == true] | order(stats.sales desc) [0] {
        title, stats
      }
    }`
  )
}

// Mock email sending function (replace with actual email service)
async function sendMarketingEmail(user: any, campaign: any) {
  // In production, integrate with services like SendGrid, Mailgun, etc.
  console.log(`📧 Sending email to ${user.email}:`, {
    subject: campaign.subject,
    template: campaign.template
  })

  // Simulate email sending
  return {
    success: true,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
}

// Log email campaign for analytics
async function logEmailCampaign(data: any) {
  await client.create({
    _type: 'emailCampaign',
    userId: data.userId,
    campaignType: data.campaignType,
    contentId: data.contentId,
    status: data.status,
    subject: data.campaign.subject,
    template: data.campaign.template,
    sentAt: new Date().toISOString()
  })
}

// Get email campaign analytics
async function getEmailCampaignAnalytics(timeRange: string) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (timeRange === '7d' ? 7 : 30))

  return await client.fetch(
    `{
      "totalSent": count(*[_type == "emailCampaign" && sentAt >= $startDate]),
      "byType": *[_type == "emailCampaign" && sentAt >= $startDate] | {
        "campaignType": campaignType,
        "count": count(*)
      } | order(count desc),
      "successRate": round((count(*[_type == "emailCampaign" && sentAt >= $startDate && status == "sent"]) / count(*[_type == "emailCampaign" && sentAt >= $startDate])) * 100),
      "topPerforming": *[_type == "emailCampaign" && sentAt >= $startDate] | order(sentAt desc) [0...5] {
        campaignType, subject, status, sentAt
      }
    }`,
    { startDate: startDate.toISOString() }
  )
}
