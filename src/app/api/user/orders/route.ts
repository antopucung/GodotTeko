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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'

    // Build filter conditions
    let statusFilter = ''
    if (status !== 'all') {
      statusFilter = ` && status == "${status}"`
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Fetch orders with enhanced data structure
    const orders = await client.fetch(
      `*[_type == "order" && user._ref == $userId${statusFilter}] | order(_createdAt desc) [$offset...$end] {
        _id,
        orderNumber,
        items[] {
          product-> {
            _id,
            title,
            "image": images[0].asset->url,
            slug
          },
          quantity,
          price,
          salePrice,
          partnerCommission
        },
        orderType,
        "subtotal": pricing.subtotal,
        "tax": pricing.tax,
        "total": pricing.total,
        "currency": pricing.currency,
        status,
        paymentDetails {
          stripePaymentIntentId,
          paymentMethod,
          last4,
          brand,
          country
        },
        fulfillment {
          downloadTokens,
          licenseKeys
        },
        analytics {
          referralSource,
          location
        },
        "placedAt": timestamps.placedAt,
        "completedAt": timestamps.completedAt,
        "paidAt": timestamps.paidAt,
        _createdAt
      }`,
      {
        userId: session.user.id,
        offset,
        end: offset + limit
      }
    )

    // Get total count for pagination
    const totalCount = await client.fetch(
      `count(*[_type == "order" && user._ref == $userId${statusFilter}])`,
      { userId: session.user.id }
    )

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
