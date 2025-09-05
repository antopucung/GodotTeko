import { NextRequest, NextResponse } from 'next/server'
import { SearchFilters, Product } from '@/types'

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// Search scoring algorithm for relevance
function calculateSearchScore(product: Product, searchTerm: string): number {
  if (!searchTerm) return 1

  const query = searchTerm.toLowerCase()
  let score = 0

  // Title match (highest weight)
  if (product.title.toLowerCase().includes(query)) {
    score += 10
    if (product.title.toLowerCase().startsWith(query)) {
      score += 5 // Bonus for starting with search term
    }
  }

  // Description match
  if (product.description?.toLowerCase().includes(query)) {
    score += 3
  }

  // Short description match
  if (product.shortDescription?.toLowerCase().includes(query)) {
    score += 2
  }

  // Category match
  if (product.categories?.some(cat => cat.name.toLowerCase().includes(query))) {
    score += 4
  }

  // Tag match
  if (product.tags?.some(tag => tag.name.toLowerCase().includes(query))) {
    score += 2
  }

  // Author match
  if (product.author?.name.toLowerCase().includes(query)) {
    score += 3
  }

  // Compatible software match
  if (product.compatibleWith?.some(software => software.toLowerCase().includes(query))) {
    score += 2
  }

  // File type match
  if (product.fileTypes?.some(type => type.toLowerCase().includes(query))) {
    score += 1
  }

  // Fuzzy matching bonus (for typos)
  const fuzzyScore = calculateFuzzyScore(product.title.toLowerCase(), query)
  score += fuzzyScore

  return score
}

