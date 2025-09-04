import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET - Check if user has partner access
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        hasAccess: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // For now, we'll use a simple approach - check if user has any products or is marked as partner
    // In production, you'd have a proper role system in your user schema

    // Check if user is marked as partner in Sanity or has created products
    const partnerCheck = await client.fetch(
      `{
        "isPartner": defined(*[_type == "user" && _id == $userId && partner == true][0]),
        "hasProducts": count(*[_type == "product" && author._ref == $userId]) > 0,
        "recentActivity": count(*[_type == "order" && items[].product->author._ref == $userId && _createdAt > dateTime(now()) - 60*60*24*30]) > 0
      }`,
      { userId: session.user.id }
    )

    const hasAccess = partnerCheck.isPartner || partnerCheck.hasProducts || partnerCheck.recentActivity

    // For development/demo purposes, allow access for any authenticated user
    // Remove this in production and implement proper partner verification
    const developmentAccess = process.env.NODE_ENV === 'development' ||
                             process.env.NEXT_PUBLIC_PARTNER_DEMO_MODE === 'true'

    if (!hasAccess && !developmentAccess) {
      return NextResponse.json({
        hasAccess: false,
        message: 'Partner access required. Apply to become a partner to access these features.',
        canApply: true
      })
    }

    // Get partner stats for dashboard
    const partnerStats = await client.fetch(
      `{
        "totalProducts": count(*[_type == "product" && author._ref == $userId]),
        "totalSales": count(*[_type == "order" && items[].product->author._ref == $userId]),
        "totalEarnings": sum(*[_type == "order" && items[].product->author._ref == $userId].total),
        "pendingUploads": count(*[_type == "product" && author._ref == $userId && !defined(assets)]),
        "recentOrders": *[_type == "order" && items[].product->author._ref == $userId] | order(_createdAt desc) [0...5] {
          _id,
          orderNumber,
          total,
          _createdAt,
          "items": items[] {
            product-> {
              title,
              price
            }
          }
        }
      }`,
      { userId: session.user.id }
    )

    return NextResponse.json({
      hasAccess: true,
      isDevelopmentMode: developmentAccess && !hasAccess,
      partner: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        stats: partnerStats
      }
    })

  } catch (error) {
    console.error('Error checking partner access:', error)
    return NextResponse.json(
      {
        hasAccess: false,
        error: 'Failed to verify partner access'
      },
      { status: 500 }
    )
  }
}

// POST - Apply for partner access (for future implementation)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { portfolio, experience, reason } = await request.json()

    // Create partner application in Sanity
    const application = await client.create({
      _type: 'partnerApplication',
      user: {
        _type: 'reference',
        _ref: session.user.id
      },
      portfolio,
      experience,
      reason,
      status: 'pending',
      appliedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      applicationId: application._id,
      message: 'Partner application submitted successfully. We will review your application within 48 hours.'
    })

  } catch (error) {
    console.error('Error submitting partner application:', error)
    return NextResponse.json(
      { error: 'Failed to submit partner application' },
      { status: 500 }
    )
  }
}
