// Performance optimization service for UI8 Clone
// Handles CDN integration, caching, and image optimization

interface CacheConfig {
  ttl: number // Time to live in seconds
  staleWhileRevalidate?: number // Additional time to serve stale content while revalidating
  tags?: string[] // Cache tags for invalidation
}

interface ImageOptimization {
  format?: 'webp' | 'avif' | 'auto'
  quality?: number
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill'
}

interface CDNConfig {
  baseUrl: string
  apiKey?: string
  purgeEndpoint?: string
}

export class PerformanceOptimizer {
  private static cache = new Map<string, { data: any; expires: number; stale: number }>()
  private static cdnConfig: CDNConfig | null = null

  // Initialize CDN configuration (Cloudflare, AWS CloudFront, etc.)
  static initializeCDN(config: CDNConfig) {
    this.cdnConfig = config
  }

  // Smart caching with stale-while-revalidate strategy
  static async cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = { ttl: 300 } // 5 minutes default
  ): Promise<T> {
    const now = Date.now() / 1000
    const cached = this.cache.get(key)

    // Return fresh cache hit
    if (cached && now < cached.expires) {
      return cached.data
    }

    // Return stale data while revalidating in background
    if (cached && config.staleWhileRevalidate && now < cached.stale) {
      // Revalidate in background
      this.revalidateInBackground(key, fetcher, config)
      return cached.data
    }

    // Cache miss or expired - fetch fresh data
    try {
      const data = await fetcher()
      const expires = now + config.ttl
      const stale = config.staleWhileRevalidate ? expires + config.staleWhileRevalidate : expires

      this.cache.set(key, { data, expires, stale })
      return data
    } catch (error) {
      // If fetch fails and we have stale data, return it
      if (cached) {
        console.warn(`Fetch failed for ${key}, returning stale data:`, error)
        return cached.data
      }
      throw error
    }
  }

  // Background revalidation
  private static async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ) {
    try {
      const data = await fetcher()
      const now = Date.now() / 1000
      const expires = now + config.ttl
      const stale = config.staleWhileRevalidate ? expires + config.staleWhileRevalidate : expires

      this.cache.set(key, { data, expires, stale })
    } catch (error) {
      console.warn(`Background revalidation failed for ${key}:`, error)
    }
  }

  // Optimize Sanity image URLs
  static optimizeImage(url: string, options: ImageOptimization = {}): string {
    if (!url || !url.includes('sanity')) return url

    const {
      format = 'auto',
      quality = 80,
      width,
      height,
      fit = 'cover'
    } = options

    try {
      const urlObj = new URL(url)
      const params = new URLSearchParams()

      // Auto format detection based on browser support
      if (format === 'auto') {
        // This would typically be handled by the CDN or server
        params.set('fm', 'webp')
        params.set('auto', 'format')
      } else {
        params.set('fm', format)
      }

      params.set('q', quality.toString())

      if (width) params.set('w', width.toString())
      if (height) params.set('h', height.toString())
      if (width || height) params.set('fit', fit)

      // Add optimization parameters
      params.set('dpr', '2') // Retina support

      urlObj.search = params.toString()
      return urlObj.toString()
    } catch (error) {
      console.warn('Failed to optimize image URL:', error)
      return url
    }
  }

  // Generate responsive image srcSet
  static generateResponsiveImageSrcSet(url: string, breakpoints = [320, 640, 768, 1024, 1280]): string {
    return breakpoints
      .map(width => {
        const optimizedUrl = this.optimizeImage(url, { width, quality: 80 })
        return `${optimizedUrl} ${width}w`
      })
      .join(', ')
  }

  // Preload critical resources
  static preloadCriticalResources(resources: Array<{ url: string; type: 'image' | 'font' | 'script' | 'style' }>) {
    if (typeof window === 'undefined') return

    resources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.url

      switch (resource.type) {
        case 'image':
          link.as = 'image'
          break
        case 'font':
          link.as = 'font'
          link.crossOrigin = 'anonymous'
          break
        case 'script':
          link.as = 'script'
          break
        case 'style':
          link.as = 'style'
          break
      }

      document.head.appendChild(link)
    })
  }

  // Lazy loading with Intersection Observer
  static setupLazyLoading(selector = 'img[data-lazy]', options = {}) {
    if (typeof window === 'undefined') return

    const defaultOptions = {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.lazy

          if (src) {
            // Add loading class
            img.classList.add('loading')

            // Create a new image to preload
            const newImg = new Image()
            newImg.onload = () => {
              img.src = src
              img.classList.remove('loading')
              img.classList.add('loaded')
            }
            newImg.onerror = () => {
              img.classList.remove('loading')
              img.classList.add('error')
            }
            newImg.src = src

            observer.unobserve(img)
          }
        }
      })
    }, defaultOptions)

    document.querySelectorAll(selector).forEach(img => {
      observer.observe(img)
    })

    return observer
  }

  // Purge CDN cache
  static async purgeCDNCache(urls: string[] | string): Promise<boolean> {
    if (!this.cdnConfig?.purgeEndpoint || !this.cdnConfig.apiKey) {
      console.warn('CDN purge not configured')
      return false
    }

    try {
      const urlArray = Array.isArray(urls) ? urls : [urls]

      const response = await fetch(this.cdnConfig.purgeEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cdnConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: urlArray })
      })

      return response.ok
    } catch (error) {
      console.error('CDN purge failed:', error)
      return false
    }
  }

  // Bundle analyzer helper (for development)
  static analyzeBundleSize() {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return

    // Simple bundle size analysis
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))

    const sizes = {
      scripts: scripts.length,
      styles: styles.length,
      totalRequests: scripts.length + styles.length
    }

    console.log('📊 Bundle Analysis:', sizes)

    // Check for common optimization opportunities
    const warnings = []
    if (scripts.length > 10) warnings.push('Consider code splitting - too many script files')
    if (styles.length > 5) warnings.push('Consider CSS bundling - too many stylesheet files')

    if (warnings.length > 0) {
      console.warn('⚠️ Optimization Opportunities:', warnings)
    }
  }

  // Memory optimization for large datasets
  static optimizeDataset<T>(
    items: T[],
    pageSize = 20,
    currentPage = 1
  ): {
    items: T[]
    hasMore: boolean
    totalPages: number
    currentPage: number
  } {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedItems = items.slice(startIndex, endIndex)

    return {
      items: paginatedItems,
      hasMore: endIndex < items.length,
      totalPages: Math.ceil(items.length / pageSize),
      currentPage
    }
  }

  // Service Worker registration for caching
  static async registerServiceWorker(swPath = '/sw.js'): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register(swPath)

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New version available!')
            }
          })
        }
      })

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  // Performance monitoring
  static monitorPerformance() {
    if (typeof window === 'undefined') return

    // Core Web Vitals monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            console.log('LCP:', entry.startTime)
            break
          case 'first-input':
            console.log('FID:', (entry as any).processingStart - entry.startTime)
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              console.log('CLS:', (entry as any).value)
            }
            break
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (error) {
      console.warn('Performance monitoring not available:', error)
    }

    // Page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const metrics = {
        TTFB: navigation.responseStart - navigation.fetchStart,
        'DOM Ready': navigation.domContentLoadedEventEnd - navigation.fetchStart,
        'Load Complete': navigation.loadEventEnd - navigation.fetchStart
      }

      console.log('📈 Page Performance:', metrics)
    })
  }

  // Cache invalidation by tags
  static invalidateByTags(tags: string[]) {
    const keysToInvalidate: string[] = []

    this.cache.forEach((value, key) => {
      // This would require storing tags with cache entries
      // Simplified implementation
      keysToInvalidate.push(key)
    })

    keysToInvalidate.forEach(key => this.cache.delete(key))
  }

  // Get cache statistics
  static getCacheStats() {
    const now = Date.now() / 1000
    let active = 0
    let stale = 0
    let expired = 0

    this.cache.forEach(value => {
      if (now < value.expires) active++
      else if (now < value.stale) stale++
      else expired++
    })

    return {
      total: this.cache.size,
      active,
      stale,
      expired,
      hitRate: active / this.cache.size || 0
    }
  }

  // Clear expired cache entries
  static cleanupCache() {
    const now = Date.now() / 1000
    const keysToDelete: string[] = []

    this.cache.forEach((value, key) => {
      if (now > value.stale) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))

    return keysToDelete.length
  }
}

