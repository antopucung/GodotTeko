import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/admin/users - Get all users with filtering and pagination
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const offset = (page - 1) * limit

    // Build query filters
    let filters = [`_type == "user"`]

    if (search) {
      filters.push(`(name match "*${search}*" || email match "*${search}*")`)
    }

    if (role && role !== 'all') {
      filters.push(`role == "${role}"`)
    }

    if (status === 'verified') {
      filters.push(`verified == true`)
    } else if (status === 'unverified') {
      filters.push(`verified == false`)
    }

    const filterQuery = filters.join(' && ')

    // Fetch users with pagination
    const users = await client.fetch(
      `*[${filterQuery}] | order(_createdAt desc) [$offset...$end] {
        _id,
        _createdAt,
        _updatedAt,
        name,
        email,
        image,
        role,
        verified,
        provider,
        bio,
        company,
        location,
        stats {
          totalPurchases,
          totalSpent,
          lastLoginAt
        },
        likedProducts,
        partnerInfo {
          approved,
          approvedAt,
          totalEarnings,
          productsPublished
        }
      }`,
      {
        offset,
        end: offset + limit - 1
      }
    )

    // Get total count
    const totalUsers = await client.fetch(
      `count(*[${filterQuery}])`,
      {}
    )

    // Get role statistics
    const roleStats = await client.fetch(
      `{
        "admin": count(*[_type == "user" && role == "admin"]),
        "partner": count(*[_type == "user" && role == "partner"]),
        "user": count(*[_type == "user" && role == "user"]),
        "verified": count(*[_type == "user" && verified == true]),
        "unverified": count(*[_type == "user" && verified == false])
      }`
    )

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        hasMore: offset + limit < totalUsers
      },
      stats: roleStats
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users - Bulk user actions
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin permissions
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { action, userIds, data } = await request.json()

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Process bulk actions
    const results = []

    for (const userId of userIds) {
      try {
        let updateData: any = {}

        switch (action) {
          case 'verify':
            updateData = { verified: true }
            break
          case 'unverify':
            updateData = { verified: false }
            break
          case 'promote_partner':
            updateData = {
              role: 'partner',
              'partnerInfo.approved': true,
              'partnerInfo.approvedAt': new Date().toISOString(),
              'partnerInfo.approvedBy': { _type: 'reference', _ref: session.user.id }
            }
            break
          case 'demote_user':
            updateData = { role: 'user' }
            break
          case 'update_role':
            if (data?.role) {
              updateData = { role: data.role }
            }
            break
          default:
            throw new Error(`Unknown action: ${action}`)
        }

        const result = await client
          .patch(userId)
          .set(updateData)
          .commit()

        results.push({ userId, success: true, result })
      } catch (error) {
        results.push({ userId, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: userIds.length,
        successful: successCount,
        failed: failureCount
      }
    })
  } catch (error) {
    console.error('Error performing bulk user action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
