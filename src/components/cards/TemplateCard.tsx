'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Monitor, ShoppingCart, Download, Eye, Code, Figma } from "lucide-react"
import { useSession } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { formatCurrency, formatNumber } from '@/lib/utils'

// Template-specific data structure
export interface TemplateData {
  id: string
  title: string
  slug: string
  shortDescription?: string
  thumbnail?: {
    url: string
    alt?: string
  }
  livePreviewUrl?: string
  author: {
    name: string
    avatar?: string
    slug?: string
  }
  price: number
  currency: string
  category: string
  technologies: string[] // React, Vue, HTML, etc.
  features: string[] // Responsive, Dark Mode, etc.
  pages: number
  isResponsive: boolean
  hasDarkMode: boolean
  isPopular?: boolean
  isFree?: boolean
  isNew?: boolean
  stats: {
    likes: number
    views: number
    downloads: number
    rating?: number
  }
}

export interface TemplateCardProps {
  template: TemplateData
  className?: string
  showQuickActions?: boolean
  variant?: 'homepage' | 'category'
  index?: number // For staggered animations
}

export default function TemplateCard({
  template,
  className = '',
  showQuickActions = true,
  variant = 'homepage',
  index = 0
}: TemplateCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { data: session } = useSession()
  const { addToCart } = useCart()
  const router = useRouter()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Convert template to cart item format
    const cartItem = {
      id: template.id,
      title: template.title,
      slug: template.slug,
      price: template.price,
      currency: template.currency,
      images: template.thumbnail ? [template.thumbnail] : [],
      author: template.author,
      categories: [{ name: template.category, slug: template.category.toLowerCase() }],
      freebie: template.isFree || false,
      stats: template.stats
    }
    // Convert to proper cart product format
    const cartProduct = {
      _id: cartItem.id,
      title: cartItem.title,
      slug: { current: cartItem.slug },
      price: cartItem.price,
      salePrice: undefined, // Template doesn't have salePrice
      image: cartItem.images?.[0]?.url,
      freebie: cartItem.freebie
    }
    addToCart(cartProduct, 1)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLiked(!isLiked)
    // TODO: Implement like functionality
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (template.livePreviewUrl) {
      window.open(template.livePreviewUrl, '_blank')
    }
  }

  const getTechIcon = (tech: string) => {
    switch (tech.toLowerCase()) {
      case 'react': return '⚛️'
      case 'vue': return '💚'
      case 'angular': return '🅰️'
      case 'figma': return <Figma className="w-3 h-3" />
      case 'html': return '🌐'
      case 'css': return '🎨'
      default: return <Code className="w-3 h-3" />
    }
  }

  return (
    <div
      className={`group cursor-pointer block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative">
        {/* Template Preview - Light Background like attachment */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
          <Link href={`/templates/${template.slug}`}>
            {template.thumbnail ? (
              <Image
                src={template.thumbnail.url}
                alt={template.thumbnail.alt || template.title}
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Monitor className="w-16 h-16 text-blue-300" />
              </div>
            )}
          </Link>

          {/* Hover Overlay for Actions */}
          <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              <Button
                onClick={handlePreview}
                className="bg-white hover:bg-gray-50 text-gray-900 shadow-lg font-medium px-4 py-2 rounded-full transform transition-all duration-200 hover:scale-105"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleAddToCart}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg font-medium px-4 py-2 rounded-full transform transition-all duration-200 hover:scale-105"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showQuickActions && (
            <>
              {/* Like Button with Count (top-right) */}
              <div className="absolute top-3 right-3">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-700 text-sm font-medium">
                    {formatNumber(template.stats?.likes || 0)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`bg-white/80 hover:bg-white rounded-full h-8 w-8 p-0 shadow-sm transition-colors ${
                      isLiked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
                    }`}
                    onClick={handleLike}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Tech Stack Info (bottom-left) */}
              <div className="absolute bottom-3 left-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {template.technologies.slice(0, 2).map((tech, index) => (
                        <div key={index} className="text-sm">
                          {getTechIcon(tech)}
                        </div>
                      ))}
                      {template.technologies.length > 2 && (
                        <span className="text-xs text-gray-600">+{template.technologies.length - 2}</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-gray-800">
                        {template.pages} page{template.pages > 1 ? 's' : ''}
                      </div>
                      <div className="text-gray-600">
                        {template.isResponsive && '📱'} {template.hasDarkMode && '🌙'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quick Action Button (Bottom Right) */}
          <div className={`absolute bottom-3 right-3 transition-opacity duration-300 ${
            isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <Button
              onClick={handleAddToCart}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 p-0 shadow-lg"
            >
              <ShoppingCart className="h-3 w-3" />
            </Button>
          </div>

          {/* Status Badges */}
          {template.isFree && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                FREE
              </Badge>
            </div>
          )}
          {template.isPopular && !template.isFree && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                POPULAR
              </Badge>
            </div>
          )}
          {template.isNew && !template.isPopular && !template.isFree && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-500 hover:bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                NEW
              </Badge>
            </div>
          )}
        </div>

        {/* Template Info - Dark Background exactly like ProductCard */}
        <Link href={`/templates/${template.slug}`}>
          <div className="bg-gray-900 p-4">
            {/* Title and Price Row */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-semibold text-lg leading-tight flex-1 pr-4">
                {template.title}
              </h3>
              <div className="text-right">
                {template.isFree ? (
                  <p className="text-green-400 font-bold text-xl">Free</p>
                ) : (
                  <p className="text-white font-bold text-xl">
                    {formatCurrency(template.price, template.currency)}
                  </p>
                )}
              </div>
            </div>

            {/* Author and Category Row */}
            <div className="flex items-center justify-between">
              {/* Author with icon */}
              <div className="flex items-center space-x-2">
                {template.author?.avatar ? (
                  <Image
                    src={template.author.avatar}
                    alt={template.author.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {template.author?.name.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <span className="text-gray-300 text-sm font-medium">
                  {template.author?.name || 'Unknown'}
                </span>
                <span className="text-gray-500 text-sm">▶</span>
              </div>

              {/* Category Badge */}
              <Badge className="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded-md border-0 font-medium">
                {template.category}
              </Badge>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
