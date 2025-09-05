'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProductCard } from '@/components/cards'
import type { Product as ProductCardProduct } from '@/components/cards/ProductCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import EnhancedSearchFilters from '@/components/EnhancedSearchFilters'
import {
  Search,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { SearchFilters, Product, SearchResult } from '@/types'
import {
  getCachedResult,
  setCachedResult,
  generateCacheKey,
  getCacheStats
} from '@/lib/searchCache'
import { trackSearchEvent } from '@/lib/searchAnalytics'

interface EnhancedProductGridProps {
  initialProducts?: Product[]
  initialFilters?: SearchFilters
  showFilters?: boolean
  categorySlug?: string
  authorSlug?: string
  title?: string
  description?: string
  searchParams?: URLSearchParams | null
}

export default function EnhancedProductGrid({
  initialProducts = [],
  initialFilters = {},
  showFilters = true,
  categorySlug,
  authorSlug,
  title,
  description,
  searchParams
}: EnhancedProductGridProps) {

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult<Product> | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastFilters, setLastFilters] = useState<SearchFilters>({})

  // Fetch products with enhanced API and caching
  const fetchProducts = useCallback(async (filters: SearchFilters, page: number = 1) => {
    const searchStartTime = Date.now()

    try {
      setIsLoading(true)
      setError(null)

      // Check cache first
      const cachedResult = getCachedResult(filters, page)
      if (cachedResult) {
        const searchDuration = Date.now() - searchStartTime

        setProducts(cachedResult.data)
        setSearchResult(cachedResult)
        setCurrentPage(page)
        setIsLoading(false)

        // Track analytics for cached result
        if (filters.query) {
          trackSearchEvent(
            filters.query,
            filters,
            cachedResult.data.length,
            searchDuration,
            true // from cache
          )
        }

        return
      }

      // Build query parameters
      const params = new URLSearchParams()

      // Add pagination
      params.set('page', page.toString())
      params.set('limit', '20')

      // Add search and filter parameters
      if (filters.query) params.set('query', filters.query)
      if (filters.categories?.length) params.set('categories', filters.categories.join(','))
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.featured !== undefined) params.set('featured', filters.featured.toString())
      if (filters.freebie !== undefined) params.set('freebie', filters.freebie.toString())
      if (filters.author) params.set('author', filters.author)
      if (filters.priceRange) {
        params.set('priceMin', filters.priceRange[0].toString())
        params.set('priceMax', filters.priceRange[1].toString())
      }
      if (filters.fileTypes?.length) params.set('fileTypes', filters.fileTypes.join(','))
      if (filters.compatibleWith?.length) params.set('compatibleWith', filters.compatibleWith.join(','))
      if (filters.minRating) params.set('minRating', filters.minRating.toString())
      if (filters.dateRange) {
        params.set('dateFrom', filters.dateRange[0])
        params.set('dateTo', filters.dateRange[1])
      }

      // Add category or author context if provided
      if (categorySlug && !filters.categories?.length) {
        params.set('categories', categorySlug)
      }
      if (authorSlug && !filters.author) {
        params.set('author', authorSlug)
      }

      const response = await fetch(`/api/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: SearchResult<Product> = await response.json()
      const searchDuration = Date.now() - searchStartTime

      setProducts(result.data)
      setSearchResult(result)
      setCurrentPage(page)

      // Cache the result for future use
      setCachedResult(filters, result, page)

      // Track analytics for API result
      if (filters.query) {
        trackSearchEvent(
          filters.query,
          filters,
          result.data.length,
          searchDuration,
          false // from API
        )
      }

    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [categorySlug, authorSlug])

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(async (filters: SearchFilters, page: number) => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)

      // Check cache first
      const cachedResult = getCachedResult(filters, page)
      if (cachedResult && cachedResult.data.length > 0) {
        setProducts(prev => [...prev, ...cachedResult.data])
        setCurrentPage(page)
        setHasMore(page < (cachedResult.meta.totalPages || 1))
        setLoadingMore(false)
        return
      }

      // Build query parameters
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')

      // Add all filter parameters (same as fetchProducts)
      if (filters.query) params.set('query', filters.query)
      if (filters.categories?.length) params.set('categories', filters.categories.join(','))
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.featured !== undefined) params.set('featured', filters.featured.toString())
      if (filters.freebie !== undefined) params.set('freebie', filters.freebie.toString())
      if (filters.author) params.set('author', filters.author)
      if (filters.priceRange) {
        params.set('priceMin', filters.priceRange[0].toString())
        params.set('priceMax', filters.priceRange[1].toString())
      }
      if (filters.fileTypes?.length) params.set('fileTypes', filters.fileTypes.join(','))
      if (filters.compatibleWith?.length) params.set('compatibleWith', filters.compatibleWith.join(','))
      if (filters.minRating) params.set('minRating', filters.minRating.toString())

      if (categorySlug && !filters.categories?.length) {
        params.set('categories', categorySlug)
      }
      if (authorSlug && !filters.author) {
        params.set('author', authorSlug)
      }

      const response = await fetch(`/api/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: SearchResult<Product> = await response.json()

      // Append new products to existing ones
      setProducts(prev => [...prev, ...result.data])
      setCurrentPage(page)
      setHasMore(page < (result.meta.totalPages || 1))

      // Cache the result
      setCachedResult(filters, result, page)

    } catch (err) {
      console.error('Error loading more products:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, categorySlug, authorSlug])

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    setCurrentPage(1) // Reset to first page on filter change
    setHasMore(true) // Reset hasMore flag
    setLastFilters(filters) // Store current filters
    fetchProducts(filters, 1)
  }, [fetchProducts])



  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading && !loadingMore) {
          const nextPage = currentPage + 1
          loadMoreProducts(lastFilters, nextPage)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    const target = document.getElementById('infinite-scroll-trigger')
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [hasMore, isLoading, loadingMore, currentPage, lastFilters, loadMoreProducts])

  // Initial load and URL param changes
  useEffect(() => {
    const filters = parseFiltersFromURL()
    const mergedFilters = { ...initialFilters, ...filters }
    setLastFilters(mergedFilters)
    if (Object.keys(mergedFilters).length > 0 || products.length === 0) {
      fetchProducts(mergedFilters)
    }
  }, [searchParams, initialFilters, fetchProducts])

  // Transform Product to ProductCard Product type
  const transformProductForCard = (product: Product): ProductCardProduct => ({
    _id: product.id,
    title: product.title,
    slug: { current: product.slug || product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
    price: product.price,
    salePrice: product.salePrice,
    images: product.images?.map(img => ({ asset: { url: img.url } })),
    freebie: product.freebie,
    featured: product.featured,
    description: product.description,
    category: product.categories?.[0] ? { title: product.categories[0].name } : undefined,
    author: product.author ? {
      name: product.author.name,
      image: product.author.avatar
    } : undefined,
    stats: {
      likes: product.stats?.likes || 0
    }
  })

  const parseFiltersFromURL = (): SearchFilters => {
    if (!searchParams) return {}

    const params = new URLSearchParams(searchParams.toString())
    return {
      query: params.get('query') || undefined,
      categories: params.get('categories')?.split(',').filter(Boolean) || undefined,
      sortBy: (params.get('sortBy') as any) || 'relevance',
      featured: params.get('featured') === 'true' ? true :
                params.get('featured') === 'false' ? false : undefined,
      freebie: params.get('freebie') === 'true' ? true :
               params.get('freebie') === 'false' ? false : undefined,
      author: params.get('author') || undefined,
      priceRange: params.get('priceMin') && params.get('priceMax')
        ? [parseInt(params.get('priceMin')!), parseInt(params.get('priceMax')!)]
        : undefined,
      fileTypes: params.get('fileTypes')?.split(',').filter(Boolean) || undefined,
      compatibleWith: params.get('compatibleWith')?.split(',').filter(Boolean) || undefined,
      minRating: params.get('minRating') ? parseFloat(params.get('minRating')!) : undefined
    }
  }

  const renderProductGrid = () => {
    if (viewMode === 'list') {
      return (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <ProductCard
                    product={transformProductForCard(product)}
                    variant="category"
                    className="w-32 h-24"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {product.shortDescription || product.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="font-bold text-lg text-gray-900">
                      {product.freebie ? 'Free' : `$${product.price}`}
                    </span>
                    {product.stats && (
                      <>
                        <span className="text-sm text-gray-500">
                          ⭐ {product.stats.rating}/5
                        </span>
                        <span className="text-sm text-gray-500">
                          📥 {product.stats.downloads} downloads
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={transformProductForCard(product)} />
        ))}
      </div>
    )
  }

  const renderPerformanceMetrics = () => {
    if (!searchResult?.meta?.performance) return null

    const { performance } = searchResult.meta

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Search Performance:</span>
          </div>

          <div className="flex items-center gap-1">
            <span>{performance.resultsFound} results</span>
          </div>

          {performance.searchQuery && (
            <div className="flex items-center gap-1">
              <span>for "{performance.searchQuery}"</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <span>{performance.filtersApplied} filters applied</span>
          </div>

          {searchResult.meta.searchPerformed && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <TrendingUp className="w-3 h-3 mr-1" />
              Enhanced search
            </Badge>
          )}

          {searchResult.meta.cached && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Zap className="w-3 h-3 mr-1" />
              Cached result
            </Badge>
          )}
        </div>
      </div>
    )
  }

  const renderInfiniteScrollTrigger = () => {
    if (!searchResult?.meta) return null

    return (
      <div className="mt-8 text-center">
        {/* Results summary */}
        <div className="text-sm text-gray-600 mb-4">
          Showing {products.length} of {searchResult.meta.total} products
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div id="infinite-scroll-trigger" className="py-4">
            {loadingMore ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">Loading more products...</span>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Scroll down to load more products
              </div>
            )}
          </div>
        )}

        {/* End of results indicator */}
        {!hasMore && products.length > 0 && (
          <div className="py-6 text-gray-500 text-sm border-t border-gray-200">
            <span>You've reached the end of the results</span>
            {searchResult.meta.total > products.length && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filters = parseFiltersFromURL()
                    setCurrentPage(1)
                    setHasMore(true)
                    fetchProducts(filters, 1)
                  }}
                >
                  Start over
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Search Filters */}
      {showFilters && (
        <EnhancedSearchFilters
          initialFilters={initialFilters}
          onFiltersChange={handleFiltersChange}
          onSearchResults={setSearchResult}
          productCount={searchResult?.meta?.total || products.length}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={true}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
            )}
            {description && (
              <p className="text-lg text-gray-600 max-w-3xl">{description}</p>
            )}
            <Separator className="mt-6" />
          </div>
        )}

        {/* Performance Metrics */}
        {renderPerformanceMetrics()}

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => {
                  const filters = parseFiltersFromURL()
                  fetchProducts(filters, currentPage)
                }}
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Searching for products...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or filters to find what you're looking for.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" onClick={() => handleFiltersChange({ sortBy: 'relevance' })}>
                  Clear all filters
                </Button>
                <Button variant="outline" onClick={() => handleFiltersChange({ featured: true })}>
                  Show featured
                </Button>
                <Button variant="outline" onClick={() => handleFiltersChange({ freebie: true })}>
                  Show free products
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {!isLoading && !error && products.length > 0 && (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {searchResult?.meta?.searchPerformed ? 'Search Results' : 'Products'}
                </h2>
                {searchResult?.meta?.fallback && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Using fallback data
                  </Badge>
                )}
              </div>
            </div>

            {/* Product Grid */}
            {renderProductGrid()}

            {/* Infinite Scroll Trigger */}
            {renderInfiniteScrollTrigger()}
          </>
        )}
      </div>
    </div>
  )
}
