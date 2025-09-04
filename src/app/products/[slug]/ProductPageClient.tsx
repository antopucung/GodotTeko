'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useCart } from '@/context/CartContext'
import { useTrackProductView } from '@/context/RecentlyViewedContext'
import { Header } from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductReviews } from '@/components/ProductReviews'
import { LikeButton } from '@/components/LikeButton'
import RelatedLearningSection from '@/components/product/RelatedLearningSection'
import { toast } from 'sonner'
import {
  Heart,
  MessageCircle,
  ShoppingCart,
  Check,
  Clock,
  Layers,
  Home,
  ChevronRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { client } from '@/lib/sanity'

interface Product {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  price: number
  salePrice?: number
  images?: Array<{ asset: { url: string } }>
  category?: { title: string; slug: { current: string } }
  author?: { name: string; slug?: { current: string } }
  stats?: { likes?: number; rating?: number; reviewsCount?: number }
  freebie: boolean
  _createdAt: string
  _updatedAt: string
}

interface ProductPageClientProps {
  product: Product
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { addToCart } = useCart()
  const trackProductView = useTrackProductView()
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    // Track product view
    trackProductView({
      _id: product._id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      images: product.images,
      freebie: product.freebie,
      author: product.author,
      category: product.category
    })

    // Fetch related products
    const fetchRelatedProducts = async () => {
      try {
        if (product.category) {
          const related = await client.fetch(
            `*[_type == "product" && category._ref == $categoryRef && _id != $currentProductId] | order(_createdAt desc) [0...3] {
              _id,
              title,
              slug,
              price,
              salePrice,
              freebie,
              "images": images[] {
                asset-> {
                  url
                }
              },
              "category": category-> {
                title,
                slug
              }
            }`,
            {
              categoryRef: product.category.slug?.current,
              currentProductId: product._id
            }
          )
          setRelatedProducts(related || [])
        }
      } catch (error) {
        console.error('Error fetching related products:', error)
      }
    }

    fetchRelatedProducts()
  }, [product, trackProductView])

  const handleAddToCart = async () => {
    if (!session) {
      toast.error('Please sign in to add items to cart')
      router.push('/auth/signin')
      return
    }

    try {
      setAddingToCart(true)

      const cartProduct = {
        _id: product._id,
        title: product.title,
        slug: product.slug,
        price: product.price,
        salePrice: product.salePrice,
        image: product.images?.[0]?.asset?.url,
        freebie: product.freebie
      }

      await addToCart(cartProduct, 1)

      toast.success(
        `${product.title} added to cart!`,
        {
          description: product.freebie
            ? 'Free product added to your cart'
            : `$${product.salePrice || product.price} • Added to cart`,
          action: {
            label: 'View Cart',
            onClick: () => router.push('/cart')
          }
        }
      )
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add product to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const isAllAccessEligible = !product.freebie && product.price > 0

  return (
    <div className="min-h-screen bg-[#161717]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Breadcrumb with structured data */}
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white flex items-center">
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/products/browse" className="hover:text-white">Products</Link>
          <ChevronRight className="w-4 h-4" />
          {product.category && (
            <>
              <Link
                href={`/category/${product.category.slug.current}`}
                className="hover:text-white"
              >
                {product.category.title}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-gray-300">{product.title}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          {/* Title and Price */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{product.title}</h1>
              {product.description && (
                <p className="text-xl text-gray-400 mb-4">{product.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                {product.freebie ? (
                  <div className="text-3xl font-bold text-green-400">Free</div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold text-white">
                      ${product.salePrice || product.price}
                    </div>
                    {product.salePrice && product.salePrice !== product.price && (
                      <div className="text-lg text-gray-500 line-through">
                        ${product.price}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Author and Actions Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-6">
              {/* Author */}
              {product.author && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {product.author.name.charAt(0)}
                    </span>
                  </div>
                  {product.author.slug ? (
                    <Link
                      href={`/authors/${product.author.slug.current}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {product.author.name}
                    </Link>
                  ) : (
                    <span className="text-blue-400">{product.author.name}</span>
                  )}
                </div>
              )}

              {/* Category */}
              {product.category && (
                <Link
                  href={`/category/${product.category.slug.current}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {product.category.title}
                </Link>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-4 text-gray-400">
                {product.stats?.likes && (
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{product.stats.likes}</span>
                  </div>
                )}
                {product.stats?.reviewsCount && (
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{product.stats.reviewsCount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Like Button */}
              <LikeButton productId={product._id} size="lg" showCount={true} />

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {addingToCart ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.freebie ? 'Download Free' : `Add to cart $${product.salePrice || product.price}`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Product Gallery */}
        <div className="mb-8">
          {product.images && product.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl overflow-hidden">
              {product.images.slice(0, 4).map((image, index) => (
                <div key={index} className="aspect-square bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl overflow-hidden">
                  <Image
                    src={image.asset.url}
                    alt={`${product.title} - Image ${index + 1}`}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[2/1] bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <div className="text-center text-white">
                <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">{product.title}</h3>
                <p className="opacity-80">Premium design resource</p>
              </div>
            </div>
          )}
        </div>

        {/* All-Access Notice */}
        {isAllAccessEligible && (
          <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-400" />
                <span className="text-green-400">
                  You can download this product with the All-Access Pass.
                </span>
              </div>
              <Link href="/all-access">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Get All-Access
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          {/* Left Column - Overview */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed text-lg">
                {product.description || `Welcome to our "${product.title}" collection! This premium design resource provides high-quality assets perfect for your creative projects. Whether you're working on web design, mobile apps, or digital products, this collection offers professional-grade resources to elevate your work.`}
              </p>
            </div>
          </div>

          {/* Right Column - Highlights */}
          <div className="space-y-8">
            {/* Highlights */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Highlights</h3>
              <div className="space-y-4">
                {[
                  'High Resolution',
                  'Multiple Formats',
                  'Easy to Use',
                  'Professional Quality',
                  'Cross-Platform Compatible',
                  'Regular Updates'
                ].map((highlight) => (
                  <div key={highlight} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Info */}
            {product.category && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Category</h3>
                <Link
                  href={`/category/${product.category.slug.current}`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {product.category.title}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <ProductReviews productId={product._id} />
        </div>

        {/* Related Learning Section */}
        <div className="mb-12">
          <RelatedLearningSection
            productCategory={product.category?.title || 'Design'}
            productTags={[product.category?.title || 'Design']}
            productTitle={product.title}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-700 pt-12">
            <h3 className="text-2xl font-bold text-white mb-8">Related Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  href={`/products/${relatedProduct.slug.current}`}
                  className="group"
                >
                  <Card className="bg-gray-800/50 border-gray-600 hover:border-gray-500 transition-colors">
                    <CardContent className="p-4">
                      <div className="aspect-[4/3] bg-gray-600 rounded-lg mb-3 overflow-hidden">
                        {relatedProduct.images?.[0] ? (
                          <Image
                            src={relatedProduct.images[0].asset.url}
                            alt={relatedProduct.title}
                            width={300}
                            height={225}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Layers className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <h5 className="font-medium text-white group-hover:text-blue-400 transition-colors mb-1">
                        {relatedProduct.title}
                      </h5>
                      <p className="text-blue-400 font-bold">
                        {relatedProduct.freebie ? 'Free' : formatCurrency(relatedProduct.salePrice || relatedProduct.price)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
