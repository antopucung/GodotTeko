'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LikeButton } from "@/components/LikeButton"
import { Heart, Layers, ShoppingCart, X, Plus } from "lucide-react"
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useCart } from '@/context/CartContext'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useCardAnimations, useMicroInteractions } from '@/hooks/useCardAnimations'

import { useABTest, EXPERIMENTS } from '@/lib/ab-testing'
import { analytics } from '@/lib/analytics-engine'

export interface Product {
  _id: string
  title: string
  slug: { current: string }
  price: number
  salePrice?: number
  images?: Array<{ asset: { url: string } }>
  freebie: boolean
  featured?: boolean
  description?: string
  category?: { title: string }
  author?: {
    name: string
    image?: string
    slug?: { current: string }
  }
  stats?: {
    likes?: number
  }
}

export interface ProductCardProps {
  product: Product
  className?: string
  showQuickActions?: boolean
  variant?: 'homepage' | 'category'
  index?: number // For staggered animations
}

export default function ProductCard({
  product,
  className = '',
  showQuickActions = true,
  variant = 'homepage',
  index = 0
}: ProductCardProps) {

  // A/B Testing Integration - Test different button styles
  const {
    config: buttonConfig,
    isLoading: abTestLoading,
    trackConversion,
    variantName
  } = useABTest(EXPERIMENTS.CTA_BUTTON_COLOR, {
    buttonStyle: 'default',
    showPrice: true,
    hoverEffect: 'scale'
  })

  // A/B Testing for product card layout
  const {
    config: layoutConfig,
    trackConversion: trackLayoutConversion,
    variantName: layoutVariant
  } = useABTest(EXPERIMENTS.PRODUCT_CARD_LAYOUT, {
    imageAspectRatio: '4/3',
    showAuthor: true,
    pricePosition: 'bottom-right'
  })

  const [isHovered, setIsHovered] = useState(false)
  const { data: session } = useSession()
  const { addToCart } = useCart()
  const router = useRouter()

  // Enhanced animations
  const {
    cardRef,
    isVisible,
    animationClass,
    handleMouseEnter: onMouseEnter,
    handleMouseLeave: onMouseLeave
  } = useCardAnimations(index, {
    staggerDelay: 120,
    threshold: 0.15,
    enableStagger: true,
    enableHover: true,
    enableInView: true
  })

  // Micro-interactions for buttons with A/B testing
  const addToCartMicro = useMicroInteractions()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Track A/B test conversion for button click
    await trackConversion('add_to_cart_click', product.price, {
      productId: product._id,
      buttonVariant: variantName,
      layoutVariant: layoutVariant
    })

    // Track analytics event
    analytics.trackAddToCart({
      itemId: product._id,
      itemName: product.title,
      category: product.category?.title || 'Unknown',
      quantity: 1,
      price: product.salePrice || product.price
    })

    if (!session) {
      // Track conversion attempt without auth
      await trackConversion('auth_required', 0, {
        action: 'add_to_cart',
        productId: product._id
      })

      toast.error('Please sign in to add items to cart')
      router.push('/auth/signin')
      return
    }

    // Micro-interaction feedback
    addToCartMicro.setIsLoading(true)

    try {
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

      // Track successful conversion
      await trackConversion('add_to_cart_success', product.salePrice || product.price, {
        productId: product._id,
        userId: session.user.id,
        buttonVariant: variantName,
        layoutVariant: layoutVariant
      })

      // Success toast notification
      toast.success(
        `${product.title} added to cart!`,
        {
          description: product.freebie
            ? 'Free product added to your cart'
            : `${product.salePrice || product.price} • Added to cart`,
          duration: 3000
        }
      )

      // Brief loading state for visual feedback
      setTimeout(() => {
        addToCartMicro.setIsLoading(false)
      }, 300)
    } catch (error: any) {
      console.error('Error adding to cart:', error)

      // Track failed conversion
      await trackConversion('add_to_cart_failed', 0, {
        productId: product._id,
        error: error.message,
        buttonVariant: variantName
      })

      toast.error('Failed to add product to cart')
      addToCartMicro.setIsLoading(false)
    }
  }

  // Track card view for analytics
  useEffect(() => {
    if (isVisible) {
      analytics.trackEvent('engagement', 'product_card_view', {
        productId: product._id,
        productTitle: product.title,
        category: product.category?.title,
        price: product.salePrice || product.price,
        freebie: product.freebie,
        layoutVariant: layoutVariant,
        position: index
      })

      // Track layout conversion for A/B test
      trackLayoutConversion('card_viewed', 0, {
        productId: product._id,
        position: index
      })
    }
  }, [isVisible, product, layoutVariant, index, trackLayoutConversion])

  const handleMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement menu functionality
  }

  const handleCardMouseEnter = () => {
    setIsHovered(true)
    onMouseEnter()
  }

  const handleCardMouseLeave = () => {
    setIsHovered(false)
    onMouseLeave()
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Track card click
    analytics.trackEvent('interaction', 'product_card_click', {
      productId: product._id,
      productTitle: product.title,
      layoutVariant: layoutVariant,
      clickTarget: 'card'
    })

    // Only navigate if the click target is not an interactive element
    const target = e.target as HTMLElement
    const isInteractiveElement = target.closest('button') || target.closest('a')

    if (!isInteractiveElement) {
      window.location.href = `/products/${product.slug.current}`
    }
  }

  // A/B test loading state
  if (abTestLoading) {
    return (
      <div className={`group cursor-pointer block ${className}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative animate-pulse">
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="bg-white p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  // Dynamic styling based on A/B test configuration
  const buttonStyles = {
    default: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    orange: "bg-orange-600 hover:bg-orange-700",
    purple: "bg-purple-600 hover:bg-purple-700"
  }

  const selectedButtonStyle = buttonStyles[buttonConfig.buttonStyle as keyof typeof buttonStyles] || buttonStyles.default

  const aspectRatio = layoutConfig.imageAspectRatio === '1/1' ? 'aspect-square' : 'aspect-[4/3]'

  return (
    <div
      ref={cardRef}
      className={`group cursor-pointer block ${animationClass} ${className}`}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
      onClick={handleCardClick}
      style={{
        animationFillMode: 'both'
      }}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 relative">
        {/* Product Image - A/B tested aspect ratio */}
        <div className={`relative ${aspectRatio} bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 overflow-hidden`}>
          {product.images?.[0] ? (
            <Image
              src={product.images[0].asset.url}
              alt={product.title}
              width={400}
              height={300}
              className={`w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300 ${
                layoutConfig.hoverEffect === 'rotate' ? 'group-hover:rotate-2' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layers className="w-16 h-16 text-amber-300 animate-float" />
            </div>
          )}

          {/* Hover Overlay for Add to Cart - A/B tested button style */}
          <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={handleAddToCart}
                className={`${selectedButtonStyle} text-white shadow-lg font-medium px-4 py-3 rounded-full transform transition-all duration-200 hover:scale-105 btn-micro ${addToCartMicro.buttonClass}`}
                {...addToCartMicro.handlers}
                disabled={addToCartMicro.isLoading}
              >
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {showQuickActions && (
            <>
              {/* Like Button (top-right) - UI8 Style */}
              <div className="absolute top-3 right-3">
                <div className="bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors backdrop-blur-sm">
                  <LikeButton
                    productId={product._id}
                    size="sm"
                    showCount={true}
                    className="text-gray-600 hover:text-red-500 hover:bg-transparent h-8 w-8 rounded-full"
                  />
                </div>
              </div>
            </>
          )}

          {/* Simple Add to Cart Button - A/B tested style */}
          <div className={`absolute bottom-3 right-3 transition-opacity duration-300 ${
            isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <Button
              onClick={handleAddToCart}
              className={`${selectedButtonStyle} text-white rounded-full h-9 w-9 p-0 shadow-lg transition-transform hover:scale-105 ${addToCartMicro.buttonClass}`}
              {...addToCartMicro.handlers}
              disabled={addToCartMicro.isLoading}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Badges - UI8 Style */}
          {product.freebie && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                FREE
              </Badge>
            </div>
          )}
          {product.featured && !product.freebie && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                FEATURED
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info - A/B tested layout */}
        <div className="bg-white p-4 transition-all duration-200 hover:bg-gray-50">
            {/* Title and Price Row - A/B tested price position */}
            <div className={`flex items-start justify-between mb-3 ${
              layoutConfig.pricePosition === 'top-right' ? 'flex-row-reverse' : ''
            }`}>
              <h3 className="text-gray-900 font-semibold text-base leading-tight flex-1 pr-3 transition-colors duration-200 group-hover:text-blue-600">
                {product.title}
              </h3>
              {layoutConfig.pricePosition !== 'bottom-only' && (
                <div className="text-right">
                  {product.freebie ? (
                    <p className="text-green-600 font-bold text-lg">Free</p>
                  ) : (
                    <div>
                      <p className="text-gray-900 font-bold text-lg">
                        ${product.salePrice || product.price}
                      </p>
                      {product.salePrice && product.salePrice !== product.price && (
                        <p className="text-gray-500 text-sm line-through">
                          ${product.price}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Author and Category Row - A/B tested author visibility */}
            <div className="flex items-center justify-between">
              {/* Author - conditionally shown based on A/B test */}
              {layoutConfig.showAuthor && product.author && (
                <div className="flex items-center space-x-2">
                  {product.author?.image ? (
                    <Image
                      src={product.author.image}
                      alt={product.author.name}
                      width={16}
                      height={16}
                      className="w-4 h-4 rounded-full transition-transform duration-200 hover:scale-110"
                    />
                  ) : (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110">
                      <span className="text-white text-xs font-bold">
                        {product.author?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  {product.author?.slug ? (
                    <span
                      className="text-gray-600 text-sm font-medium transition-colors duration-200 hover:text-blue-600 cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation()
                        analytics.trackEvent('interaction', 'author_click', {
                          authorName: product.author.name,
                          productId: product._id
                        })
                        window.location.href = `/authors/${product.author.slug.current}`
                      }}
                    >
                      {product.author.name || 'Unknown'}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-sm font-medium transition-colors duration-200 hover:text-gray-900">
                      {product.author?.name || 'Unknown'}
                    </span>
                  )}
                </div>
              )}

              {/* Category Badge */}
              {product.category && (
                <Badge className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md border-0 font-medium transition-all duration-200 hover:bg-gray-200">
                  {product.category.title}
                </Badge>
              )}
            </div>

            {/* Price-only row for A/B test variant */}
            {layoutConfig.pricePosition === 'bottom-only' && (
              <div className="mt-3 text-right">
                {product.freebie ? (
                  <p className="text-green-600 font-bold text-xl">Free</p>
                ) : (
                  <div>
                    <p className="text-gray-900 font-bold text-xl">
                      ${product.salePrice || product.price}
                    </p>
                    {product.salePrice && product.salePrice !== product.price && (
                      <p className="text-gray-500 text-base line-through">
                        ${product.price}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  )
}
