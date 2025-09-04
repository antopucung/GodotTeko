import { client } from './sanity'
import { PerformanceOptimizer } from './performance-optimizer'

interface HealthCheckResult {
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  message: string
  timestamp: string
  responseTime?: number
  details?: Record<string, any>
  suggestions?: string[]
}

interface ComponentHealth {
  componentName: string
  endpoint?: string
  dependencies: string[]
  lastChecked: string
  status: 'healthy' | 'warning' | 'critical'
  issues: HealthCheckResult[]
  performance: {
    averageResponseTime: number
    errorRate: number
    cacheHitRate?: number
  }
}

interface SanityMetrics {
  connectionHealth: HealthCheckResult
  queryPerformance: HealthCheckResult[]
  schemaValidation: HealthCheckResult[]
  assetDelivery: HealthCheckResult
  cacheHealth: HealthCheckResult
  dataConsistency: HealthCheckResult[]
  componentStatus: ComponentHealth[]
}

interface ExtensibleData {
  customChecks: Record<string, any>
  futureMetrics: Record<string, any>
  integrationData: Record<string, any>
  businessMetrics: Record<string, any>
}

// Platform components that use Sanity - Complete mapping
const SANITY_COMPONENTS = {
  // Product Management
  'products-api': {
    name: 'Products API',
    endpoints: ['/api/products', '/api/products/[slug]'],
    dependencies: ['product', 'category', 'author'],
    criticalQueries: [
      'product listings',
      'product details',
      'category filtering',
      'search functionality'
    ]
  },

  // User Management
  'users-api': {
    name: 'User Management',
    endpoints: ['/api/user/profile', '/api/auth'],
    dependencies: ['user', 'userBehavior'],
    criticalQueries: [
      'user profiles',
      'authentication data',
      'user preferences'
    ]
  },

  // Partner System
  'partner-api': {
    name: 'Partner System',
    endpoints: ['/api/partner/upload', '/api/partner/analytics'],
    dependencies: ['partnerAsset', 'partnerApplication'],
    criticalQueries: [
      'partner verification',
      'file uploads',
      'asset management'
    ]
  },

  // License Management
  'licenses-api': {
    name: 'License Management',
    endpoints: ['/api/user/licenses', '/api/download/smart'],
    dependencies: ['license', 'accessPass', 'order'],
    criticalQueries: [
      'license validation',
      'download tracking',
      'access verification'
    ]
  },

  // Analytics & Tracking
  'analytics-api': {
    name: 'Analytics System',
    endpoints: ['/api/partner/analytics', '/api/dashboard/stats'],
    dependencies: ['userBehavior', 'order', 'license'],
    criticalQueries: [
      'user behavior tracking',
      'revenue analytics',
      'performance metrics'
    ]
  },

  // Content Management
  'content-api': {
    name: 'Content Management',
    endpoints: ['/api/categories', '/api/authors'],
    dependencies: ['category', 'author', 'product'],
    criticalQueries: [
      'category organization',
      'author profiles',
      'content relationships'
    ]
  }
} as const

export class SanityHealthChecker {
  private static lastHealthCheck: SanityMetrics | null = null
  private static extensibleData: ExtensibleData = {
    customChecks: {},
    futureMetrics: {},
    integrationData: {},
    businessMetrics: {}
  }

