'use client'

import { useRecentlyViewed } from '@/context/RecentlyViewedContext'
import { ProductCard } from '@/components/cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, X } from 'lucide-react'
import Link from 'next/link'

interface RecentlyViewedProductsProps {
  title?: string
  showTitle?: boolean
  maxItems?: number
  className?: string
  compact?: boolean
}

export function RecentlyViewedProducts({
  title = "Recently Viewed",
  showTitle = true,
  maxItems = 6,
  className = "",
  compact = false
}: RecentlyViewedProductsProps) {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed()

  // Don't render if no recently viewed products
  if (recentlyViewed.length === 0) {
    return null
  }

  const productsToShow = recentlyViewed.slice(0, maxItems)

  if (compact) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              {title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentlyViewed}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {productsToShow.map((product, index) => (
            <ProductCard
              key={`${product._id}-${index}`}
              product={product}
              variant="homepage"
              showQuickActions={false}
              className="scale-90"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              {title}
            </CardTitle>
            <CardDescription>
              Products you've recently viewed ({recentlyViewed.length} total)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {recentlyViewed.length > maxItems && (
              <Link href="/products/browse?filter=recently-viewed">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentlyViewed}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsToShow.map((product, index) => (
            <ProductCard
              key={`${product._id}-${index}`}
              product={product}
              variant="homepage"
              showQuickActions={true}
              index={index}
            />
          ))}
        </div>

        {recentlyViewed.length > maxItems && (
          <div className="mt-6 text-center">
            <Link href="/products/browse?filter=recently-viewed">
              <Button variant="outline">
                View All {recentlyViewed.length} Recently Viewed Products
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook to get recently viewed count for badges/indicators
export function useRecentlyViewedCount() {
  const { recentlyViewed } = useRecentlyViewed()
  return recentlyViewed.length
}
