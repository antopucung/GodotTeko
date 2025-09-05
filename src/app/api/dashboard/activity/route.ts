import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Mock activity data - in production, fetch from database
    const activities = [
      {
        id: '1',
        type: 'download',
        title: 'Downloaded Medieval UI Kit',
        timestamp: '2 hours ago',
        product: {
          title: 'Medieval UI Kit',
          image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
          slug: 'medieval-ui-kit'
        }
      },
      {
        id: '2',
        type: 'purchase',
        title: 'Purchased 3D Character Pack',
        timestamp: '1 day ago',
        product: {
          title: '3D Character Pack',
          image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=400&fit=crop',
          slug: '3d-character-pack'
        }
      },
      {
        id: '3',
        type: 'favorite',
        title: 'Added to favorites: Cyberpunk Assets',
        timestamp: '3 days ago',
        product: {
          title: 'Cyberpunk Assets',
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop',
          slug: 'cyberpunk-assets'
        }
      },
      {
        id: '4',
        type: 'download',
        title: 'Downloaded Space Environment Pack',
        timestamp: '5 days ago',
        product: {
          title: 'Space Environment Pack',
          image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=400&fit=crop',
          slug: 'space-environment-pack'
        }
      },
      {
        id: '5',
        type: 'purchase',
        title: 'Purchased Animation Starter Kit',
        timestamp: '1 week ago',
        product: {
          title: 'Animation Starter Kit',
          image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
          slug: 'animation-starter-kit'
        }
      }
    ].slice(0, limit)

    return NextResponse.json({
      activities,
      totalCount: 15, // Mock total
      hasMore: activities.length === limit
    })
  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
