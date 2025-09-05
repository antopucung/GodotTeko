import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Sanity endpoint called')

    // Check categories
    const categories = await client.fetch(`
      *[_type == "category"] {
        _id,
        name,
        slug,
        description
      }
    `)

    console.log('📂 Categories found:', categories?.length || 0)

    // Check sample products with their categories
    const products = await client.fetch(`
      *[_type == "product"][0...5] {
        _id,
        title,
        slug,
        "categories": categories[]-> {
          title,
          slug
        }
      }
    `)

    console.log('📦 Sample products:', products?.length || 0)

    // Check specifically for games-related products
    const gamesProducts = await client.fetch(`
      *[_type == "product" && count((categories[]->slug.current)[@ == "games"]) > 0] {
        _id,
        title
      }
    `)

    console.log('🎮 Games products found:', gamesProducts?.length || 0)

    // Check for any products that might be game-related by title
    const gameRelatedProducts = await client.fetch(`
      *[_type == "product" && (title match "*game*" || title match "*Game*")] {
        _id,
        title,
        "categories": categories[]-> {
          title,
          slug
        }
      }
    `)

    console.log('🎮 Game-related products by title:', gameRelatedProducts?.length || 0)

    return NextResponse.json({
      success: true,
      data: {
        categories: categories || [],
        sampleProducts: products || [],
        gamesProducts: gamesProducts || [],
        gameRelatedProducts: gameRelatedProducts || []
      },
      counts: {
        categories: categories?.length || 0,
        sampleProducts: products?.length || 0,
        gamesProducts: gamesProducts?.length || 0,
        gameRelatedProducts: gameRelatedProducts?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Debug Sanity error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to fetch debug data from Sanity'
    }, { status: 500 })
  }
}
