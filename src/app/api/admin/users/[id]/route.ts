import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin permissions
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch user with detailed information
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0] {
        _id,
        _createdAt,
        _updatedAt,
        name,
        email,
        image,
        role,
        verified,
        provider,
        providerId,
        bio,
        website,
        company,
        location,
        socialLinks,
        preferences,
        stats {
          totalPurchases,
          totalSpent,
          favoriteCategories,
          lastLoginAt
        },
        likedProducts[]->{
          _id,
          title,
          slug,
          price,
          images[0] {
            asset-> {
              url
            }
          }
        },
        partnerInfo {
          approved,
          approvedAt,
          approvedBy->{
            name,
            email
          },
          commissionRate,
          totalEarnings,
          productsPublished
        }
      }`,
      { userId: params.id }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's orders
    const orders = await client.fetch(
      `*[_type == "order" && user._ref == $userId] | order(_createdAt desc) [0...10] {
        _id,
        _createdAt,
        totalAmount,
        status,
        paymentMethod,
        items[] {
          product->{
            title,
            slug
          },
          quantity,
          price
        }
      }`,
      { userId: params.id }
    )

    // Get user's reviews
    const reviews = await client.fetch(
      `*[_type == "review" && user._ref == $userId] | order(_createdAt desc) [0...10] {
        _id,
        _createdAt,
        rating,
        title,
        comment,
        status,
        helpful,
        product->{
          title,
          slug
        }
      }`,
      { userId: params.id }
    )

    return NextResponse.json({
      user,
      orders,
      reviews,
      stats: {
        totalOrders: orders.length,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin permissions
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const updates = await request.json()

    // Validate updates - only allow safe admin updates
    const allowedFields = [
      'role', 'verified', 'bio', 'company', 'location',
      'partnerInfo.approved', 'partnerInfo.commissionRate'
    ]

    const sanitizedUpdates: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = value
      }
    }

    // Special handling for partner approval
    if (sanitizedUpdates['partnerInfo.approved'] === true) {
      sanitizedUpdates['partnerInfo.approvedAt'] = new Date().toISOString()
      sanitizedUpdates['partnerInfo.approvedBy'] = {
        _type: 'reference',
        _ref: session.user.id
      }
    }

    const result = await client
      .patch(params.id)
      .set(sanitizedUpdates)
      .commit()

    return NextResponse.json({
      success: true,
      user: result
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin permissions
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Soft delete by setting status to deleted
    // In production, you might want to anonymize data instead
    const result = await client
      .patch(params.id)
      .set({
        deletedAt: new Date().toISOString(),
        deletedBy: { _type: 'reference', _ref: session.user.id },
        status: 'deleted'
      })
      .commit()

    return NextResponse.json({
      success: true,
      message: 'User has been deleted'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
