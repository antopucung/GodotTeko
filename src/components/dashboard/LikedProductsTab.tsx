'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LikeButton } from '@/components/LikeButton'
import { StarRating } from '@/components/ui/star-rating'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Heart,
  ShoppingCart,
  Layers,
  Star,
  Grid3X3,
  List,
  Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface LikedProduct {
  _id: string
  title: string
  slug: { current: string }
  price: number
  originalPrice?: number
  currency: string
  freebie: boolean
  images?: Array<{ asset: { url: string } }>
  author?: {
    name: string
    slug: { current: string }
  }
  category?: {
    name: string
    slug: { current: string }
  }
  stats?: {
    likes: number
    rating: number
    reviewsCount: number
  }
}

interface LikedProductsTabProps {
  onStatsUpdate?: () => void
}

export function LikedProductsTab({ onStatsUpdate }: LikedProductsTabProps) {
  const { data: session } = useSession()
  const [products, setProducts] = useState<LikedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.user?.id) {
      fetchLikedProducts()
    }
  }, [session?.user?.id])

  const fetchLikedProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/user/liked-products')
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products || [])
      } else {
        setError(data.error || 'Failed to fetch liked products')
      }
    } catch (error) {
      console.error('Error fetching liked products:', error)
      setError('Failed to fetch liked products')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlike = () => {
    // Refresh the products list when a product is unliked
    fetchLikedProducts()
    onStatsUpdate?.()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No liked products yet
        </h3>
        <p className="text-gray-600 mb-6">
          Start exploring products and like the ones you love!
        </p>
        <Link href="/products/browse">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Browse Products
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Liked Products</h2>
          <p className="text-gray-600">
            {products.length} {products.length === 1 ? 'product' : 'products'} you've liked
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product._id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-lg">
                  <Link href={`/products/${product.slug.current}`}>
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0].asset.url}
                        alt={product.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </Link>

                  {/* Like Button */}
                  <div className="absolute top-3 right-3">
                    <LikeButton
                      productId={product._id}
                      size="sm"
                      showCount={false}
                      className="bg-white/90 hover:bg-white shadow-lg rounded-full"
                    />
                  </div>

                  {/* Status Badge */}
                  {product.freebie && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white">FREE</Badge>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <Link href={`/products/${product.slug.current}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Rating and Reviews */}
                  {product.stats?.rating && product.stats.rating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={product.stats.rating} readonly size="sm" />
                      <span className="text-sm text-gray-600">
                        ({product.stats.reviewsCount})
                      </span>
                    </div>
                  )}

                  {/* Author and Category */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    {product.author && (
                      <Link
                        href={`/authors/${product.author.slug.current}`}
                        className="hover:text-blue-600"
                      >
                        {product.author.name}
                      </Link>
                    )}
                    {product.category && (
                      <Link
                        href={`/category/${product.category.slug.current}`}
                        className="hover:text-blue-600"
                      >
                        {product.category.name}
                      </Link>
                    )}
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <div>
                      {product.freebie ? (
                        <span className="text-lg font-bold text-green-600">Free</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(product.price, product.currency)}
                          </span>
                          {product.originalPrice && product.originalPrice !== product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.originalPrice, product.currency)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Link href={`/products/${product.slug.current}`}>
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0].asset.url}
                          alt={product.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${product.slug.current}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                        {product.title}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      {product.author && (
                        <Link
                          href={`/authors/${product.author.slug.current}`}
                          className="hover:text-blue-600"
                        >
                          {product.author.name}
                        </Link>
                      )}
                      {product.category && (
                        <Link
                          href={`/category/${product.category.slug.current}`}
                          className="hover:text-blue-600"
                        >
                          {product.category.name}
                        </Link>
                      )}
                    </div>

                    {/* Rating */}
                    {product.stats?.rating && product.stats.rating > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={product.stats.rating} readonly size="sm" />
                        <span className="text-sm text-gray-600">
                          ({product.stats.reviewsCount})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      {product.freebie ? (
                        <span className="text-lg font-bold text-green-600">Free</span>
                      ) : (
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(product.price, product.currency)}
                          </div>
                          {product.originalPrice && product.originalPrice !== product.price && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.originalPrice, product.currency)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <LikeButton
                        productId={product._id}
                        size="sm"
                        showCount={false}
                        className="hover:bg-gray-100"
                      />
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
