'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/styles/component-variants'
import { ImageIcon, AlertCircle } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallbackSrc?: string
  showFallback?: boolean
  onLoad?: () => void
  onError?: () => void
  style?: React.CSSProperties
  unoptimized?: boolean
}

// CDN URL transformation
function getCDNUrl(src: string, width?: number, height?: number, quality: number = 75): string {
  // If it's already a CDN URL or external URL, return as is
  if (src.startsWith('http') || src.startsWith('//')) {
    // For Sanity CDN, add optimization parameters
    if (src.includes('cdn.sanity.io')) {
      const url = new URL(src)
      url.searchParams.set('auto', 'format')
      url.searchParams.set('q', quality.toString())
      if (width) url.searchParams.set('w', width.toString())
      if (height) url.searchParams.set('h', height.toString())
      url.searchParams.set('fit', 'max')
      return url.toString()
    }

    // For Unsplash, add optimization parameters
    if (src.includes('images.unsplash.com')) {
      const url = new URL(src)
      url.searchParams.set('auto', 'format,compress')
      url.searchParams.set('q', quality.toString())
      if (width) url.searchParams.set('w', width.toString())
      if (height) url.searchParams.set('h', height.toString())
      url.searchParams.set('fit', 'crop')
      return url.toString()
    }

    return src
  }

  // For local images, use Next.js optimization
  return src
}

// Generate blur placeholder
function generateBlurDataURL(width: number = 10, height: number = 10): string {
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect width="100%" height="100%" fill="url(#gradient)" opacity="0.8"/>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e5e7eb"/>
          <stop offset="100%" style="stop-color:#d1d5db"/>
        </linearGradient>
      </defs>
      <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>
    </svg>`
  ).toString('base64')}`
}

// Error fallback component
function ImageFallback({
  width,
  height,
  alt,
  className,
  showIcon = true
}: {
  width?: number
  height?: number
  alt: string
  className?: string
  showIcon?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gray-100 text-gray-400 border border-gray-200",
        className
      )}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        minHeight: height ? `${height}px` : '200px'
      }}
    >
      <div className="flex flex-col items-center gap-2 p-4 text-center">
        {showIcon && <ImageIcon className="w-8 h-8" />}
        <span className="text-sm font-medium">Image unavailable</span>
        {alt && <span className="text-xs text-gray-500 line-clamp-2">{alt}</span>}
      </div>
    </div>
  )
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  sizes,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  fallbackSrc,
  showFallback = true,
  onLoad,
  onError,
  style,
  unoptimized = false,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Reset state when src changes
  useEffect(() => {
    setImgSrc(src)
    setIsLoading(true)
    setHasError(false)
    setRetryCount(0)
  }, [src])

  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }, [onLoad])

  // Handle image load error with retry logic
  const handleError = useCallback(() => {
    setIsLoading(false)

    // Try fallback src first
    if (fallbackSrc && imgSrc !== fallbackSrc && retryCount === 0) {
      setImgSrc(fallbackSrc)
      setRetryCount(1)
      return
    }

    // Try optimized version of original src
    if (retryCount < 2 && src.includes('cdn.sanity.io')) {
      const optimizedSrc = getCDNUrl(src, width, height, 50) // Lower quality fallback
      if (optimizedSrc !== imgSrc) {
        setImgSrc(optimizedSrc)
        setRetryCount(prev => prev + 1)
        return
      }
    }

    // Final fallback
    setHasError(true)
    onError?.()
  }, [fallbackSrc, imgSrc, retryCount, src, width, height, onError])

  // Show fallback component if error and showFallback is true
  if (hasError && showFallback) {
    return (
      <ImageFallback
        width={width}
        height={height}
        alt={alt}
        className={className}
      />
    )
  }

  // Don't render anything if error and showFallback is false
  if (hasError && !showFallback) {
    return null
  }

  // Get optimized CDN URL
  const optimizedSrc = getCDNUrl(imgSrc, width, height, quality)

  // Generate blur placeholder if not provided
  const placeholderDataURL = blurDataURL ||
    (placeholder === 'blur' ? generateBlurDataURL(width, height) : undefined)

  // Determine sizes string for responsive images
  const responsiveSizes = sizes || (() => {
    if (fill) return '100vw'
    if (width && width < 640) return '(max-width: 640px) 100vw, 640px'
    if (width && width < 1024) return '(max-width: 1024px) 100vw, 1024px'
    return '(max-width: 1200px) 100vw, 1200px'
  })()

  return (
    <div className={cn("relative overflow-hidden", !fill && "inline-block", className)}>
      <Image
        src={optimizedSrc}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        sizes={responsiveSizes}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={placeholderDataURL}
        unoptimized={unoptimized}
        onLoad={handleLoad}
        onError={handleError}
        style={style}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-cover" : ""
        )}
        {...props}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse",
          fill ? "" : "w-full h-full"
        )}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}

      {/* Retry button for failed images */}
      {hasError && retryCount < 3 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90">
          <button
            onClick={() => {
              setHasError(false)
              setIsLoading(true)
              setImgSrc(src)
              setRetryCount(0)
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

// Preload critical images
export function preloadImage(src: string, width?: number, height?: number): void {
  if (typeof window === 'undefined') return

  const optimizedSrc = getCDNUrl(src, width, height)
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = optimizedSrc

  // Add responsive image hints
  if (width && height) {
    link.setAttribute('imagesrcset', `${optimizedSrc} 1x`)
  }

  document.head.appendChild(link)
}

// Performance monitoring hook
export function useImagePerformance() {
  const [metrics, setMetrics] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0
  })

  const trackImageLoad = useCallback((loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      totalImages: prev.totalImages + 1,
      loadedImages: prev.loadedImages + 1,
      averageLoadTime: (prev.averageLoadTime * prev.loadedImages + loadTime) / (prev.loadedImages + 1)
    }))
  }, [])

  const trackImageError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      totalImages: prev.totalImages + 1,
      failedImages: prev.failedImages + 1
    }))
  }, [])

  return { metrics, trackImageLoad, trackImageError }
}

// Image quality optimizer based on connection
export function getOptimalQuality(): number {
  if (typeof window === 'undefined') return 75

  // Check for slow connection
  const connection = (navigator as any).connection
  if (connection) {
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return 40
    }
    if (connection.effectiveType === '3g') {
      return 60
    }
  }

  // Check for data saver
  if (connection?.saveData) {
    return 50
  }

  return 75
}

// Lazy loading intersection observer hook
export function useLazyLoading(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '50px' }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold])

  return { isInView, ref: setRef }
}

export default OptimizedImage
