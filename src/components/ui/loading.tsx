'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// Enhanced skeleton animations
const skeletonAnimation = {
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  wave: 'animate-wave'
}

interface SkeletonProps {
  className?: string
  animation?: keyof typeof skeletonAnimation
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({
  className,
  animation = 'shimmer',
  rounded = 'md',
  ...props
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        skeletonAnimation[animation],
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  )
}

// Enhanced loading spinner with variants
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'bars' | 'circle'
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-blue-600 rounded-full animate-bounce',
              sizes[size]
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-blue-600 animate-pulse',
              size === 'sm' ? 'w-1 h-4' :
              size === 'md' ? 'w-1.5 h-6' :
              size === 'lg' ? 'w-2 h-8' : 'w-3 h-12'
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'circle') {
    return (
      <div className={cn('relative', sizes[size], className)}>
        <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin',
          sizes[size]
        )} />
      </div>
    )
  }

  return (
    <Loader2 className={cn('animate-spin text-blue-600', sizes[size], className)} />
  )
}

// Product card skeleton with enhanced animations
export function ProductCardSkeleton({
  className,
  variant = 'homepage'
}: {
  className?: string
  variant?: 'homepage' | 'list'
}) {
  if (variant === 'list') {
    return (
      <div className={cn('flex items-center gap-4 p-4 bg-white rounded-lg border', className)}>
        <Skeleton className="w-16 h-16 flex-shrink-0" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20" rounded="md" />
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-2xl overflow-hidden border border-gray-100', className)}>
      {/* Image skeleton */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50">
        <Skeleton className="w-full h-full" animation="wave" rounded="none" />
      </div>

      {/* Content skeleton */}
      <div className="bg-gray-900 p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-5 w-2/3 bg-gray-700" />
          <Skeleton className="h-6 w-16 bg-gray-700" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-5 h-5 bg-gray-700" rounded="full" />
            <Skeleton className="h-3 w-20 bg-gray-700" />
          </div>
          <Skeleton className="h-6 w-16 bg-gray-700" rounded="md" />
        </div>
      </div>
    </div>
  )
}

// Page loading overlay
export function PageLoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-4">
        <LoadingSpinner size="lg" variant="circle" />
        <span className="text-gray-900 font-medium">{message}</span>
      </div>
    </div>
  )
}

// Enhanced grid skeleton
export function ProductGridSkeleton({
  count = 8,
  className
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Lazy loading wrapper with enhanced fade-in
interface LazyLoadProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
}

export function LazyLoad({
  children,
  className,
  threshold = 0.1,
  rootMargin = '50px'
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      { threshold, rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, hasLoaded])

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4',
        className
      )}
    >
      {isVisible ? children : <ProductCardSkeleton />}
    </div>
  )
}

// Button loading state
export function LoadingButton({
  children,
  loading = false,
  className,
  ...props
}: {
  children: React.ReactNode
  loading?: boolean
  className?: string
  [key: string]: any
}) {
  return (
    <button
      className={cn(
        'relative transition-all duration-200',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <span className={cn(loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  )
}
