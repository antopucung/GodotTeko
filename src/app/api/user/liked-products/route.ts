import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/user/liked-products - Get user's liked products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's liked products
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        likedProducts[$offset...$end]->{
          _id,
          title,
          slug,
          price,
          originalPrice,
          currency,
          freebie,
          "images": images[]{
            asset->{
              url
            }
          },
          "author": author->{
            name,
            slug
          },
          "category": category->{
            name,
            slug
          },
          stats{
            likes,
            rating,
            reviewsCount
          }
        }
      }`,
      {
        userId: session.user.id,
        offset,
        end: offset + limit - 1
      }
    )

    const likedProducts = user?.likedProducts || []

    // Get total count
    const totalUser = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        "totalLiked": count(likedProducts)
      }`,
      { userId: session.user.id }
    )

    return NextResponse.json({
      products: likedProducts,
      pagination: {
        total: totalUser?.totalLiked || 0,
        limit,
        offset,
        hasMore: offset + limit < (totalUser?.totalLiked || 0)
      }
    })
  } catch (error) {
    console.error('Error fetching liked products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch liked products' },
      { status: 500 }
    )
  }
}
