import { NextRequest, NextResponse } from 'next/server'
import { client, queries } from '@/lib/sanity'
import { mockAuthors } from '@/data/mock-data'
import { Author, SocialLinks } from '@/types'

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// Transform Sanity author to our Author type
const transformSanityAuthor = (sanityAuthor: any): Author => {
  return {
    id: sanityAuthor._id,
    name: sanityAuthor.name,
    slug: sanityAuthor.slug?.current || '',
    bio: sanityAuthor.bio || '',
    avatar: sanityAuthor.avatar?.asset?.url,
    website: sanityAuthor.website,
    socialLinks: sanityAuthor.socialLinks as SocialLinks,
    isVerified: sanityAuthor.isVerified || false,
    isFeatured: sanityAuthor.isFeatured || false,
    productsCount: sanityAuthor.productsCount || 0,
    stats: {
      totalSales: sanityAuthor.stats?.totalSales || 0,
      totalEarnings: sanityAuthor.stats?.totalEarnings || 0,
      averageRating: sanityAuthor.stats?.averageRating || 0,
      followers: sanityAuthor.stats?.followers || 0
    },
    createdAt: sanityAuthor._createdAt,
    updatedAt: sanityAuthor._updatedAt
  }
}

export async function GET(request: NextRequest) {
  try {
    if (USE_MOCK_DATA) {
      console.log('Using mock data for authors API')
      const authors = mockAuthors
      return NextResponse.json(authors)
    }

    console.log('Fetching authors from Sanity')
    const sanityAuthors = await client.fetch(queries.authors)
    const authors = sanityAuthors.map(transformSanityAuthor)

    console.log(`Successfully fetched ${authors.length} authors from Sanity`)
    return NextResponse.json(authors)

  } catch (error) {
    console.error('Error in authors API route:', error)

    // Fallback to mock data on error
    console.log('Falling back to mock data due to error')
    const authors = mockAuthors
    return NextResponse.json(authors)
  }
}
