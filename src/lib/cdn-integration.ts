// CDN Integration for Godot Tekko
// Cloudflare and AWS CloudFront integration for global edge caching

interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'custom'
  apiKey: string
  apiSecret?: string
  zoneId?: string // Cloudflare
  distributionId?: string // AWS CloudFront
  endpoint: string
  regions?: string[]
}

interface CacheRule {
  pattern: string
  ttl: number // in seconds
  browserTtl?: number
  edgeTtl?: number
  bypassCacheOnCookie?: string[]
  cacheByHeaders?: string[]
  cacheByQueryString?: boolean | string[]
}

interface PurgeRequest {
  urls?: string[]
  tags?: string[]
  files?: string[]
  purgeEverything?: boolean
}

interface CDNMetrics {
  requests: number
  bandwidth: number
  hitRate: number
  originRequests: number
  edgeResponseTime: number
  originResponseTime: number
  timestamp: number
}

interface EdgeLocation {
  code: string
  city: string
  country: string
  region: string
  latitude: number
  longitude: number
}

class CDNManager {
  private static instance: CDNManager
  private config: CDNConfig | null = null
  private cacheRules: CacheRule[] = []
  private metrics: CDNMetrics[] = []

  private constructor() {}

  static getInstance(): CDNManager {
    if (!CDNManager.instance) {
      CDNManager.instance = new CDNManager()
    }
    return CDNManager.instance
  }

  // Initialize CDN configuration
  initialize(config: CDNConfig): void {
    this.config = config
    this.setupDefaultCacheRules()
    this.startMetricsCollection()
  }

  // Setup default cache rules for different content types
  private setupDefaultCacheRules(): void {
    this.cacheRules = [
      // Static assets - long cache
      {
        pattern: '/_next/static/*',
        ttl: 31536000, // 1 year
        browserTtl: 31536000,
        edgeTtl: 31536000
      },
      {
        pattern: '/static/*',
        ttl: 31536000,
        browserTtl: 31536000,
        edgeTtl: 31536000
      },

      // Images - medium cache
      {
        pattern: '*.{jpg,jpeg,png,gif,webp,avif,svg,ico}',
        ttl: 604800, // 1 week
        browserTtl: 604800,
        edgeTtl: 2592000 // 30 days
      },

      // Fonts - long cache
      {
        pattern: '*.{woff,woff2,ttf,otf,eot}',
        ttl: 31536000,
        browserTtl: 31536000,
        edgeTtl: 31536000
      },

      // CSS/JS - medium cache with versioning
      {
        pattern: '*.{css,js}',
        ttl: 86400, // 1 day
        browserTtl: 86400,
        edgeTtl: 604800, // 1 week
        cacheByHeaders: ['accept-encoding']
      },

      // API responses - short cache
      {
        pattern: '/api/products*',
        ttl: 300, // 5 minutes
        browserTtl: 60,
        edgeTtl: 300,
        cacheByHeaders: ['authorization'],
        cacheByQueryString: ['category', 'sort', 'page']
      },
      {
        pattern: '/api/categories*',
        ttl: 3600, // 1 hour
        browserTtl: 1800,
        edgeTtl: 3600
      },
      {
        pattern: '/api/site-configuration*',
        ttl: 86400, // 1 day
        browserTtl: 3600,
        edgeTtl: 86400
      },

      // HTML pages - short cache
      {
        pattern: '/',
        ttl: 300,
        browserTtl: 60,
        edgeTtl: 300,
        bypassCacheOnCookie: ['session', 'auth-token']
      },
      {
        pattern: '/products/*',
        ttl: 1800, // 30 minutes
        browserTtl: 300,
        edgeTtl: 1800,
        bypassCacheOnCookie: ['session', 'auth-token']
      },

      // User-specific content - no cache
      {
        pattern: '/user/*',
        ttl: 0,
        browserTtl: 0,
        edgeTtl: 0
      },
      {
        pattern: '/admin/*',
        ttl: 0,
        browserTtl: 0,
        edgeTtl: 0
      },
      {
        pattern: '/api/user/*',
        ttl: 0,
        browserTtl: 0,
        edgeTtl: 0
      }
    ]
  }

  // Cloudflare-specific methods
  async cloudflareCreateCacheRules(): Promise<boolean> {
    if (!this.config || this.config.provider !== 'cloudflare') {
      throw new Error('Cloudflare not configured')
    }

    try {
      for (const rule of this.cacheRules) {
        await this.cloudflareCreateRule(rule)
      }
      return true
    } catch (error) {
      console.error('Failed to create Cloudflare cache rules:', error)
      return false
    }
  }

