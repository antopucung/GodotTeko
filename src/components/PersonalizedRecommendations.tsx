'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ProductCard } from '@/components/cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw } from 'lucide-react'
import { client } from '@/lib/sanity'

interface Product {
  _id: string
  title: string
  slug: { current: string }
  price: number
  salePrice?: number
  images?: Array<{ asset: { url: string } }>
  freebie: boolean
  author?: {
    name: string
  }
  category?: {
    title: string
  }
  stats?: {
    likes?: number
    rating?: number
  }
}

interface PersonalizedRecommendationsProps {
  title?: string
  maxItems?: number
  className?: string
  excludeProductId?: string
}

export function PersonalizedRecommendations({
  title = "Recommended for You",
  maxItems = 6,
  className = "",
  excludeProductId
}: PersonalizedRecommendationsProps) {
  const { data: session } = useSession()
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRecommendations = async () => {
    if (!session?.user?.id) {
      // For non-logged in users, show trending products
      await fetchTrendingProducts()
      return
    }

    try {
      setLoading(true)
      setError('')

      // Get user's liked products to understand preferences
      const likedProductsResponse = await fetch('/api/user/liked-products?limit=10')
      const likedProductsData = await likedProductsResponse.json()

      if (!likedProductsResponse.ok || !likedProductsData.products?.length) {
        // If no liked products, fall back to trending products
        await fetchTrendingProducts()
        return
      }

      const likedProducts = likedProductsData.products

      // Extract categories and authors from liked products for recommendations
      const likedCategories = likedProducts
        .map((p: any) => p.category?.slug?.current)
        .filter(Boolean)

      const likedAuthors = likedProducts
        .map((p: any) => p.author?.slug?.current)
        .filter(Boolean)

      // Build recommendation query based on user preferences
      let recommendationFilters = ['_type == "product"', 'status == "published"']

      if (excludeProductId) {
        recommendationFilters.push(`_id != "${excludeProductId}"`)
      }

      // Exclude already liked products
      const likedProductIds = likedProducts.map((p: any) => p._id)
      if (likedProductIds.length > 0) {
        recommendationFilters.push(`!(_id in [${likedProductIds.map(id => `"${id}"`).join(', ')}])`)
      }

      // Prefer products from liked categories or authors
      if (likedCategories.length > 0 || likedAuthors.length > 0) {
        const preferenceFilters = []

        if (likedCategories.length > 0) {
          preferenceFilters.push(`category->slug.current in [${likedCategories.map(cat => `"${cat}"`).join(', ')}]`)
        }

        if (likedAuthors.length > 0) {
          preferenceFilters.push(`author->slug.current in [${likedAuthors.map(auth => `"${auth}"`).join(', ')}]`)
        }

        if (preferenceFilters.length > 0) {
          recommendationFilters.push(`(${preferenceFilters.join(' || ')})`)
        }
      }

      const filterQuery = recommendationFilters.join(' && ')

      // Fetch personalized recommendations
      const recommendedProducts = await client.fetch(
        `*[${filterQuery}] | order(stats.likes desc, _createdAt desc) [0...${maxItems}] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "images": images[] {
            asset-> {
              url
            }
          },
          freebie,
          "author": author-> {
            name,
            slug
          },
          "category": category-> {
            title,
            slug
          },
          stats {
            likes,
            rating
          }
        }`
      )

      // If we don't have enough personalized recommendations, fill with trending
      if (recommendedProducts.length < maxItems) {
        const additionalTrending = await client.fetch(
          `*[_type == "product" && status == "published" && !(_id in [${[...likedProductIds, ...recommendedProducts.map((p: any) => p._id), excludeProductId].filter(Boolean).map(id => `"${id}"`).join(', ')}])] | order(stats.likes desc) [0...${maxItems - recommendedProducts.length}] {
            _id,
            title,
            slug,
            price,
            salePrice,
            "images": images[] {
              asset-> {
                url
              }
            },
            freebie,
            "author": author-> {
              name,
              slug
            },
            "category": category-> {
              name,
              slug
            },
            stats {
              likes,
              rating
            }
          }`
        )

        setRecommendations([...recommendedProducts, ...additionalTrending])
      } else {
        setRecommendations(recommendedProducts)
      }

    } catch (error) {
      console.error('Error fetching personalized recommendations:', error)
      setError('Failed to load recommendations')
      // Fall back to trending products
      await fetchTrendingProducts()
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendingProducts = async () => {
    try {
      let filters = ['_type == "product"', 'status == "published"']

      if (excludeProductId) {
        filters.push(`_id != "${excludeProductId}"`)
      }

      const filterQuery = filters.join(' && ')

      const trendingProducts = await client.fetch(
        `*[${filterQuery}] | order(stats.likes desc, stats.rating desc, _createdAt desc) [0...${maxItems}] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "images": images[] {
            asset-> {
              url
            }
          },
          freebie,
          "author": author-> {
            name,
            slug
          },
          "category": category-> {
            title,
            slug
          },
          stats {
            likes,
            rating
          }
        }`
      )

      setRecommendations(trendingProducts)
    } catch (error) {
      console.error('Error fetching trending products:', error)
      setError('Failed to load recommendations')
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [session?.user?.id, excludeProductId])

  // Don't render if no recommendations and not loading
  if (!loading && recommendations.length === 0 && !error) {
    return null
  }

  const getRecommendationTitle = () => {
    if (!session?.user) {
      return "Trending Products"
    }
    return title
  }

  const getRecommendationDescription = () => {
    if (!session?.user) {
      return "Popular products loved by our community"
    }
    return "Products picked just for you based on your preferences"
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              {getRecommendationTitle()}
            </CardTitle>
            <CardDescription>
              {getRecommendationDescription()}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecommendations}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700"
          >
            {loading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-600">
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={fetchRecommendations}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                variant="homepage"
                showQuickActions={true}
                index={index}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