// Simple fuzzy matching algorithm
function calculateFuzzyScore(text: string, query: string): number {
  if (text === query) return 5

  const distance = levenshteinDistance(text, query)
  const maxLength = Math.max(text.length, query.length)
  const similarity = 1 - distance / maxLength

  return similarity > 0.7 ? similarity * 2 : 0
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// Advanced filtering function
function applyAdvancedFilters(products: Product[], filters: SearchFilters): Product[] {
  let filteredProducts = products

  // Text search with scoring
  if (filters.query) {
    filteredProducts = products
      .map(product => ({
        ...product,
        searchScore: calculateSearchScore(product, filters.query!)
      }))
      .filter(product => product.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)
  }

  // Category filtering (multiple categories support)
  if (filters.categories?.length) {
    filteredProducts = filteredProducts.filter((product: Product) =>
      product.categories?.some((cat) =>
        cat.slug && filters.categories?.includes(cat.slug)
      )
    )
  }

  // Featured filter
  if (filters.featured !== undefined) {
    filteredProducts = filteredProducts.filter((product: Product) =>
      product.featured === filters.featured
    )
  }

  // Freebie filter
  if (filters.freebie !== undefined) {
    filteredProducts = filteredProducts.filter((product: Product) =>
      product.freebie === filters.freebie
    )
  }

  // Price range filter
  if (filters.priceRange && filters.priceRange.length === 2) {
    const [minPrice, maxPrice] = filters.priceRange
    filteredProducts = filteredProducts.filter((product: Product) => {
      const price = product.salePrice || product.price
      return price >= minPrice && price <= maxPrice
    })
  }

  // Author filter
  if (filters.author) {
    filteredProducts = filteredProducts.filter((product: Product) =>
      product.author?.slug === filters.author ||
      product.author?.name.toLowerCase().includes(filters.author!.toLowerCase())
    )
  }

  // File type filter
  if (filters.fileTypes?.length) {
    filteredProducts = filteredProducts.filter((product: Product) =>
      product.fileTypes?.some(type =>
        filters.fileTypes?.includes(type.toLowerCase())
      )
    )
  }

  // Compatible software filter
  if (filters.compatibleWith?.length) {
    filteredProducts = filteredProducts.filter((product: Product) =>
      product.compatibleWith?.some(software =>
        filters.compatibleWith?.includes(software.toLowerCase())
      )
    )
  }

  // Rating filter
  if (filters.minRating) {
    filteredProducts = filteredProducts.filter((product: Product) =>
      (product.stats?.rating || 0) >= filters.minRating!
    )
  }

  // Date range filter
  if (filters.dateRange && filters.dateRange.length === 2) {
    const [startDate, endDate] = filters.dateRange
    filteredProducts = filteredProducts.filter((product: Product) => {
      const productDate = new Date(product.createdAt || product.updatedAt)
      return productDate >= new Date(startDate) && productDate <= new Date(endDate)
    })
  }

  return filteredProducts
}

// Advanced sorting function
function applySorting(products: Product[], sortBy?: string, searchQuery?: string): Product[] {
  const sortedProducts = [...products]

  switch (sortBy) {
    case 'relevance':
      // If we have a search query, products are already sorted by relevance
      if (!searchQuery) {
        // Sort by featured, then rating, then downloads
        return sortedProducts.sort((a, b) => {
          if (a.featured !== b.featured) return b.featured ? 1 : -1
          const ratingDiff = (b.stats?.rating || 0) - (a.stats?.rating || 0)
          if (ratingDiff !== 0) return ratingDiff
          return (b.stats?.downloads || 0) - (a.stats?.downloads || 0)
        })
      }
      break

    case 'newest':
      return sortedProducts.sort((a, b) =>
        new Date(b.createdAt || b.updatedAt).getTime() -
        new Date(a.createdAt || a.updatedAt).getTime()
      )

    case 'oldest':
      return sortedProducts.sort((a, b) =>
        new Date(a.createdAt || a.updatedAt).getTime() -
        new Date(b.createdAt || b.updatedAt).getTime()
      )

    case 'price_low':
      return sortedProducts.sort((a, b) => {
        const priceA = a.salePrice || a.price
        const priceB = b.salePrice || b.price
        return priceA - priceB
      })

    case 'price_high':
      return sortedProducts.sort((a, b) => {
        const priceA = a.salePrice || a.price
        const priceB = b.salePrice || b.price
        return priceB - priceA
      })

    case 'popular':
      return sortedProducts.sort((a, b) =>
        (b.stats?.downloads || 0) - (a.stats?.downloads || 0)
      )

    case 'rating':
      return sortedProducts.sort((a, b) => {
        const ratingDiff = (b.stats?.rating || 0) - (a.stats?.rating || 0)
        if (ratingDiff !== 0) return ratingDiff
        // Secondary sort by review count
        return (b.stats?.reviews || 0) - (a.stats?.reviews || 0)
      })

    case 'trending':
      // Sort by recent downloads and high rating
      return sortedProducts.sort((a, b) => {
        const trendScoreA = ((a.stats?.downloads || 0) * 0.3) + ((a.stats?.rating || 0) * 2)
        const trendScoreB = ((b.stats?.downloads || 0) * 0.3) + ((b.stats?.rating || 0) * 2)
        return trendScoreB - trendScoreA
      })

    case 'alphabetical':
      return sortedProducts.sort((a, b) =>
        a.title.localeCompare(b.title)
      )

    case 'downloads':
      return sortedProducts.sort((a, b) =>
        (b.stats?.downloads || 0) - (a.stats?.downloads || 0)
      )

    default:
      // Default sort: featured first, then newest
      return sortedProducts.sort((a, b) => {
        if (a.featured !== b.featured) return b.featured ? 1 : -1
        return new Date(b.createdAt || b.updatedAt).getTime() -
               new Date(a.createdAt || a.updatedAt).getTime()
      })
  }

  return sortedProducts
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse enhanced query parameters
    const filters: SearchFilters = {
      query: searchParams.get('query') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
      sortBy: searchParams.get('sortBy') as any || 'relevance',
      featured: searchParams.get('featured') === 'true' ? true :
                searchParams.get('featured') === 'false' ? false : undefined,
      freebie: searchParams.get('freebie') === 'true' ? true :
               searchParams.get('freebie') === 'false' ? false : undefined,
      author: searchParams.get('author') || undefined,
      priceRange: searchParams.get('priceMin') && searchParams.get('priceMax')
        ? [parseInt(searchParams.get('priceMin')!), parseInt(searchParams.get('priceMax')!)]
        : undefined,
      fileTypes: searchParams.get('fileTypes')?.split(',').filter(Boolean) || undefined,
      compatibleWith: searchParams.get('compatibleWith')?.split(',').filter(Boolean) || undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      dateRange: searchParams.get('dateFrom') && searchParams.get('dateTo')
        ? [searchParams.get('dateFrom')!, searchParams.get('dateTo')!]
        : undefined
    }

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    console.log('Enhanced Products API called with filters:', filters)

    if (USE_MOCK_DATA) {
      console.log('Using mock data for products API')
      const { getProducts } = await import('@/data/mock-data')
      const allProducts = await getProducts()

      // Apply advanced filtering
      const filteredProducts = applyAdvancedFilters(allProducts, filters)

      // Apply sorting
      const sortedProducts = applySorting(filteredProducts, filters.sortBy, filters.query)

      // Apply pagination
      const totalCount = sortedProducts.length
      const totalPages = Math.ceil(totalCount / limit)
      const paginatedProducts = sortedProducts.slice(offset, offset + limit)

      return NextResponse.json({
        data: paginatedProducts,
        meta: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          filters: filters,
          searchPerformed: !!filters.query
        }
      })
    }

    // Import Sanity tools
    const { client, queries, transformSanityProduct } = await import('@/lib/sanity')

    // Build enhanced Sanity query
    let query = queries.products
    const params: any = {}

    // Enhanced search functionality
    if (filters.query) {
      // Use Sanity's full-text search with scoring
      query = `*[_type == "product" && (
        title match $searchTerm ||
        description match $searchTerm ||
        shortDescription match $searchTerm ||
        tags[]->name match $searchTerm ||
        categories[]->name match $searchTerm ||
        author->name match $searchTerm
      )] {
        ...,
        "searchScore": boost(
          title match $searchTerm, 10) +
          boost(description match $searchTerm, 3) +
          boost(categories[]->name match $searchTerm, 4) +
          boost(tags[]->name match $searchTerm, 2) +
          boost(author->name match $searchTerm, 3
        )
      }`
      params.searchTerm = `*${filters.query}*`
    }

    // Add advanced filtering to Sanity query
    const queryFilters = []

    if (filters.categories?.length) {
      queryFilters.push(`categories[]->slug in $categories`)
      params.categories = filters.categories
    }

    if (filters.featured !== undefined) {
      queryFilters.push(`featured == $featured`)
      params.featured = filters.featured
    }

    if (filters.freebie !== undefined) {
      queryFilters.push(`freebie == $freebie`)
      params.freebie = filters.freebie
    }

    if (filters.priceRange) {
      queryFilters.push(`price >= $minPrice && price <= $maxPrice`)
      params.minPrice = filters.priceRange[0]
      params.maxPrice = filters.priceRange[1]
    }

    if (filters.author) {
      queryFilters.push(`author->slug == $authorSlug`)
      params.authorSlug = filters.author
    }

    if (filters.minRating) {
      queryFilters.push(`stats.rating >= $minRating`)
      params.minRating = filters.minRating
    }

    // Apply filters to query
    if (queryFilters.length > 0) {
      const filterString = queryFilters.join(' && ')
      if (filters.query) {
        query = query.replace('] {', ` && ${filterString}] {`)
      } else {
        query = `*[_type == "product" && ${filterString}]`
      }
    }

    // Add sorting to Sanity query
    const sortQuery = getSanitySortQuery(filters.sortBy, !!filters.query)
    query += sortQuery

    // Add pagination
    query += `[${offset}...${offset + limit}]`

    console.log('Fetching products from Sanity with enhanced query:', query.substring(0, 150) + '...')

    // Execute query
    const sanityProducts = await client.fetch(query, params)
    console.log(`Fetched ${sanityProducts.length} products from Sanity`)

    // Transform products
    let products = sanityProducts.map(transformSanityProduct)

    // Apply client-side filtering for complex operations not supported by Sanity
    if (filters.fileTypes?.length || filters.compatibleWith?.length || filters.dateRange) {
      products = applyAdvancedFilters(products, filters)
    }

    // Apply client-side sorting if needed (for complex scoring)
    if (filters.query && filters.sortBy === 'relevance') {
      products = applySorting(products, filters.sortBy, filters.query)
    }

    // Get total count for pagination (approximate for performance)
    let totalCount = products.length
    let totalPages = 1

    if (products.length === limit) {
      // If we got a full page, estimate total count
      const countQuery = query.split('[')[0] // Remove pagination
      const totalCountResult = await client.fetch(`count(${countQuery})`, params)
      totalCount = totalCountResult || products.length
      totalPages = Math.ceil(totalCount / limit)
    }

    console.log(`Successfully processed ${products.length} products with enhanced filtering`)

    return NextResponse.json({
      data: products,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        filters: filters,
        searchPerformed: !!filters.query,
        performance: {
          resultsFound: products.length,
          searchQuery: filters.query,
          filtersApplied: Object.keys(filters).filter(key => filters[key] !== undefined).length
        }
      }
    })

  } catch (error) {
    console.error('Error in enhanced products API route:', error)

    // Enhanced fallback to mock data
    try {
      console.log('Falling back to mock data with enhanced filtering')
      const { getProducts } = await import('@/data/mock-data')
      const allProducts = await getProducts()

      // Parse filters for fallback
      const { searchParams } = new URL(request.url)
      const filters: SearchFilters = {
        query: searchParams.get('query') || undefined,
        categories: searchParams.get('categories')?.split(',').filter(Boolean) || undefined,
        sortBy: searchParams.get('sortBy') as any || 'relevance'
      }

      const filteredProducts = applyAdvancedFilters(allProducts, filters)
      const sortedProducts = applySorting(filteredProducts, filters.sortBy, filters.query)

      return NextResponse.json({
        data: sortedProducts,
        meta: {
          page: 1,
          limit: sortedProducts.length,
          total: sortedProducts.length,
          totalPages: 1,
          fallback: true,
          error: 'Using mock data due to API error'
        }
      })
    } catch (fallbackError) {
      console.error('Even enhanced mock data failed:', fallbackError)
      return NextResponse.json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        meta: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 0
        }
      }, { status: 500 })
    }
  }
}

// Helper function to generate Sanity sort queries
function getSanitySortQuery(sortBy?: string, hasSearch?: boolean): string {
  switch (sortBy) {
    case 'relevance':
      return hasSearch ? ' | order(searchScore desc)' : ' | order(featured desc, stats.rating desc, _createdAt desc)'
    case 'newest':
      return ' | order(_createdAt desc)'
    case 'oldest':
      return ' | order(_createdAt asc)'
    case 'price_low':
      return ' | order(price asc)'
    case 'price_high':
      return ' | order(price desc)'
    case 'popular':
      return ' | order(stats.downloads desc)'
    case 'rating':
      return ' | order(stats.rating desc, stats.reviews desc)'
    case 'trending':
      return ' | order(stats.downloads desc, stats.rating desc)'
    case 'alphabetical':
      return ' | order(title asc)'
    case 'downloads':
      return ' | order(stats.downloads desc)'
    default:
      return ' | order(featured desc, _createdAt desc)'
  }
}