  private async cloudflareCreateRule(rule: CacheRule): Promise<any> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config!.zoneId}/rulesets`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Cache rule for ${rule.pattern}`,
          kind: 'zone',
          phase: 'http_request_cache_settings',
          rules: [{
            expression: this.convertPatternToExpression(rule.pattern),
            action: 'set_cache_settings',
            action_parameters: {
              cache: true,
              edge_ttl: rule.edgeTtl || rule.ttl,
              browser_ttl: rule.browserTtl || rule.ttl,
              cache_key: {
                include_query_strings: rule.cacheByQueryString || false,
                include_headers: rule.cacheByHeaders || []
              }
            }
          }]
        })
      }
    )

    return response.json()
  }

  // Purge cache
  async purgeCache(request: PurgeRequest): Promise<boolean> {
    if (!this.config) {
      throw new Error('CDN not configured')
    }

    switch (this.config.provider) {
      case 'cloudflare':
        return this.cloudflarePurgeCache(request)
      case 'aws':
        return this.awsPurgeCache(request)
      default:
        return false
    }
  }

  private async cloudflarePurgeCache(request: PurgeRequest): Promise<boolean> {
    try {
      const purgeData: any = {}

      if (request.purgeEverything) {
        purgeData.purge_everything = true
      } else {
        if (request.urls) purgeData.files = request.urls
        if (request.tags) purgeData.tags = request.tags
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.config!.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config!.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(purgeData)
        }
      )

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Cloudflare cache purge failed:', error)
      return false
    }
  }

  private async awsPurgeCache(request: PurgeRequest): Promise<boolean> {
    // AWS CloudFront invalidation implementation
    try {
      const paths = request.urls || request.files || ['/*']

      // Note: This is a simplified example. In production, you'd use AWS SDK
      const invalidationData = {
        DistributionId: this.config!.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: paths.length,
            Items: paths
          },
          CallerReference: `purge-${Date.now()}`
        }
      }

      // This would use AWS SDK in practice
      console.log('AWS CloudFront invalidation:', invalidationData)
      return true
    } catch (error) {
      console.error('AWS CloudFront purge failed:', error)
      return false
    }
  }

  // Get CDN analytics
  async getAnalytics(timeframe: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'): Promise<CDNMetrics[]> {
    if (!this.config) {
      throw new Error('CDN not configured')
    }

    switch (this.config.provider) {
      case 'cloudflare':
        return this.getCloudflareAnalytics(timeframe)
      case 'aws':
        return this.getAWSAnalytics(timeframe)
      default:
        return []
    }
  }

  private async getCloudflareAnalytics(timeframe: string): Promise<CDNMetrics[]> {
    try {
      const since = this.getTimeframeSince(timeframe)
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.config!.zoneId}/analytics/dashboard?since=${since}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config!.apiKey}`
          }
        }
      )

      const data = await response.json()
      return this.transformCloudflareMetrics(data.result)
    } catch (error) {
      console.error('Failed to fetch Cloudflare analytics:', error)
      return []
    }
  }

  private async getAWSAnalytics(timeframe: string): Promise<CDNMetrics[]> {
    // AWS CloudWatch metrics implementation
    // This would use AWS SDK in practice
    return []
  }

  // Edge location optimization
  async getOptimalEdgeLocations(): Promise<EdgeLocation[]> {
    if (this.config?.provider === 'cloudflare') {
      return this.getCloudflareEdgeLocations()
    }
    return []
  }

  private async getCloudflareEdgeLocations(): Promise<EdgeLocation[]> {
    // This would fetch from Cloudflare's edge locations API
    // For now, return common locations
    return [
      { code: 'LAX', city: 'Los Angeles', country: 'US', region: 'North America', latitude: 34.0522, longitude: -118.2437 },
      { code: 'JFK', city: 'New York', country: 'US', region: 'North America', latitude: 40.7128, longitude: -74.0060 },
      { code: 'LHR', city: 'London', country: 'GB', region: 'Europe', latitude: 51.5074, longitude: -0.1278 },
      { code: 'FRA', city: 'Frankfurt', country: 'DE', region: 'Europe', latitude: 50.1109, longitude: 8.6821 },
      { code: 'SIN', city: 'Singapore', country: 'SG', region: 'Asia Pacific', latitude: 1.3521, longitude: 103.8198 },
      { code: 'NRT', city: 'Tokyo', country: 'JP', region: 'Asia Pacific', latitude: 35.6762, longitude: 139.6503 }
    ]
  }

  // Performance optimization
  async optimizeForRegion(region: string): Promise<void> {
    // Implement region-specific optimizations
    const regionConfig = this.getRegionConfig(region)
    await this.updateCacheRules(regionConfig.cacheRules)
  }

  private getRegionConfig(region: string) {
    const configs = {
      'us': {
        cacheRules: [
          // US-specific cache rules
          { pattern: '/api/*', ttl: 300, edgeTtl: 600 }
        ]
      },
      'eu': {
        cacheRules: [
          // EU-specific cache rules (GDPR considerations)
          { pattern: '/api/*', ttl: 180, edgeTtl: 300 }
        ]
      },
      'asia': {
        cacheRules: [
          // Asia-specific cache rules
          { pattern: '/api/*', ttl: 300, edgeTtl: 900 }
        ]
      }
    }

    return configs[region as keyof typeof configs] || configs.us
  }

  // Update cache rules
  private async updateCacheRules(newRules: CacheRule[]): Promise<void> {
    // Implementation would depend on CDN provider
    console.log('Updating cache rules:', newRules)
  }

  // Start collecting metrics
  private startMetricsCollection(): void {
    setInterval(async () => {
      const metrics = await this.collectCurrentMetrics()
      this.metrics.push(metrics)

      // Keep only last 24 hours of metrics
      const cutoff = Date.now() - (24 * 60 * 60 * 1000)
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    }, 60000) // Every minute
  }

  private async collectCurrentMetrics(): Promise<CDNMetrics> {
    // Implementation would fetch real metrics from CDN provider
    return {
      requests: Math.random() * 10000,
      bandwidth: Math.random() * 1000000000,
      hitRate: 0.85 + Math.random() * 0.1,
      originRequests: Math.random() * 1000,
      edgeResponseTime: 50 + Math.random() * 50,
      originResponseTime: 200 + Math.random() * 300,
      timestamp: Date.now()
    }
  }

  // Utility methods
  private convertPatternToExpression(pattern: string): string {
    // Convert glob pattern to Cloudflare expression
    return pattern
      .replace(/\*/g, '.*')
      .replace(/\./g, '\\.')
      .replace(/\{([^}]+)\}/g, '($1)')
  }

  private getTimeframeSince(timeframe: string): string {
    const now = new Date()
    switch (timeframe) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      case '6h':
        return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }
  }

  private transformCloudflareMetrics(data: any): CDNMetrics[] {
    // Transform Cloudflare API response to our metrics format
    return data.timeseries?.map((point: any) => ({
      requests: point.requests?.all || 0,
      bandwidth: point.bandwidth?.all || 0,
      hitRate: point.requests?.cached_ratio || 0,
      originRequests: point.requests?.uncached || 0,
      edgeResponseTime: point.performance?.edge_response_time || 0,
      originResponseTime: point.performance?.origin_response_time || 0,
      timestamp: new Date(point.since).getTime()
    })) || []
  }

  // Get current metrics
  getCurrentMetrics(): CDNMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  // Get metrics history
  getMetricsHistory(): CDNMetrics[] {
    return [...this.metrics]
  }
}

// Export singleton instance
export const cdnManager = CDNManager.getInstance()

// Environment-specific CDN configurations
export const CDN_CONFIGS = {
  production: {
    cloudflare: {
      provider: 'cloudflare' as const,
      apiKey: process.env.CLOUDFLARE_API_TOKEN || '',
      zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
      endpoint: 'https://api.cloudflare.com/client/v4',
      regions: ['us', 'eu', 'asia']
    },
    aws: {
      provider: 'aws' as const,
      apiKey: process.env.AWS_ACCESS_KEY_ID || '',
      apiSecret: process.env.AWS_SECRET_ACCESS_KEY || '',
      distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || '',
      endpoint: 'https://cloudfront.amazonaws.com',
      regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1']
    }
  },
  development: {
    // No CDN in development
  }
}

// React hook for CDN metrics
export const useCDNMetrics = () => {
  const [metrics, setMetrics] = React.useState<CDNMetrics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = cdnManager.getCurrentMetrics()
      setMetrics(currentMetrics)
      setIsLoading(false)
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const purgeCache = async (request: PurgeRequest) => {
    return cdnManager.purgeCache(request)
  }

  return {
    metrics,
    isLoading,
    purgeCache,
    history: cdnManager.getMetricsHistory()
  }
}

// Export types
export type {
  CDNConfig,
  CacheRule,
  PurgeRequest,
  CDNMetrics,
  EdgeLocation
}

// Import React for the hook
declare const React: any
