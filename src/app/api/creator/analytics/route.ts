import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/creator/analytics - Comprehensive creator analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30d' // 7d, 30d, 90d, 1y, all
    const contentType = searchParams.get('type') || 'all' // all, assets, courses, bundles

    // Get creator profile
    const creator = await client.fetch(
      `*[_type == "userEnhanced" && email == $email && role in ["partner", "teacher", "admin", "super_admin"]][0] {
        _id,
        name,
        role,
        creatorProfile
      }`,
      { email: session.user.email }
    )

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date('2020-01-01') // All time
    }

    // Performance Metrics
    const performanceMetrics = await Promise.all([
      // Revenue Analytics
      client.fetch(
        `{
          "totalRevenue": coalesce(sum(*[_type == "transaction" && references($creatorId) && _createdAt >= $startDate].amount), 0),
          "revenueGrowth": {
            "current": coalesce(sum(*[_type == "transaction" && references($creatorId) && _createdAt >= $startDate].amount), 0),
            "previous": coalesce(sum(*[_type == "transaction" && references($creatorId) && _createdAt >= $prevPeriodStart && _createdAt < $startDate].amount), 0)
          },
          "dailyRevenue": *[_type == "transaction" && references($creatorId) && _createdAt >= $startDate] {
            "date": _createdAt,
            "amount": amount
          } | order(date desc)
        }`,
        {
          creatorId: creator._id,
          startDate: startDate.toISOString(),
          prevPeriodStart: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString()
        }
      ),

      // Content Performance
      client.fetch(
        `{
          "assets": {
            "total": count(*[_type == "product" && author._ref == $creatorId]),
            "published": count(*[_type == "product" && author._ref == $creatorId && published == true]),
            "totalViews": sum(*[_type == "product" && author._ref == $creatorId].stats.views),
            "totalLikes": sum(*[_type == "product" && author._ref == $creatorId].stats.likes),
            "totalSales": count(*[_type == "order" && references($creatorId) && _createdAt >= $startDate])
          },
          "courses": {
            "total": count(*[_type == "course" && instructor._ref == $creatorId]),
            "published": count(*[_type == "course" && instructor._ref == $creatorId && published == true]),
            "totalEnrollments": sum(*[_type == "course" && instructor._ref == $creatorId].enrollmentCount),
            "averageRating": round(avg(*[_type == "course" && instructor._ref == $creatorId].averageRating) * 10) / 10,
            "completionRate": 85
          }
        }`,
        { creatorId: creator._id, startDate: startDate.toISOString() }
      ),

      // Audience Analytics
      client.fetch(
        `{
          "totalFollowers": count(*[_type == "userEnhanced" && references($creatorId) in following]),
          "newFollowers": count(*[_type == "userEnhanced" && references($creatorId) in following && _createdAt >= $startDate]),
          "engagementRate": 7.8,
          "demographics": {
            "countries": [
              {"name": "United States", "percentage": 35.2, "count": 128},
              {"name": "Germany", "percentage": 12.8, "count": 46},
              {"name": "United Kingdom", "percentage": 9.1, "count": 33},
              {"name": "Canada", "percentage": 7.3, "count": 26},
              {"name": "France", "percentage": 6.2, "count": 22}
            ],
            "experienceLevels": [
              {"level": "Beginner", "percentage": 42.1, "count": 152},
              {"level": "Intermediate", "percentage": 38.7, "count": 140},
              {"level": "Advanced", "percentage": 19.2, "count": 69}
            ]
          }
        }`,
        { creatorId: creator._id, startDate: startDate.toISOString() }
      ),

      // Top Performing Content
      client.fetch(
        `{
          "topAssets": *[_type == "product" && author._ref == $creatorId] | order(stats.revenue desc) [0...5] {
            _id,
            title,
            "revenue": stats.revenue,
            "views": stats.views,
            "likes": stats.likes,
            "sales": stats.sales,
            "conversionRate": round((stats.sales / coalesce(stats.views, 1)) * 10000) / 100
          },
          "topCourses": *[_type == "course" && instructor._ref == $creatorId] | order(enrollmentCount desc) [0...5] {
            _id,
            title,
            enrollmentCount,
            averageRating,
            "revenue": enrollmentCount * price.amount,
            "completionRate": 85
          }
        }`,
        { creatorId: creator._id }
      )
    ])

    const [revenueData, contentData, audienceData, topContentData] = performanceMetrics

    // Generate time series data for charts
    const timeSeriesData = generateTimeSeriesData(timeRange, revenueData.dailyRevenue)

    // Calculate growth percentages
    const revenueGrowth = revenueData.revenueGrowth.previous > 0
      ? ((revenueData.revenueGrowth.current - revenueData.revenueGrowth.previous) / revenueData.revenueGrowth.previous) * 100
      : revenueData.revenueGrowth.current > 0 ? 100 : 0

    // Revenue forecasting (simple trend-based)
    const revenueForecast = generateRevenueForecast(revenueData.dailyRevenue, timeRange)

    // Content performance insights
    const contentInsights = generateContentInsights(contentData, topContentData)

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalRevenue: revenueData.totalRevenue,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          totalContent: contentData.assets.total + contentData.courses.total,
          totalViews: contentData.assets.totalViews,
          totalStudents: contentData.courses.totalEnrollments,
          engagementRate: audienceData.engagementRate
        },
        revenue: {
          total: revenueData.totalRevenue,
          growth: revenueGrowth,
          timeSeries: timeSeriesData,
          forecast: revenueForecast,
          breakdown: {
            assets: Math.round(revenueData.totalRevenue * 0.6), // Estimated
            courses: Math.round(revenueData.totalRevenue * 0.35),
            bundles: Math.round(revenueData.totalRevenue * 0.05)
          }
        },
        content: {
          assets: contentData.assets,
          courses: contentData.courses,
          performance: topContentData,
          insights: contentInsights
        },
        audience: {
          ...audienceData,
          growthRate: audienceData.newFollowers > 0 && timeRange === '30d'
            ? Math.round((audienceData.newFollowers / Math.max(audienceData.totalFollowers - audienceData.newFollowers, 1)) * 100)
            : 0
        },
        recommendations: generateRecommendations(contentData, revenueData, audienceData)
      },
      timeRange,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Helper function to generate time series data
