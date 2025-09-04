import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// POST /api/products/[id]/like - Toggle like for a product
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

    // Get current user's liked products
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        _id,
        likedProducts[]->_id
      }`,
      { userId: session.user.id }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const likedProductIds = user.likedProducts || []
    const isLiked = likedProductIds.includes(params.id)

    // Toggle like status
    let updatedLikedProducts
    if (isLiked) {
      // Remove like
      updatedLikedProducts = likedProductIds.filter(id => id !== params.id)
    } else {
      // Add like
      updatedLikedProducts = [...likedProductIds, params.id]
    }

    // Update user's liked products
    await client
      .patch(session.user.id)
      .set({
        likedProducts: updatedLikedProducts.map(id => ({ _type: 'reference', _ref: id }))
      })
      .commit()

    // Update product like count
    const currentStats = await client.fetch(
      `*[_id == $productId][0].stats`,
      { productId: params.id }
    )

    const currentLikes = currentStats?.likes || 0
    const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1

    await client
      .patch(params.id)
      .set({
        'stats.likes': Math.max(0, newLikes) // Ensure likes don't go below 0
      })
      .commit()

    return NextResponse.json({
      success: true,
      isLiked: !isLiked,
      likes: Math.max(0, newLikes)
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

// GET /api/products/[id]/like - Check if user has liked product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        isLiked: false,
        likes: 0
      })
    }

    // Check if user has liked this product
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        likedProducts[]->_id
      }`,
      { userId: session.user.id }
    )

    const isLiked = user?.likedProducts?.includes(params.id) || false

    // Get product like count
    const product = await client.fetch(
      `*[_id == $productId][0].stats.likes`,
      { productId: params.id }
    )

    return NextResponse.json({
      isLiked,
      likes: product || 0
    })
  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    )
  }
}