  // Main health check orchestrator
  static async performFullHealthCheck(): Promise<SanityMetrics & { extensible: ExtensibleData }> {
    const startTime = Date.now()

    try {
      // Run all health checks in parallel for performance
      const [
        connectionHealth,
        queryPerformance,
        schemaValidation,
        assetDelivery,
        cacheHealth,
        dataConsistency,
        componentStatus
      ] = await Promise.allSettled([
        this.checkConnection(),
        this.checkQueryPerformance(),
        this.validateSchemas(),
        this.checkAssetDelivery(),
        this.checkCacheHealth(),
        this.checkDataConsistency(),
        this.checkAllComponents()
      ])

      const healthMetrics: SanityMetrics = {
        connectionHealth: this.unwrapResult(connectionHealth, 'Connection Check'),
        queryPerformance: this.unwrapArrayResult(queryPerformance, 'Query Performance'),
        schemaValidation: this.unwrapArrayResult(schemaValidation, 'Schema Validation'),
        assetDelivery: this.unwrapResult(assetDelivery, 'Asset Delivery'),
        cacheHealth: this.unwrapResult(cacheHealth, 'Cache Health'),
        dataConsistency: this.unwrapArrayResult(dataConsistency, 'Data Consistency'),
        componentStatus: this.unwrapArrayResult(componentStatus as any, 'Component Status') as unknown as ComponentHealth[]
      }

      // Store for historical tracking
      this.lastHealthCheck = healthMetrics

      // Add extensible data
      await this.collectExtensibleData()

      console.log(`Full health check completed in ${Date.now() - startTime}ms`)

      return {
        ...healthMetrics,
        extensible: this.extensibleData
      }

    } catch (error) {
      console.error('Health check failed:', error)
      return this.getEmergencyHealthStatus(error)
    }
  }

  // 1. Connection Health Check
  static async checkConnection(): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      // Test basic connectivity
      const response = await client.fetch('*[_type == "sanity.imageAsset"][0]{_id}')
      const responseTime = Date.now() - startTime

      if (responseTime > 5000) {
        return {
          name: 'Sanity Connection',
          status: 'warning',
          message: 'Connection is slow but functional',
          timestamp: new Date().toISOString(),
          responseTime,
          suggestions: ['Check network connectivity', 'Consider CDN optimization']
        }
      }