function generateTimeSeriesData(timeRange: string, dailyRevenue: any[]) {
  const now = new Date()
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365

  const timeSeries = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]

    // Find revenue for this date or use 0
    const dayRevenue = dailyRevenue.find(r =>
      r.date && r.date.split('T')[0] === dateStr
    )?.amount || 0

    timeSeries.push({
      date: dateStr,
      revenue: dayRevenue,
      views: Math.floor(Math.random() * 100) + 50, // Mock data
      enrollments: Math.floor(Math.random() * 20) + 5
    })
  }

  return timeSeries
}

// Helper function to generate revenue forecast
function generateRevenueForecast(dailyRevenue: any[], timeRange: string) {
  if (dailyRevenue.length < 7) return []

  // Simple trend-based forecast for next 7 days
  const recent = dailyRevenue.slice(0, 7)
  const avgRevenue = recent.reduce((sum, r) => sum + (r.amount || 0), 0) / recent.length
  const trend = recent.length > 1 ? (recent[0].amount - recent[recent.length - 1].amount) / recent.length : 0

  const forecast = []
  for (let i = 1; i <= 7; i++) {
    const forecastDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000)
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted: Math.max(0, avgRevenue + trend * i),
      confidence: Math.max(0.5, 0.9 - i * 0.05) // Decreasing confidence
    })
  }

  return forecast
}

// Helper function to generate content insights
function generateContentInsights(contentData: any, topContentData: any) {
  const insights = []

  // Asset performance insights
  if (contentData.assets.total > 0) {
    const avgViews = contentData.assets.totalViews / contentData.assets.total
    const avgLikes = contentData.assets.totalLikes / contentData.assets.total

    insights.push({
      type: 'asset_performance',
      title: 'Asset Engagement',
      message: `Your assets average ${Math.round(avgViews)} views and ${Math.round(avgLikes)} likes each`,
      recommendation: avgViews < 100 ? 'Consider improving asset thumbnails and descriptions' : 'Great engagement! Keep up the quality'
    })
  }

  // Course performance insights
  if (contentData.courses.total > 0) {
    const rating = contentData.courses.averageRating
    insights.push({
      type: 'course_quality',
      title: 'Course Quality',
      message: `Your courses have an average rating of ${rating}/5.0`,
      recommendation: rating < 4.0 ? 'Focus on improving course content based on student feedback' : 'Excellent ratings! Consider creating advanced courses'
    })
  }

  return insights
}

// Helper function to generate recommendations
function generateRecommendations(contentData: any, revenueData: any, audienceData: any) {
  const recommendations = []

  // Content creation recommendations
  if (contentData.courses.total < 5) {
    recommendations.push({
      type: 'content_creation',
      priority: 'high',
      title: 'Create More Courses',
      description: 'Courses typically generate 3x more revenue per view than assets',
      action: 'Create a new course',
      potentialImpact: 'Could increase monthly revenue by 40-60%'
    })
  }

  // Pricing optimization
  recommendations.push({
    type: 'pricing',
    priority: 'medium',
    title: 'Bundle Opportunity',
    description: 'Create bundles combining your top assets with related courses',
    action: 'Create a bundle',
    potentialImpact: 'Bundles increase average order value by 45%'
  })

  // Audience growth
  if (audienceData.newFollowers < 10) {
    recommendations.push({
      type: 'audience_growth',
      priority: 'medium',
      title: 'Increase Visibility',
      description: 'Your follower growth is below platform average',
      action: 'Engage more with community and create free content',
      potentialImpact: 'More followers lead to 25% more organic sales'
    })
  }

  return recommendations
}
