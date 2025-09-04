import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SanityHealthChecker } from '@/lib/sanity-health-checker'
import { client } from '@/lib/sanity'

// Component-specific health monitoring endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin access check (simplified for demo)
    const isAdmin = process.env.NODE_ENV === 'development' ||
                    process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE === 'true'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const componentName = searchParams.get('name')
    const detailed = searchParams.get('detailed') === 'true'
    const includeQueries = searchParams.get('queries') === 'true'

    if (componentName) {
      // Get specific component health
      const componentHealth = await getComponentHealth(componentName, detailed, includeQueries)
      return NextResponse.json(componentHealth)
    }

    // Get all components overview
    const allComponents = await getAllComponentsHealth(detailed)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      totalComponents: allComponents.length,
      healthyComponents: allComponents.filter(c => c.status === 'healthy').length,
      warningComponents: allComponents.filter(c => c.status === 'warning').length,
      criticalComponents: allComponents.filter(c => c.status === 'critical').length,
      components: allComponents
    })

  } catch (error) {
    console.error('Component health check failed:', error)
    return NextResponse.json({
      error: 'Component health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Test specific component endpoints
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { componentName, testType = 'basic', customQuery } = body

    if (!componentName) {
      return NextResponse.json({
        error: 'Component name required'
      }, { status: 400 })
    }

    const testResult = await runComponentTest(componentName, testType, customQuery)

    return NextResponse.json({
      componentName,
      testType,
      result: testResult,
      timestamp: new Date().toISOString(),
      testedBy: session.user.email
    })

  } catch (error) {
    console.error('Component test failed:', error)
    return NextResponse.json({
      error: 'Component test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper functions
async function getComponentHealth(
  componentName: string,
  detailed: boolean,
  includeQueries: boolean
) {
  const fullHealth = await SanityHealthChecker.performFullHealthCheck()
  const component = fullHealth.componentStatus.find(c =>
    c.componentName.toLowerCase().includes(componentName.toLowerCase())
  )

  if (!component) {
    throw new Error(`Component '${componentName}' not found`)
  }

  const result: any = {
    ...component,
    healthScore: calculateHealthScore(component)
  }

  if (detailed) {
    // Add detailed performance metrics
    result.detailedMetrics = await getDetailedComponentMetrics(componentName)
  }

  if (includeQueries) {
    // Add recent query performance
    result.queryPerformance = await getComponentQueryPerformance(componentName)
  }

  return result
}

async function getAllComponentsHealth(detailed: boolean) {
  const fullHealth = await SanityHealthChecker.performFullHealthCheck()

  const components = await Promise.all(
    fullHealth.componentStatus.map(async (component) => {
      const componentData: any = {
        ...component,
        healthScore: calculateHealthScore(component)
      }

      if (detailed) {
        try {
          componentData.detailedMetrics = await getDetailedComponentMetrics(component.componentName)
        } catch (error) {
          componentData.detailedMetrics = { error: 'Failed to load detailed metrics' }
        }
      }

      return componentData
    })
  )

  return components.sort((a, b) => {
    // Sort by health score (lowest first to show problems)
    return a.healthScore - b.healthScore
  })
}

function calculateHealthScore(component: any): number {
  let score = 100

  // Deduct points for issues
  component.issues.forEach((issue: any) => {
    switch (issue.status) {
      case 'critical':
        score -= 30
        break
      case 'warning':
        score -= 10
        break
      default:
        score -= 5
    }
  })

  // Deduct points for poor performance
  if (component.performance.averageResponseTime > 3000) {
    score -= 20
  } else if (component.performance.averageResponseTime > 1000) {
    score -= 10
  }

  // Deduct points for high error rate
  if (component.performance.errorRate > 0.1) {
    score -= 25
  } else if (component.performance.errorRate > 0.05) {
    score -= 15
  }

  // Deduct points for low cache hit rate
  if (component.performance.cacheHitRate && component.performance.cacheHitRate < 0.5) {
    score -= 15
  } else if (component.performance.cacheHitRate && component.performance.cacheHitRate < 0.7) {
    score -= 8
  }

  return Math.max(0, score)
}

async function getDetailedComponentMetrics(componentName: string) {
  try {
    // Get component-specific metrics based on component type
    const metrics: any = {
      lastUpdated: new Date().toISOString()
    }

    switch (componentName.toLowerCase()) {
      case 'products api':
      case 'product management':
        metrics.productMetrics = await getProductMetrics()
        break

      case 'user management':
      case 'users api':
        metrics.userMetrics = await getUserMetrics()
        break

      case 'partner system':
      case 'partner api':
        metrics.partnerMetrics = await getPartnerMetrics()
        break

      case 'license management':
      case 'licenses api':
        metrics.licenseMetrics = await getLicenseMetrics()
        break

      case 'analytics system':
      case 'analytics api':
        metrics.analyticsMetrics = await getAnalyticsMetrics()
        break

      default:
        metrics.generalMetrics = await getGeneralMetrics()
    }

    return metrics

  } catch (error) {
    return {
      error: 'Failed to load detailed metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function getComponentQueryPerformance(componentName: string) {
  try {
    // Simulate query performance data
    // In production, this would come from actual query monitoring
    return {
      last24Hours: {
        totalQueries: Math.floor(Math.random() * 10000) + 1000,
        averageResponseTime: Math.floor(Math.random() * 500) + 100,
        errorRate: Math.random() * 0.05,
        slowestQueries: [
          {
            query: 'Product search with filters',
            avgTime: Math.floor(Math.random() * 1000) + 500,
            executions: Math.floor(Math.random() * 100) + 50
          },
          {
            query: 'User license validation',
            avgTime: Math.floor(Math.random() * 800) + 300,
            executions: Math.floor(Math.random() * 200) + 100
          }
        ]
      },
      recommendations: [
        'Consider adding database indexes for frequently queried fields',
        'Implement query result caching for static data',
        'Optimize complex JOIN queries'
      ]
    }

  } catch (error) {
    return {
      error: 'Failed to load query performance data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function runComponentTest(
  componentName: string,
  testType: string,
  customQuery?: string
) {
  const startTime = Date.now()

  try {
    const testResult: any = {
      testType,
      startTime: new Date().toISOString(),
      success: false
    }

    switch (testType) {
      case 'connectivity':
        await client.fetch('*[_type == "product"][0]{_id}')
        testResult.success = true
        testResult.message = 'Connectivity test passed'
        break

      case 'performance':
        const perfStart = Date.now()
        await client.fetch('*[_type == "product"][0...10]{_id, title, price}')
        const perfTime = Date.now() - perfStart
        testResult.success = perfTime < 2000
        testResult.message = `Performance test: ${perfTime}ms ${testResult.success ? '(Good)' : '(Slow)'}`
        testResult.responseTime = perfTime
        break

      case 'data_integrity':
        const productCount = await client.fetch('count(*[_type == "product"])')
        const categoryCount = await client.fetch('count(*[_type == "category"])')
        testResult.success = productCount > 0 && categoryCount > 0
        testResult.message = `Data integrity: ${productCount} products, ${categoryCount} categories`
        testResult.counts = { products: productCount, categories: categoryCount }
        break

      case 'custom':
        if (!customQuery) {
          throw new Error('Custom query required for custom test')
        }
        const customResult = await client.fetch(customQuery)
        testResult.success = true
        testResult.message = 'Custom query executed successfully'
        testResult.result = Array.isArray(customResult) ? `${customResult.length} results` : 'Query completed'
        break

      default:
        throw new Error(`Unknown test type: ${testType}`)
    }

    testResult.duration = Date.now() - startTime
    testResult.endTime = new Date().toISOString()

    return testResult

  } catch (error) {
    return {
      testType,
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    }
  }
}

// Component-specific metrics functions
async function getProductMetrics() {
  return {
    totalProducts: await client.fetch('count(*[_type == "product"])'),
    publishedProducts: await client.fetch('count(*[_type == "product" && !(_id in path("drafts.**"))])'),
    featuredProducts: await client.fetch('count(*[_type == "product" && featured == true])'),
    productsWithImages: await client.fetch('count(*[_type == "product" && defined(images[0])])'),
    averagePrice: await client.fetch('math::avg(*[_type == "product"].price)')
  }
}

async function getUserMetrics() {
  return {
    totalUsers: await client.fetch('count(*[_type == "user"])'),
    activeUsers: await client.fetch('count(*[_type == "user" && defined(lastLoginAt)])'),
    partnersCount: await client.fetch('count(*[_type == "user" && partner == true])'),
    usersWithLicenses: await client.fetch('count(*[_type == "user" && count(*[_type == "license" && user._ref == ^._id]) > 0])')
  }
}

async function getPartnerMetrics() {
  return {
    totalPartners: await client.fetch('count(*[_type == "user" && partner == true])'),
    activePartners: await client.fetch('count(*[_type == "user" && partner == true && count(*[_type == "product" && author._ref == ^._id]) > 0])'),
    totalUploads: await client.fetch('count(*[_type == "partnerAsset"])'),
    totalFileSize: await client.fetch('sum(*[_type == "partnerAsset"].fileSize)')
  }
}

async function getLicenseMetrics() {
  return {
    totalLicenses: await client.fetch('count(*[_type == "license"])'),
    activeLicenses: await client.fetch('count(*[_type == "license" && status == "active"])'),
    expiredLicenses: await client.fetch('count(*[_type == "license" && status == "expired"])'),
    totalDownloads: await client.fetch('sum(*[_type == "license"].downloadCount)')
  }
}

async function getAnalyticsMetrics() {
  return {
    totalBehaviorEvents: await client.fetch('count(*[_type == "userBehavior"])'),
    totalOrders: await client.fetch('count(*[_type == "order"])'),
    totalRevenue: await client.fetch('sum(*[_type == "order"].total)'),
    recentEvents: await client.fetch('count(*[_type == "userBehavior" && _createdAt > dateTime(now()) - 60*60*24])')
  }
}

async function getGeneralMetrics() {
  return {
    totalDocuments: await client.fetch('count(*[!(_id in path("drafts.**"))])'),
    totalAssets: await client.fetch('count(*[_type in ["sanity.fileAsset", "sanity.imageAsset"]])'),
    lastModified: await client.fetch('*[!(_id in path("drafts.**"))] | order(_updatedAt desc)[0]._updatedAt')
  }
}
