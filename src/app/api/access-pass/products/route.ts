import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SimplifiedLicenseManager } from '@/lib/simplified-license-manager'
import { client } from '@/lib/sanity'

// GET - List all products available for access pass downloads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has active access pass using simplified manager
    const accessCheck = await SimplifiedLicenseManager.checkAccess(session.user.id)
    const accessPassResult = await SimplifiedLicenseManager.manageAccessPass('get', { userId: session.user.id })

    if (!accessCheck.hasAccess || accessCheck.method !== 'access_pass') {
      return NextResponse.json({
        error: 'Access pass required',
        hasAccessPass: false,
        message: 'You need an active access pass to access this endpoint'
      }, { status: 403 })
    }

    const accessPass = (accessPassResult && typeof accessPassResult !== 'boolean') ? accessPassResult : null

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category') || 'all'
    const sortBy = searchParams.get('sortBy') || 'newest'
    const search = searchParams.get('search') || ''
    const featured = searchParams.get('featured') === 'true'

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build filters
    let categoryFilter = ''
    if (category !== 'all') {
      categoryFilter = ` && references(*[_type=="category" && slug.current == "${category}"]._id)`
    }

    let searchFilter = ''
    if (search) {
      searchFilter = ` && (title match "*${search}*" || description match "*${search}*")`
    }

    let featuredFilter = ''
    if (featured) {
      featuredFilter = ' && featured == true'
    }

    // Access pass members can download all non-freebie products
    const accessFilter = ' && freebie != true'

    // Build sort order
    let sortOrder = ''
    switch (sortBy) {
      case 'newest':
        sortOrder = '| order(_createdAt desc)'
        break
      case 'oldest':
        sortOrder = '| order(_createdAt asc)'
        break
      case 'price-high':
        sortOrder = '| order(coalesce(salePrice, price) desc)'
        break
      case 'price-low':
        sortOrder = '| order(coalesce(salePrice, price) asc)'
        break
      case 'popular':
        sortOrder = '| order(stats.likes desc)'
        break
      case 'title':
        sortOrder = '| order(title asc)'
        break
      default:
        sortOrder = '| order(_createdAt desc)'
    }

    const query = `*[_type == "product"${accessFilter}${categoryFilter}${searchFilter}${featuredFilter}] ${sortOrder} [$offset...$end] {
      _id,
      title,
      slug,
      price,
      salePrice,
      description,
      freebie,
      featured,
      "images": images[] {
        asset-> {
          url
        }
      },
      "categories": categories[]-> {
        name,
        slug
      },
      "author": author-> {
        name,
        slug,
        image
      },
      stats {
        likes,
        downloads
      },
      fileTypes,
      _createdAt
    }`

    const countQuery = `count(*[_type == "product"${accessFilter}${categoryFilter}${searchFilter}${featuredFilter}])`

    // Execute queries
    const [products, totalCount] = await Promise.all([
      client.fetch(query, {
        offset,
        end: offset + limit
      }),
      client.fetch(countQuery)
    ])

    // Get user's download history for these products
    const productIds = products.map((p: any) => p._id)
    const licenseResult = await SimplifiedLicenseManager.getUserLicenses({
      userId: session.user.id,
      limit: 100 // Get more for better stats
    })

    // Add download status to each product
    const productsWithDownloadStatus = products.map((product: any) => ({
      ...product,
      downloadedByUser: licenseResult.licenses.some(
        license => license.product._id === product._id
      ),
      accessPassEligible: true, // All products are eligible for access pass downloads
      premiumFeatures: accessPass?.passType === 'yearly' || accessPass?.passType === 'lifetime'
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Get available categories for filtering
    const categories = await client.fetch(
      `*[_type == "category" && count(*[_type == "product" && references(^._id) && freebie != true]) > 0] | order(name asc) {
        _id,
        name,
        slug,
        "productCount": count(*[_type == "product" && references(^._id) && freebie != true])
      }`
    )

    return NextResponse.json({
      products: productsWithDownloadStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      },
      filters: {
        categories,
        currentCategory: category,
        currentSort: sortBy,
        currentSearch: search,
        showingFeatured: featured
      },
      accessPass: {
        type: accessPass?.passType,
        isActive: accessCheck.hasAccess,
        benefits: {
          unlimitedDownloads: true,
          commercialLicense: true,
          premiumFeatures: accessPass?.passType === 'yearly' || accessPass?.passType === 'lifetime',
          prioritySupport: true
        }
      },
      stats: {
        totalAvailableProducts: totalCount,
        userDownloads: licenseResult.stats.totalDownloads + (accessPass?.usage?.totalDownloads || 0),
        userLicenses: licenseResult.stats.totalLicenses
      }
    })

  } catch (error) {
    console.error('Error fetching access pass products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST - Get download recommendations based on user history
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has active access pass using simplified manager
    const accessCheck = await SimplifiedLicenseManager.checkAccess(session.user.id)

    if (!accessCheck.hasAccess || accessCheck.method !== 'access_pass') {
      return NextResponse.json({
        error: 'Access pass required'
      }, { status: 403 })
    }

    const { limit = 12, excludeDownloaded = true } = await request.json()

    // Get user's download history using simplified manager
    const licenseResult = await SimplifiedLicenseManager.getUserLicenses({
      userId: session.user.id,
      limit: 100
    })
    const { licenses } = licenseResult

    // Get categories from user's previous downloads
    const userCategories = licenses
      .map(license => license.product.categories || [])
      .flat()
      .filter(Boolean)

    const categoryNames = [...new Set(userCategories.map((cat: any) => cat.name))]

    // Get recommendations based on user's download history
    let recommendationQuery = `*[_type == "product" && freebie != true`

    if (categoryNames.length > 0) {
      const categoryFilter = categoryNames.map(name => `categories[]->name == "${name}"`).join(' || ')
      recommendationQuery += ` && (${categoryFilter})`
    }

    if (excludeDownloaded && licenses.length > 0) {
      const downloadedProductIds = licenses.map(l => l.product._id)
      const excludeFilter = downloadedProductIds.map(id => `_id != "${id}"`).join(' && ')
      recommendationQuery += ` && (${excludeFilter})`
    }

    recommendationQuery += `] | order(featured desc, stats.likes desc, _createdAt desc) [0...${limit}] {
      _id,
      title,
      slug,
      price,
      salePrice,
      description,
      featured,
      "images": images[] {
        asset-> {
          url
        }
      },
      "categories": categories[]-> {
        name,
        slug
      },
      "author": author-> {
        name,
        slug
      },
      stats {
        likes,
        downloads
      }
    }`

    const recommendations = await client.fetch(recommendationQuery)

    // If we don't have enough recommendations, get popular products
    if (recommendations.length < limit) {
      const remainingLimit = limit - recommendations.length
      const popularQuery = `*[_type == "product" && freebie != true] | order(stats.likes desc, _createdAt desc) [0...${remainingLimit * 2}] {
        _id,
        title,
        slug,
        price,
        salePrice,
        description,
        featured,
        "images": images[] {
          asset-> {
            url
          }
        },
        "categories": categories[]-> {
          name,
          slug
        },
        "author": author-> {
          name,
          slug
        },
        stats {
          likes,
          downloads
        }
      }`

      const popularProducts = await client.fetch(popularQuery)

      // Filter out products already in recommendations
      const recommendationIds = new Set(recommendations.map((r: any) => r._id))
      const filteredPopular = popularProducts.filter((p: any) => !recommendationIds.has(p._id))

      recommendations.push(...filteredPopular.slice(0, remainingLimit))
    }

    return NextResponse.json({
      recommendations,
      basedOn: {
        userCategories: categoryNames,
        downloadHistory: licenseResult.stats.totalDownloads > 0,
        licenseCount: licenses.length
      },
      message: categoryNames.length > 0
        ? `Recommended based on your ${categoryNames.join(', ')} downloads`
        : 'Popular products recommended for you'
    })

  } catch (error) {
    console.error('Error fetching product recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
