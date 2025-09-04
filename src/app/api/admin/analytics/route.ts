import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/admin/analytics - Get platform analytics and insights
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin permissions
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const metric = searchParams.get('metric') || 'overview'

    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    const startDateISO = startDate.toISOString()

    // Core platform metrics
    const coreMetrics = await client.fetch(`
      {
        "totalUsers": count(*[_type == "user"]),
        "totalProducts": count(*[_type == "product"]),
        "totalReviews": count(*[_type == "review"]),
        "totalOrders": count(*[_type == "order"]),
        "recentUsers": count(*[_type == "user" && _createdAt > $startDate]),
        "recentProducts": count(*[_type == "product" && _createdAt > $startDate]),
        "recentReviews": count(*[_type == "review" && _createdAt > $startDate]),
        "recentOrders": count(*[_type == "order" && _createdAt > $startDate])
      }
    `, { startDate: startDateISO })

    // User analytics
    const userAnalytics = await client.fetch(`
      {
        "userGrowth": *[_type == "user" && _createdAt > $startDate] | order(_createdAt asc) {
          _createdAt,
          role
        },
        "usersByRole": {
          "admin": count(*[_type == "user" && role == "admin"]),
          "partner": count(*[_type == "user" && role == "partner"]),
          "user": count(*[_type == "user" && role == "user"])
        },
        "verificationStatus": {
          "verified": count(*[_type == "user" && verified == true]),
          "unverified": count(*[_type == "user" && verified == false])
        },
        "authProviders": {
          "credentials": count(*[_type == "user" && provider == "credentials"]),
          "google": count(*[_type == "user" && provider == "google"]),
          "github": count(*[_type == "user" && provider == "github"])
        }
      }
    `, { startDate: startDateISO })

    // Product analytics
    const productAnalytics = await client.fetch(`
      {
        "productsByCategory": *[_type == "category"]{
          name,
          "productCount": count(*[_type == "product" && references(^._id)])
        },
        "productsByStatus": {
          "published": count(*[_type == "product" && status == "published"]),
          "draft": count(*[_type == "product" && status == "draft"]),
          "archived": count(*[_type == "product" && status == "archived"])
        },
        "freeVsPaid": {
          "free": count(*[_type == "product" && freebie == true]),
          "paid": count(*[_type == "product" && freebie == false])
        },
        "topProducts": *[_type == "product"] | order(stats.likes desc) [0...10] {
          _id,
          title,
          slug,
          price,
          stats
        },
        "recentProducts": *[_type == "product" && _createdAt > $startDate] | order(_createdAt desc) [0...10] {
          _id,
          title,
          slug,
          _createdAt,
          author->{name}
        }
      }
    `, { startDate: startDateISO })

    // Review and engagement analytics
    const engagementAnalytics = await client.fetch(`
      {
        "reviewsByRating": {
          "5star": count(*[_type == "review" && rating == 5 && status == "published"]),
          "4star": count(*[_type == "review" && rating == 4 && status == "published"]),
          "3star": count(*[_type == "review" && rating == 3 && status == "published"]),
          "2star": count(*[_type == "review" && rating == 2 && status == "published"]),
          "1star": count(*[_type == "review" && rating == 1 && status == "published"])
        },
        "reviewModeration": {
          "published": count(*[_type == "review" && status == "published"]),
          "pending": count(*[_type == "review" && status == "pending"]),
          "hidden": count(*[_type == "review" && status == "hidden"])
        },
        "averageRating": math::avg(*[_type == "review" && status == "published"].rating),
        "totalLikes": sum(*[_type == "product"].stats.likes),
        "mostLikedProducts": *[_type == "product" && stats.likes > 0] | order(stats.likes desc) [0...5] {
          title,
          slug,
          "likes": stats.likes,
          author->{name}
        },
        "recentReviews": *[_type == "review" && _createdAt > $startDate] | order(_createdAt desc) [0...10] {
          _id,
          rating,
          title,
          _createdAt,
          user->{name},
          product->{title}
        }
      }
    `, { startDate: startDateISO })

    // Partner analytics (if applicable)
    const partnerAnalytics = await client.fetch(`
      {
        "totalPartners": count(*[_type == "user" && role == "partner"]),
        "approvedPartners": count(*[_type == "user" && role == "partner" && partnerInfo.approved == true]),
        "pendingPartners": count(*[_type == "user" && role == "partner" && partnerInfo.approved == false]),
        "topPartners": *[_type == "user" && role == "partner" && partnerInfo.approved == true] | order(partnerInfo.totalEarnings desc) [0...10] {
          _id,
          name,
          email,
          partnerInfo {
            totalEarnings,
            productsPublished
          }
        },
        "partnerProductsByStatus": *[_type == "product" && author->role == "partner"] {
          status
        }
      }
    `)

    // Growth trends (simplified - daily counts for the period)
    const growthTrends = await generateGrowthTrends(startDateISO, daysAgo)

    const analytics = {
      period: daysAgo,
      lastUpdated: new Date().toISOString(),
      overview: coreMetrics,
      users: userAnalytics,
      products: productAnalytics,
      engagement: engagementAnalytics,
      partners: partnerAnalytics,
      trends: growthTrends
    }

    // Return specific metric if requested
    if (metric !== 'overview' && analytics[metric as keyof typeof analytics]) {
      return NextResponse.json({
        [metric]: analytics[metric as keyof typeof analytics],
        period: daysAgo,
        lastUpdated: analytics.lastUpdated
      })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Helper function to generate growth trends
async function generateGrowthTrends(startDate: string, days: number) {
  try {
    const trends = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayData = await client.fetch(`
        {
          "date": $date,
          "newUsers": count(*[_type == "user" && _createdAt >= $dayStart && _createdAt <= $dayEnd]),
          "newProducts": count(*[_type == "product" && _createdAt >= $dayStart && _createdAt <= $dayEnd]),
          "newReviews": count(*[_type == "review" && _createdAt >= $dayStart && _createdAt <= $dayEnd]),
          "newOrders": count(*[_type == "order" && _createdAt >= $dayStart && _createdAt <= $dayEnd])
        }
      `, {
        date: date.toISOString().split('T')[0],
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString()
      })

      trends.push(dayData)
    }

    return trends
  } catch (error) {
    console.error('Error generating growth trends:', error)
    return []
  }
}