// Utility functions for Next.js optimization

export function optimizeNextImage(src: string, options: ImageOptimization = {}) {
  // For Next.js Image component optimization
  const { width, height, quality = 75 } = options

  const params = new URLSearchParams()
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  params.set('q', quality.toString())

  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`
}

export function generateImageSizes(breakpoints: number[] = [640, 768, 1024, 1280]) {
  return breakpoints.map((bp, index) => {
    if (index === breakpoints.length - 1) return `${bp}px`
    return `(max-width: ${bp}px) 100vw`
  }).join(', ')
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    PerformanceOptimizer.monitorPerformance()
  }
}

// Cache warming for critical data
export async function warmupCache() {
  const criticalData = [
    { key: 'featured-products', fetcher: () => fetch('/api/products?featured=true').then(r => r.json()) },
    { key: 'categories', fetcher: () => fetch('/api/categories').then(r => r.json()) },
    { key: 'popular-products', fetcher: () => fetch('/api/products?sortBy=popular&limit=12').then(r => r.json()) }
  ]

  const promises = criticalData.map(({ key, fetcher }) =>
    PerformanceOptimizer.cachedFetch(key, fetcher, { ttl: 600, staleWhileRevalidate: 300 })
  )

  try {
    await Promise.allSettled(promises)
    console.log('Cache warmed up successfully')
  } catch (error) {
    console.warn('Cache warmup failed:', error)
  }
}
