import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/admin/reviews - Get all reviews with filtering and moderation
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
    const status = searchParams.get('status') || 'all'
    const rating = searchParams.get('rating') || ''
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    // Build query filters
    let filters = [`_type == "review"`]

    if (status !== 'all') {
      filters.push(`status == "${status}"`)
    }

    if (rating) {
      filters.push(`rating == ${parseInt(rating)}`)
    }

    if (search) {
      filters.push(`(title match "*${search}*" || comment match "*${search}*" || user->name match "*${search}*" || product->title match "*${search}*")`)
    }

    const filterQuery = filters.join(' && ')

    // Fetch reviews with detailed information
    const reviews = await client.fetch(
      `*[${filterQuery}] | order(_createdAt desc) [$offset...$end] {
        _id,
        _createdAt,
        _updatedAt,
        rating,
        title,
        comment,
        status,
        helpful,
        user->{
          _id,
          name,
          email,
          image,
          role
        },
        product->{
          _id,
          title,
          slug,
          images[0] {
            asset-> {
              url
            }
          }
        }
      }`,
      {
        offset,
        end: offset + limit - 1
      }
    )

    // Get total count
    const totalReviews = await client.fetch(
      `count(*[${filterQuery}])`,
      {}
    )

    // Get review statistics
    const stats = await client.fetch(
      `{
        "total": count(*[_type == "review"]),
        "published": count(*[_type == "review" && status == "published"]),
        "pending": count(*[_type == "review" && status == "pending"]),
        "hidden": count(*[_type == "review" && status == "hidden"]),
        "averageRating": math::avg(*[_type == "review" && status == "published"].rating),
        "totalHelpful": sum(*[_type == "review" && status == "published"].helpful)
      }`
    )

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
        hasMore: offset + limit < totalReviews
      },
      stats
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/reviews - Bulk review moderation
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

    const { action, reviewIds, reason } = await request.json()

    if (!action || !reviewIds || !Array.isArray(reviewIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Process bulk actions
    const results = []

    for (const reviewId of reviewIds) {
      try {
        let updateData: any = {
          moderatedAt: new Date().toISOString(),
          moderatedBy: { _type: 'reference', _ref: session.user.id }
        }

        switch (action) {
          case 'approve':
            updateData.status = 'published'
            break
          case 'reject':
            updateData.status = 'hidden'
            if (reason) updateData.moderationReason = reason
            break
          case 'pending':
            updateData.status = 'pending'
            break
          default:
            throw new Error(`Unknown action: ${action}`)
        }

        const result = await client
          .patch(reviewId)
          .set(updateData)
          .commit()

        // Update product rating if review was approved/rejected
        if (action === 'approve' || action === 'reject') {
          const review = await client.fetch(
            `*[_id == $reviewId][0]{ rating, product }`,
            { reviewId }
          )

          if (review?.product?._ref) {
            await updateProductRating(review.product._ref)
          }
        }

        results.push({ reviewId, success: true, result })
      } catch (error) {
        results.push({ reviewId, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: reviewIds.length,
        successful: successCount,
        failed: failureCount
      }
    })
  } catch (error) {
    console.error('Error performing bulk review action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}

// Helper function to update product rating after review moderation
async function updateProductRating(productId: string) {
  try {
    // Get all published reviews for this product
    const reviews = await client.fetch(
      `*[_type == "review" && product._ref == $productId && status == "published"]{ rating }`,
      { productId }
    )

    const reviewCount = reviews.length
    const averageRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0

    // Update product stats
    await client
      .patch(productId)
      .set({
        'stats.reviewsCount': reviewCount,
        'stats.rating': Math.round(averageRating * 10) / 10
      })
      .commit()
  } catch (error) {
    console.error('Error updating product rating:', error)
  }
}
