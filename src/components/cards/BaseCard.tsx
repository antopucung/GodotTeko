'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/styles/component-variants'
import { useResponsive } from '@/hooks/useResponsive'

export interface BaseCardProps {
  // Core props
  href?: string
  onClick?: () => void
  className?: string

  // Layout
  variant?: 'default' | 'compact' | 'minimal' | 'course' | 'article'
  aspectRatio?: 'square' | 'video' | 'product' | 'wide'

  // Content slots
  imageSlot: ReactNode
  contentSlot: ReactNode
  overlaySlot?: ReactNode
  badgeSlot?: ReactNode

  // Responsive behavior
  responsive?: boolean

  // Interaction states
  disabled?: boolean
  loading?: boolean
}

export default function BaseCard({
  href,
  onClick,
  className,
  variant = 'default',
  aspectRatio = 'product',
  imageSlot,
  contentSlot,
  overlaySlot,
  badgeSlot,
  responsive = true,
  disabled = false,
  loading = false
}: BaseCardProps) {
  const { isMobile } = useResponsive()

  // Aspect ratio mapping
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    product: 'aspect-[4/3]',
    wide: 'aspect-[16/10]'
  }

  // Variant-specific styling
  const variantClasses = {
    default: 'bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100',
    compact: 'bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100',
    minimal: 'bg-white rounded-lg overflow-hidden hover:shadow-md transition-all duration-200',
    course: 'bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100',
    article: 'bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100'
  }

  const cardClasses = cn(
    'group cursor-pointer relative',
    variantClasses[variant],
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'animate-pulse',
    className
  )

  const cardContent = (
    <div className={cardClasses}>
      {/* Image Container */}
      <div className={cn(
        'relative overflow-hidden',
        aspectClasses[aspectRatio],
        variant === 'course' ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-amber-50 to-orange-50'
      )}>
        {imageSlot}
        {overlaySlot}
        {badgeSlot}
      </div>

      {/* Content Container */}
      <div className={cn(
        variant === 'default' || variant === 'course' ? 'bg-gray-900 p-4' :
        variant === 'compact' ? 'bg-gray-900 p-3' :
        'p-4'
      )}>
        {contentSlot}
      </div>
    </div>
  )

  // Wrap with Link or div based on props
  if (href && !disabled) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  if (onClick && !disabled) {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    )
  }

  return cardContent
}
