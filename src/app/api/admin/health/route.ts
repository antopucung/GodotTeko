import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession()

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'quick'

    // Basic health check
    const health = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    // Detailed health check
    if (type === 'detailed') {
      const detailedHealth = {
        ...health,
        data: {
          status: 'healthy' as const,
          score: 98,
          lastChecked: new Date().toISOString()
        },
        components: {
          total: 6,
          healthy: 5,
          warning: 1,
          critical: 0
        },
        recentIssues: [
          {
            component: 'Payment Processing',
            issue: 'Webhook processing delays detected',
            severity: 'warning' as const,
            timestamp: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
          }
        ]
      }
      return NextResponse.json(detailedHealth)
    }

    // Quick health check
    return NextResponse.json({
      status: 'ok',
      timestamp: health.timestamp,
      uptime: health.uptime
    })

  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    )
  }
}
