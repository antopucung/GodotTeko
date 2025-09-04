// Advanced Analytics Engine for Godot Tekko
// Real-time performance monitoring, user behavior tracking, and business metrics

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
  userAgent: string
  connectionType?: string
}

interface UserEvent {
  eventType: string
  eventName: string
  properties: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
  url: string
}

interface CoreWebVitals {
  lcp: number | null  // Largest Contentful Paint
  fid: number | null  // First Input Delay
  cls: number | null  // Cumulative Layout Shift
  fcp: number | null  // First Contentful Paint
  ttfb: number | null // Time to First Byte
}

interface BusinessMetrics {
  conversionRate: number
  averageOrderValue: number
  customerLifetimeValue: number
  cartAbandonmentRate: number
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
}

class AnalyticsEngine {
  private static instance: AnalyticsEngine
  private sessionId: string
  private userId: string | null = null
  private eventBuffer: UserEvent[] = []
  private metricsBuffer: PerformanceMetric[] = []
  private isInitialized = false
  private flushInterval: NodeJS.Timeout | null = null
  private vitals: CoreWebVitals = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  }

  private constructor() {
    this.sessionId = this.generateSessionId()
  }

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine()
    }
    return AnalyticsEngine.instance
  }

  // Initialize the analytics engine
  initialize(userId?: string): void {
    if (this.isInitialized) return

    this.userId = userId || null
    this.setupPerformanceMonitoring()
    this.setupUserBehaviorTracking()
    this.setupBusinessMetricsTracking()
    this.startAutoFlush()
    this.isInitialized = true

    // Track initialization
    this.trackEvent('system', 'analytics_initialized', {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now()
    })
  }

  // Core Web Vitals monitoring
  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return

    // Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          this.vitals.lcp = lastEntry.startTime
          this.reportMetric('lcp', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime
            this.vitals.fid = fid
            this.reportMetric('fid', fid)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let cls = 0
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cls += entry.value
            }
          })
          this.vitals.cls = cls
          this.reportMetric('cls', cls)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.vitals.fcp = entry.startTime
              this.reportMetric('fcp', entry.startTime)
            }
          })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })

      } catch (error) {
        console.warn('Performance monitoring setup failed:', error)
      }
    }

    // Navigation Timing API for TTFB
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navTiming) {
        const ttfb = navTiming.responseStart - navTiming.fetchStart
        this.vitals.ttfb = ttfb
        this.reportMetric('ttfb', ttfb)

        // Additional timing metrics
        this.reportMetric('dom_content_loaded', navTiming.domContentLoadedEventEnd - navTiming.fetchStart)
        this.reportMetric('load_complete', navTiming.loadEventEnd - navTiming.fetchStart)
        this.reportMetric('dns_lookup', navTiming.domainLookupEnd - navTiming.domainLookupStart)
        this.reportMetric('tcp_connect', navTiming.connectEnd - navTiming.connectStart)
      }
    })

    // Resource timing for asset performance
    this.setupResourceTimingMonitoring()
  }

  // Resource timing monitoring
  private setupResourceTimingMonitoring(): void {
    if (typeof window === 'undefined') return

    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: PerformanceResourceTiming) => {
        // Track slow resources (>2 seconds)
        if (entry.duration > 2000) {
          this.reportMetric('slow_resource', entry.duration, {
            resourceUrl: entry.name,
            resourceType: this.getResourceType(entry.name),
            transferSize: entry.transferSize
          })
        }

        // Track failed resources
        if (entry.transferSize === 0 && entry.duration > 0) {
          this.trackEvent('performance', 'resource_failed', {
            resourceUrl: entry.name,
            resourceType: this.getResourceType(entry.name)
          })
        }
      })
    })

    resourceObserver.observe({ entryTypes: ['resource'] })
  }

  // User behavior tracking
  private setupUserBehaviorTracking(): void {
    if (typeof window === 'undefined') return

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('engagement', 'visibility_change', {
        visibilityState: document.visibilityState,
        hidden: document.hidden
      })
    })

    // Scroll depth tracking
    let maxScrollDepth = 0
    const trackScrollDepth = () => {
      const scrollDepth = Math.round(
        (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
      )

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth

        // Track milestone scroll depths
        if ([25, 50, 75, 90, 100].includes(scrollDepth)) {
          this.trackEvent('engagement', 'scroll_depth', {
            scrollDepth,
            url: window.location.pathname
          })
        }
      }
    }

    window.addEventListener('scroll', this.throttle(trackScrollDepth, 500))

    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target) {
        this.trackEvent('interaction', 'click', {
          elementType: target.tagName.toLowerCase(),
          elementId: target.id,
          elementClass: target.className,
          elementText: target.textContent?.slice(0, 100),
          x: event.clientX,
          y: event.clientY
        })
      }
    })

    // Form interaction tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      if (form) {
        this.trackEvent('conversion', 'form_submit', {
          formId: form.id,
          formAction: form.action,
          formMethod: form.method
        })
      }
    })

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent('error', 'javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // Unhandled promise rejection tracking
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error', 'unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      })
    })
  }

  // Business metrics tracking
  private setupBusinessMetricsTracking(): void {
    // Track page views
    this.trackEvent('navigation', 'page_view', {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title
    })

    // Track session start
    this.trackEvent('session', 'session_start', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session', 'session_end', {
        sessionId: this.sessionId,
        sessionDuration: Date.now() - parseInt(this.sessionId)
      })
      this.flushEvents() // Ensure events are sent before page unload
    })
  }

  // Track custom events
  trackEvent(category: string, eventName: string, properties: Record<string, any> = {}): void {
    const event: UserEvent = {
      eventType: category,
      eventName,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        connectionType: this.getConnectionType()
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: typeof window !== 'undefined' ? window.location.pathname : ''
    }

    this.eventBuffer.push(event)

    // Immediate flush for critical events
    if (['error', 'conversion'].includes(category)) {
      this.flushEvents()
    }
  }

  // Report performance metrics
  private reportMetric(name: string, value: number, properties: Record<string, any> = {}): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connectionType: this.getConnectionType()
    }

    this.metricsBuffer.push(metric)

    // Send to external analytics if configured
    this.sendToAnalytics('performance', metric)
  }

  // E-commerce tracking
  trackPurchase(transactionData: {
    transactionId: string
    value: number
    currency: string
    items: Array<{
      itemId: string
      itemName: string
      category: string
      quantity: number
      price: number
    }>
  }): void {
    this.trackEvent('ecommerce', 'purchase', transactionData)
  }

  trackAddToCart(item: {
    itemId: string
    itemName: string
    category: string
    quantity: number
    price: number
  }): void {
    this.trackEvent('ecommerce', 'add_to_cart', item)
  }

  trackRemoveFromCart(item: {
    itemId: string
    itemName: string
    category: string
    quantity: number
  }): void {
    this.trackEvent('ecommerce', 'remove_from_cart', item)
  }

  // Set user identity
  setUser(userId: string, properties?: Record<string, any>): void {
    this.userId = userId
    this.trackEvent('user', 'identify', {
      userId,
      ...properties
    })
  }

  // Get current Core Web Vitals
  getCoreWebVitals(): CoreWebVitals {
    return { ...this.vitals }
  }

  // Flush events to server
  async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0 && this.metricsBuffer.length === 0) return

    const payload = {
      events: [...this.eventBuffer],
      metrics: [...this.metricsBuffer],
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now()
    }

    // Clear buffers
    this.eventBuffer = []
    this.metricsBuffer = []

    try {
      // Send to our analytics API
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.warn('Failed to send analytics data:', error)
    }
  }

  // Start automatic event flushing
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents()
    }, 30000) // Flush every 30 seconds
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getConnectionType(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return connection?.effectiveType || 'unknown'
    }
    return 'unknown'
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(css)$/)) return 'stylesheet'
    if (url.match(/\.(js)$/)) return 'script'
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font'
    return 'other'
  }

  private throttle(func: Function, limit: number) {
    let inThrottle: boolean
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Send data to external analytics services
  private sendToAnalytics(type: string, data: any): void {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', type, data)
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', type, data)
    }

    // Custom analytics endpoints
    // You can add other services here
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushEvents()
  }
}

// Export singleton instance
export const analytics = AnalyticsEngine.getInstance()

// Export types for use in other files
export type {
  PerformanceMetric,
  UserEvent,
  CoreWebVitals,
  BusinessMetrics
}

// React hook for analytics
export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPurchase: analytics.trackPurchase.bind(analytics),
    trackAddToCart: analytics.trackAddToCart.bind(analytics),
    trackRemoveFromCart: analytics.trackRemoveFromCart.bind(analytics),
    setUser: analytics.setUser.bind(analytics),
    getCoreWebVitals: analytics.getCoreWebVitals.bind(analytics),
    flushEvents: analytics.flushEvents.bind(analytics)
  }
}
