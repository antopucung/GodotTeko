import { NextRequest, NextResponse } from 'next/server'
import { client, queries } from '@/lib/sanity'
import { mockCategories } from '@/data/mock-data'
import { Category } from '@/types'

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// Transform Sanity category to our Category type
const transformSanityCategory = (sanityCategory: any): Category => {
  return {
    id: sanityCategory._id,
    name: sanityCategory.name,
    slug: sanityCategory.slug?.current || '',
    description: sanityCategory.description || '',
    icon: sanityCategory.icon,
    color: sanityCategory.color,
    productCount: sanityCategory.productCount || 0,
    isActive: sanityCategory.isActive !== false,
    order: sanityCategory.order || 0,
    createdAt: sanityCategory._createdAt,
    updatedAt: sanityCategory._updatedAt
  }
}

export async function GET(request: NextRequest) {
  try {
    if (USE_MOCK_DATA) {
      console.log('Using mock data for categories API')
      const categories = mockCategories
      return NextResponse.json(categories)
    }

    console.log('Fetching categories from Sanity')
    const sanityCategories = await client.fetch(queries.categories + ' | order(order asc)')
    const categories = sanityCategories.map(transformSanityCategory)

    console.log(`Successfully fetched ${categories.length} categories from Sanity`)
    return NextResponse.json(categories)

  } catch (error) {
    console.error('Error in categories API route:', error)

    // Fallback to mock data on error
    console.log('Falling back to mock data due to error')
    const categories = mockCategories
    return NextResponse.json(categories)
  }
}