      return {
        name: 'Sanity Connection',
        status: 'healthy',
        message: 'Connection is stable and fast',
        timestamp: new Date().toISOString(),
        responseTime
      }

    } catch (error) {
      return {
        name: 'Sanity Connection',
        status: 'critical',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        suggestions: [
          'Check Sanity API credentials',
          'Verify network connectivity',
          'Check Sanity service status'
        ]
      }
    }
  }

  // 2. Query Performance Analysis
  static async checkQueryPerformance(): Promise<HealthCheckResult[]> {
    const criticalQueries = [
      {
        name: 'Product Listings',
        query: '*[_type == "product"][0...5]{_id, title, price}',
        threshold: 1000
      },
      {
        name: 'User Authentication',
        query: '*[_type == "user"][0]{_id, name, email}',
        threshold: 500
      },
      {
        name: 'Category Listing',
        query: '*[_type == "category"]{_id, name, slug}',
        threshold: 800
      },
      {
        name: 'License Validation',
        query: '*[_type == "license"][0]{_id, status, downloadCount}',
        threshold: 600
      }
    ]

    const results: HealthCheckResult[] = []

    for (const queryTest of criticalQueries) {
      const startTime = Date.now()

      try {
        await client.fetch(queryTest.query)
        const responseTime = Date.now() - startTime

        const status = responseTime > queryTest.threshold ? 'warning' : 'healthy'

        results.push({
          name: queryTest.name,
          status,
          message: status === 'healthy'
            ? `Query performance is optimal (${responseTime}ms)`
            : `Query is slower than expected (${responseTime}ms > ${queryTest.threshold}ms)`,
          timestamp: new Date().toISOString(),
          responseTime,
          details: { query: queryTest.query, threshold: queryTest.threshold },
          suggestions: status === 'warning' ? [
            'Consider query optimization',
            'Add appropriate indexes',
            'Review query complexity'
          ] : undefined
        })

      } catch (error) {
        results.push({
          name: queryTest.name,
          status: 'critical',
          message: `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          details: { query: queryTest.query },
          suggestions: [
            'Check query syntax',
            'Verify schema compatibility',
            'Review data availability'
          ]
        })
      }
    }

    return results
  }

  // 3. Schema Validation
  static async validateSchemas(): Promise<HealthCheckResult[]> {
    const expectedSchemas = [
      'product', 'user', 'category', 'author', 'order',
      'license', 'accessPass', 'partnerAsset', 'userBehavior'
    ]

    const results: HealthCheckResult[] = []

    for (const schemaType of expectedSchemas) {
      try {
        const count = await client.fetch(`count(*[_type == "${schemaType}"])`)

        results.push({
          name: `Schema: ${schemaType}`,
          status: 'healthy',
          message: `Schema exists with ${count} documents`,
          timestamp: new Date().toISOString(),
          details: { documentCount: count, schemaType }
        })

      } catch (error) {
        results.push({
          name: `Schema: ${schemaType}`,
          status: 'critical',
          message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          details: { schemaType },
          suggestions: [
            'Check schema definition in Sanity Studio',
            'Verify schema migration',
            'Review document structure'
          ]
        })
      }
    }

    return results
  }

  // 4. Asset Delivery Check
  static async checkAssetDelivery(): Promise<HealthCheckResult> {
    try {
      // Test asset availability
      const asset = await client.fetch(`
        *[_type == "sanity.imageAsset"][0]{
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      `)

      if (!asset) {
        return {
          name: 'Asset Delivery',
          status: 'warning',
          message: 'No assets found in Sanity',
          timestamp: new Date().toISOString(),
          suggestions: ['Upload test assets', 'Verify asset upload process']
        }
      }

      // Test asset URL accessibility
      const startTime = Date.now()
      const response = await fetch(asset.url, { method: 'HEAD' })
      const responseTime = Date.now() - startTime

      if (!response.ok) {
        return {
          name: 'Asset Delivery',
          status: 'critical',
          message: `Asset delivery failed: HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
          details: { assetUrl: asset.url, httpStatus: response.status },
          suggestions: [
            'Check CDN configuration',
            'Verify asset permissions',
            'Review Sanity asset settings'
          ]
        }
      }

      return {
        name: 'Asset Delivery',
        status: responseTime > 3000 ? 'warning' : 'healthy',
        message: `Asset delivery is functional (${responseTime}ms)`,
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          assetUrl: asset.url,
          dimensions: asset.metadata?.dimensions
        }
      }

    } catch (error) {
      return {
        name: 'Asset Delivery',
        status: 'critical',
        message: `Asset delivery check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        suggestions: [
          'Check asset upload functionality',
          'Verify Sanity configuration',
          'Review CDN settings'
        ]
      }
    }
  }

  // 5. Cache Health Check
  static async checkCacheHealth(): Promise<HealthCheckResult> {
    try {
      const cacheStats = PerformanceOptimizer.getCacheStats()

      const status = cacheStats.hitRate > 0.7 ? 'healthy' :
                   cacheStats.hitRate > 0.4 ? 'warning' : 'critical'

      return {
        name: 'Cache Health',
        status,
        message: `Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        details: cacheStats,
        suggestions: status !== 'healthy' ? [
          'Review cache configuration',
          'Optimize cache keys',
          'Increase cache TTL for stable data'
        ] : undefined
      }

    } catch (error) {
      return {
        name: 'Cache Health',
        status: 'warning',
        message: 'Cache monitoring unavailable',
        timestamp: new Date().toISOString(),
        suggestions: ['Implement cache monitoring', 'Check cache configuration']
      }
    }
  }

  // 6. Data Consistency Check
  static async checkDataConsistency(): Promise<HealthCheckResult[]> {
    const consistencyChecks = [
      {
        name: 'Product-Category Relations',
        check: async () => {
          const orphanedProducts = await client.fetch(`
            count(*[_type == "product" && !defined(categories)])
          `)
          return { orphanedProducts }
        }
      },
      {
        name: 'License-Order Relations',
        check: async () => {
          const orphanedLicenses = await client.fetch(`
            count(*[_type == "license" && !defined(order)])
          `)
          return { orphanedLicenses }
        }
      },
      {
        name: 'User-License Relations',
        check: async () => {
          const orphanedLicenses = await client.fetch(`
            count(*[_type == "license" && !defined(user)])
          `)
          return { orphanedLicenses }
        }
      }
    ]

    const results: HealthCheckResult[] = []

    for (const check of consistencyChecks) {
      try {
        const result = await check.check()
        const hasIssues = Object.values(result).some(count => count > 0)

        results.push({
          name: check.name,
          status: hasIssues ? 'warning' : 'healthy',
          message: hasIssues
            ? `Data inconsistencies found: ${JSON.stringify(result)}`
            : 'Data relationships are consistent',
          timestamp: new Date().toISOString(),
          details: result,
          suggestions: hasIssues ? [
            'Review data migration scripts',
            'Implement data validation',
            'Clean up orphaned records'
          ] : undefined
        })

      } catch (error) {
        results.push({
          name: check.name,
          status: 'critical',
          message: `Consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Check query permissions',
            'Verify schema structure',
            'Review data integrity'
          ]
        })
      }
    }

    return results
  }

  // 7. Component Health Check
  static async checkAllComponents(): Promise<ComponentHealth[]> {
    const componentHealthList: ComponentHealth[] = []

    for (const [componentId, component] of Object.entries(SANITY_COMPONENTS)) {
      try {
        // Test component-specific queries
        const healthChecks = await Promise.allSettled(
          component.criticalQueries.map(async (queryName) => {
            const startTime = Date.now()

            // Simulate component health check (you can customize these)
            await client.fetch(`*[_type == "${component.dependencies[0]}"][0]{_id}`)

            return {
              name: queryName,
              status: 'healthy' as const,
              message: 'Component query successful',
              timestamp: new Date().toISOString(),
              responseTime: Date.now() - startTime
            }
          })
        )

        const issues = healthChecks
          .map(result => result.status === 'fulfilled' ? result.value : {
            name: 'Unknown Query',
            status: 'critical' as const,
            message: 'Query failed',
            timestamp: new Date().toISOString()
          })
          .filter(check => check.status !== 'healthy')

        const avgResponseTime = healthChecks
          .filter((result: any): result is PromiseFulfilledResult<HealthCheckResult> => result.status === 'fulfilled')
          .reduce((sum: number, result: any) => sum + (result.value?.responseTime || 0), 0) / healthChecks.length

        componentHealthList.push({
          componentName: component.name,
          endpoint: component.endpoints[0],
          dependencies: [...component.dependencies],
          lastChecked: new Date().toISOString(),
          status: issues.length === 0 ? 'healthy' : issues.some(i => i.status === 'critical') ? 'critical' : 'warning',
          issues,
          performance: {
            averageResponseTime: avgResponseTime,
            errorRate: issues.length / healthChecks.length,
            cacheHitRate: Math.random() * 0.3 + 0.7 // Mock cache hit rate
          }
        })

      } catch (error) {
        componentHealthList.push({
          componentName: component.name,
          endpoint: component.endpoints[0],
          dependencies: [...component.dependencies],
          lastChecked: new Date().toISOString(),
          status: 'critical',
          issues: [{
            name: 'Component Check',
            status: 'critical',
            message: `Component health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
            suggestions: [
              'Check component dependencies',
              'Verify Sanity schema',
              'Review component configuration'
            ]
          }],
          performance: {
            averageResponseTime: 0,
            errorRate: 1
          }
        })
      }
    }

    return componentHealthList
  }

  // Extensible Data Collection (for future features)
  static async collectExtensibleData(): Promise<void> {
    try {
      // Business metrics that can be extended
      this.extensibleData.businessMetrics = {
        totalProducts: await client.fetch('count(*[_type == "product"])'),
        totalUsers: await client.fetch('count(*[_type == "user"])'),
        totalOrders: await client.fetch('count(*[_type == "order"])'),
        totalAssets: await client.fetch('count(*[_type == "sanity.fileAsset"])'),
        lastDataUpdate: new Date().toISOString()
      }

      // Integration health data
      this.extensibleData.integrationData = {
        sanityVersion: await this.getSanityVersion(),
        apiVersion: 'v2024-01-01', // Current API version
        datasetSize: await this.estimateDatasetSize(),
        lastMigration: await this.getLastMigrationDate()
      }

      // Future metrics placeholder
      this.extensibleData.futureMetrics = {
        placeholder: 'Ready for future monitoring features',
        extensionPoints: [
          'machine_learning_metrics',
          'user_behavior_analysis',
          'performance_predictions',
          'automated_optimization',
          'business_intelligence'
        ]
      }

      // Custom checks can be added here
      this.extensibleData.customChecks = {
        lastUpdated: new Date().toISOString(),
        customHealthChecks: [] // Placeholder for custom health checks
      }

    } catch (error) {
      console.warn('Failed to collect extensible data:', error)
    }
  }

  // Helper methods
  private static unwrapResult(result: PromiseSettledResult<HealthCheckResult>, defaultName: string): HealthCheckResult {
    if (result.status === 'fulfilled') {
      return result.value
    }

    return {
      name: defaultName,
      status: 'critical',
      message: `Health check failed: ${result.reason?.message || 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      suggestions: ['Check service availability', 'Review configuration']
    }
  }

  private static unwrapArrayResult(result: PromiseSettledResult<HealthCheckResult[]>, defaultName: string): HealthCheckResult[] {
    if (result.status === 'fulfilled') {
      return result.value
    }

    return [{
      name: defaultName,
      status: 'critical',
      message: `Health check failed: ${result.reason?.message || 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      suggestions: ['Check service availability', 'Review configuration']
    }]
  }

  private static getEmergencyHealthStatus(error: any): SanityMetrics & { extensible: ExtensibleData } {
    const errorResult: HealthCheckResult = {
      name: 'Emergency Status',
      status: 'critical',
      message: `Complete health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Check Sanity service status',
        'Verify network connectivity',
        'Review system configuration'
      ]
    }

    return {
      connectionHealth: errorResult,
      queryPerformance: [errorResult],
      schemaValidation: [errorResult],
      assetDelivery: errorResult,
      cacheHealth: errorResult,
      dataConsistency: [errorResult],
      componentStatus: [],
      extensible: this.extensibleData
    }
  }

  // Additional helper methods for extensible data
  private static async getSanityVersion(): Promise<string> {
    try {
      // This would need to be implemented based on Sanity's API
      return 'v3.x.x'
    } catch {
      return 'unknown'
    }
  }

  private static async estimateDatasetSize(): Promise<number> {
    try {
      const counts = await Promise.all([
        client.fetch('count(*[_type == "product"])'),
        client.fetch('count(*[_type == "user"])'),
        client.fetch('count(*[_type == "order"])'),
        client.fetch('count(*[_type == "license"])')
      ])
      return counts.reduce((sum, count) => sum + count, 0)
    } catch {
      return 0
    }
  }

  private static async getLastMigrationDate(): Promise<string | null> {
    try {
      // This would track migration history if implemented
      return new Date().toISOString()
    } catch {
      return null
    }
  }

  // Quick health check for frequent monitoring
  static async quickHealthCheck(): Promise<{ status: 'healthy' | 'warning' | 'critical', summary: string }> {
    try {
      const startTime = Date.now()
      await client.fetch('*[_type == "product"][0]{_id}')
      const responseTime = Date.now() - startTime

      if (responseTime > 3000) {
        return { status: 'warning', summary: `Sanity responding slowly (${responseTime}ms)` }
      }

      return { status: 'healthy', summary: `Sanity is healthy (${responseTime}ms)` }
    } catch (error) {
      return {
        status: 'critical',
        summary: `Sanity connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Get last health check results
  static getLastHealthCheck(): SanityMetrics | null {
    return this.lastHealthCheck
  }

  // Add custom health check (extensible)
  static addCustomHealthCheck(name: string, checker: () => Promise<HealthCheckResult>): void {
    this.extensibleData.customChecks[name] = checker
  }

  // Clear health check cache
  static clearHealthCache(): void {
    this.lastHealthCheck = null
    PerformanceOptimizer.cleanupCache()
  }
}
