import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/products/[id]/reviews - Get reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const reviews = await client.fetch(
      `*[_type == "review" && product._ref == $productId && status == "published"] | order(_createdAt desc) [$offset...$end] {
        _id,
        _createdAt,
        rating,
        title,
        comment,
        helpful,
        user->{
          _id,
          name,
          image
        }
      }`,
      {
        productId: params.id,
        offset,
        end: offset + limit - 1
      }
    )

    // Get total count
    const totalCount = await client.fetch(
      `count(*[_type == "review" && product._ref == $productId && status == "published"])`,
      { productId: params.id }
    )

    // Calculate average rating
    const avgRating = await client.fetch(
      `math::avg(*[_type == "review" && product._ref == $productId && status == "published"].rating)`,
      { productId: params.id }
    )

    return NextResponse.json({
      reviews,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      averageRating: avgRating || 0
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/products/[id]/reviews - Create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { rating, title, comment } = await request.json()

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if user already reviewed this product
    const existingReview = await client.fetch(
      `*[_type == "review" && product._ref == $productId && user._ref == $userId][0]`,
      {
        productId: params.id,
        userId: session.user.id
      }
    )

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Create the review
    const review = await client.create({
      _type: 'review',
      product: { _type: 'reference', _ref: params.id },
      user: { _type: 'reference', _ref: session.user.id },
      rating,
      title: title || '',
      comment: comment || '',
      status: 'published'
    })

    // Update product stats
    const currentStats = await client.fetch(
      `*[_id == $productId][0].stats`,
      { productId: params.id }
    )

    const newReviewsCount = (currentStats?.reviewsCount || 0) + 1
    const currentRatingSum = (currentStats?.rating || 0) * (currentStats?.reviewsCount || 0)
    const newRating = (currentRatingSum + rating) / newReviewsCount

    await client
      .patch(params.id)
      .set({
        'stats.reviewsCount': newReviewsCount,
        'stats.rating': Math.round(newRating * 10) / 10 // Round to 1 decimal
      })
      .commit()

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
