'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Star,
  Download,
  Heart,
  ShoppingCart,
  Grid3X3,
  List,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Smartphone,
  RefreshCw,
  ChevronDown,
  Eye
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/styles/component-variants'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'

interface Product {
  _id: string
  title: string
  slug: { current: string }
  price: number
  salePrice?: number
  description: string
  freebie: boolean
  featured: boolean
  images: Array<{ asset: { url: string } }>
  categories: Array<{ name: string; slug: { current: string } }>
  author: { name: string; slug: { current: string } }
  stats: { likes: number; downloads: number }
  fileTypes: string[]
  _createdAt: string
}

interface ProductFilters {
  search: string
  category: string
  sortBy: string
  priceRange: string
  featured: boolean
  freebie: boolean
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const { addToCart } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreProducts, setHasMoreProducts] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams?.get('search') || '',
    category: searchParams?.get('category') || 'all',
    sortBy: 'newest',
    priceRange: 'all',
    featured: false,
    freebie: false
  })

  const fetchProducts = useCallback(async (page = 1, resetData = false) => {
    try {
      if (resetData) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        category: filters.category,
        sortBy: filters.sortBy,
        featured: filters.featured.toString()
      })

      if (filters.search) {
        params.append('search', filters.search)
      }

      if (filters.freebie) {
        params.append('freebie', 'true')
      }

      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()

      if (resetData || page === 1) {
        setProducts(data.products)
        setCategories(data.filters.categories)
      } else {
        setProducts(prev => [...prev, ...data.products])
      }

      setHasMoreProducts(data.pagination.hasNextPage)
      setTotalCount(data.pagination.totalCount)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProducts(1, true)
  }, [fetchProducts])

  const loadMoreProducts = () => {
    if (!isLoadingMore && hasMoreProducts) {
      fetchProducts(currentPage + 1, false)
    }
  }

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop
          >= document.documentElement.offsetHeight - 1000) {
        loadMoreProducts()
      }
    }

    const throttledScroll = throttle(handleScroll, 200)
    window.addEventListener('scroll', throttledScroll)
    return () => window.removeEventListener('scroll', throttledScroll)
  }, [currentPage, hasMoreProducts, isLoadingMore])

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product)
      toast.success(`${product.title} added to cart!`)
    } catch (error) {
      toast.error('Failed to add to cart')
    }
  }

  const toggleFavorite = async (productId: string) => {
    try {
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      if (response.ok) {
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          if (newFavorites.has(productId)) {
            newFavorites.delete(productId)
            toast.success('Removed from favorites')
          } else {
            newFavorites.add(productId)
            toast.success('Added to favorites')
          }
          return newFavorites
        })
      }
    } catch (error) {
      toast.error('Failed to update favorites')
    }
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      sortBy: 'newest',
      priceRange: 'all',
      featured: false,
      freebie: false
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first header */}
      <div className="bg-white border-b sticky top-0 z-40 safe-area-top">
        <div className="mobile-container">
          <div className="py-4 space-y-4">
            {/* Title and view toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mobile-title">Discover</h1>
                <p className="mobile-caption">{totalCount} products available</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="touch-target desktop-only"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="touch-target"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <span className="mobile-only">Filters</span>
                  <span className="desktop-only">Filter & Sort</span>
                </Button>
              </div>
            </div>

            {/* Mobile-optimized search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search designs, templates, and more..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="mobile-input pl-10"
              />
            </div>

            {/* Expandable filters */}
            {showFilters && (
              <Card className="mobile-card mobile-slide-up">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Quick filter buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={filters.featured ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, featured: !prev.featured }))}
                        className="text-xs"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Button>
                      <Button
                        variant={filters.freebie ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, freebie: !prev.freebie }))}
                        className="text-xs"
                      >
                        Free
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reset
                      </Button>
                    </div>

                    {/* Dropdowns */}
                    <div className="mobile-grid mobile-grid-2">
                      <Select
                        value={filters.category}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="mobile-input">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.slug.current} value={category.slug.current}>
                              {category.name} ({category.productCount})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                      >
                        <SelectTrigger className="mobile-input">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="popular">Most Popular</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="title">Alphabetical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Active filters display */}
                    {(filters.search || filters.category !== 'all' || filters.featured || filters.freebie) && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {filters.search && (
                          <Badge variant="secondary" className="text-xs">
                            "{filters.search}"
                          </Badge>
                        )}
                        {filters.category !== 'all' && (
                          <Badge variant="secondary" className="text-xs">
                            {categories.find(c => c.slug.current === filters.category)?.name || filters.category}
                          </Badge>
                        )}
                        {filters.featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                        {filters.freebie && (
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="mobile-container">
        <div className="py-6">
          {isLoading ? (
            <div className={cn(
              "mobile-grid",
              viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-2"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="mobile-card">
                  <div className="animate-pulse">
                    <div className="mobile-skeleton aspect-[4/3] rounded-t-lg"></div>
                    <div className="p-4 space-y-3">
                      <div className="mobile-skeleton-title"></div>
                      <div className="mobile-skeleton-text"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className={cn(
                "mobile-grid",
                viewMode === 'grid'
                  ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "lg:grid-cols-2"
              )}>
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    viewMode={viewMode}
                    isFavorite={favorites.has(product._id)}
                    onAddToCart={() => handleAddToCart(product)}
                    onToggleFavorite={() => toggleFavorite(product._id)}
                  />
                ))}
              </div>

              {/* Mobile-optimized load more */}
              {hasMoreProducts && (
                <div className="text-center mt-8">
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Loading more products...</span>
                    </div>
                  ) : (
                    <Button
                      onClick={loadMoreProducts}
                      variant="outline"
                      className="mobile-button"
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Load More Products
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="mobile-subtitle mb-2">No products found</h3>
                  <p className="mobile-body text-gray-600 mb-6">
                    Try adjusting your search terms or filters
                  </p>
                  <Button onClick={resetFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense
function ProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="mobile-container">
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-2" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="mobile-container py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="bg-gray-900 p-4 space-y-3">
                <div className="h-5 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  )
}

// Mobile-optimized product card component
function ProductCard({
  product,
  viewMode,
  isFavorite,
  onAddToCart,
  onToggleFavorite
}: {
  product: Product
  viewMode: 'grid' | 'list'
  isFavorite: boolean
  onAddToCart: () => void
  onToggleFavorite: () => void
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const currentPrice = product.salePrice || product.price

  if (viewMode === 'list') {
    return (
      <Card className="mobile-card hover:shadow-md transition-all duration-200 active:scale-[0.98]">
        <div className="flex gap-4">
          <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
            <Link href={`/products/${product.slug.current}`}>
              <Image
                src={product.images[0]?.asset?.url || '/placeholder.jpg'}
                alt={product.title}
                fill
                className="object-cover rounded-lg"
              />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFavorite}
              className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white"
            >
              <Heart className={cn(
                "w-4 h-4",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              )} />
            </Button>
          </div>

          <div className="flex-1 min-w-0 py-2">
            <div className="mb-2">
              <Link href={`/products/${product.slug.current}`}>
                <h3 className="mobile-subtitle line-clamp-2 hover:text-blue-600 transition-colors">
                  {product.title}
                </h3>
              </Link>
              <p className="mobile-caption text-gray-600">
                by {product.author.name}
              </p>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {product.categories?.slice(0, 2).map((category) => (
                <Badge key={category.slug.current} variant="outline" className="text-xs">
                  {category.name}
                </Badge>
              ))}
              {product.featured && (
                <Badge className="text-xs bg-blue-100 text-blue-800">Featured</Badge>
              )}
            </div>

            <p className="mobile-caption text-gray-600 line-clamp-2 mb-4">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="mobile-body font-bold">
                  {product.freebie ? 'Free' : formatPrice(currentPrice)}
                </span>
                {product.salePrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  onClick={onAddToCart}
                  size="sm"
                  className="mobile-button-primary"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  <span className="mobile-only">Add</span>
                  <span className="desktop-only">Add to Cart</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="mobile-card hover:shadow-md transition-all duration-200 active:scale-[0.98] overflow-hidden">
      <div className="relative aspect-[4/3]">
        <Link href={`/products/${product.slug.current}`}>
          <Image
            src={product.images[0]?.asset?.url || '/placeholder.jpg'}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFavorite}
          className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white touch-target"
        >
          <Heart className={cn(
            "w-4 h-4",
            isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
          )} />
        </Button>

        {product.featured && (
          <Badge className="absolute top-2 left-2 text-xs bg-blue-600 text-white">
            Featured
          </Badge>
        )}

        {product.salePrice && (
          <Badge className="absolute top-2 left-2 text-xs bg-red-600 text-white">
            Sale
          </Badge>
        )}
      </div>

      <div className="p-4">
        <div className="mb-3">
          <Link href={`/products/${product.slug.current}`}>
            <h3 className="mobile-body font-semibold line-clamp-2 hover:text-blue-600 transition-colors mb-1">
              {product.title}
            </h3>
          </Link>
          <p className="mobile-caption text-gray-600">
            by {product.author.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {product.categories?.slice(0, 1).map((category) => (
            <Badge key={category.slug.current} variant="outline" className="text-xs">
              {category.name}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="mobile-body font-bold">
              {product.freebie ? 'Free' : formatPrice(currentPrice)}
            </span>
            {product.salePrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Heart className="w-3 h-3" />
            <span>{product.stats.likes}</span>
            <Download className="w-3 h-3 ml-2" />
            <span>{product.stats.downloads}</span>
          </div>
        </div>

        <Button
          onClick={onAddToCart}
          className="w-full mt-3 mobile-button-primary"
          size="sm"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {product.freebie ? 'Download Free' : 'Add to Cart'}
        </Button>
      </div>
    </Card>
  )
}

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
