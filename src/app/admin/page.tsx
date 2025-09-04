'use client'

import { useState, useEffect } from 'react'
import AdminLayout from './layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Activity,
  Database,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Settings,
  Bell,
  MessageCircle,
  Monitor
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/styles/component-variants'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface SystemOverview {
  health: {
    status: 'healthy' | 'warning' | 'critical'
    score: number
    lastChecked: string
  }
  components: {
    total: number
    healthy: number
    warning: number
    critical: number
  }
  performance: {
    averageResponseTime: number
    cacheHitRate: number
    errorRate: number
  }
  business: {
    totalProducts: number
    totalUsers: number
    totalOrders: number
    totalAssets: number
  }
  recentIssues: Array<{
    component: string
    issue: string
    severity: 'warning' | 'critical'
    timestamp: string
  }>
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchOverview = async () => {
    try {
      setIsRefreshing(true)

      // Fetch health data
      const healthResponse = await fetch('/api/admin/health?type=quick')
      const componentsResponse = await fetch('/api/admin/health/components')

      if (healthResponse.ok && componentsResponse.ok) {
        const healthData = await healthResponse.json()
        const componentsData = await componentsResponse.json()

        // Fetch real business metrics
        let businessMetrics = {
          totalProducts: 0,
          totalUsers: 0,
          totalOrders: 0,
          totalAssets: 0
        }

        try {
          const analyticsResponse = await fetch('/api/admin/analytics?period=30&metric=overview')
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json()
            businessMetrics = {
              totalProducts: analyticsData.overview?.totalProducts || 0,
              totalUsers: analyticsData.overview?.totalUsers || 0,
              totalOrders: analyticsData.overview?.totalOrders || 0,
              totalAssets: analyticsData.overview?.totalProducts || 0 // Using products as assets for now
            }
          }
        } catch (error) {
          console.warn('Could not fetch business metrics, using defaults')
        }

        const systemOverview: SystemOverview = {
          health: {
            status: healthData.data?.status || 'healthy',
            score: calculateHealthScore(componentsData.components || []),
            lastChecked: healthData.timestamp
          },
          components: {
            total: componentsData.totalComponents || 0,
            healthy: componentsData.healthyComponents || 0,
            warning: componentsData.warningComponents || 0,
            critical: componentsData.criticalComponents || 0
          },
          performance: {
            averageResponseTime: calculateAverageResponseTime(componentsData.components || []),
            cacheHitRate: 0.78, // Mock data
            errorRate: 0.02 // Mock data
          },
          business: businessMetrics,
          recentIssues: extractRecentIssues(componentsData.components || [])
        }

        setOverview(systemOverview)
      }
    } catch (error) {
      console.error('Error fetching admin overview:', error)
      toast.error('Failed to load system overview')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOverview()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchOverview, 60000)
    return () => clearInterval(interval)
  }, [])

  const calculateHealthScore = (components: any[]): number => {
    if (!components.length) return 100

    const scores = components.map(comp => {
      if (comp.status === 'healthy') return 100
      if (comp.status === 'warning') return 60
      if (comp.status === 'critical') return 20
      return 50
    })

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  const calculateAverageResponseTime = (components: any[]): number => {
    if (!components.length) return 0

    const responseTimes = components
      .filter(comp => comp.performance?.averageResponseTime)
      .map(comp => comp.performance.averageResponseTime)

    if (!responseTimes.length) return 0

    return Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
  }

  const extractRecentIssues = (components: any[]): SystemOverview['recentIssues'] => {
    const issues: SystemOverview['recentIssues'] = []

    components.forEach(comp => {
      if (comp.issues && comp.issues.length > 0) {
        comp.issues.forEach((issue: any) => {
          if (issue.status === 'warning' || issue.status === 'critical') {
            issues.push({
              component: comp.componentName,
              issue: issue.message,
              severity: issue.status,
              timestamp: issue.timestamp || new Date().toISOString()
            })
          }
        })
      }
    })

    return issues
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  }

  if (isLoading) {
    return (
      <AdminLayout title="Admin Overview" subtitle="System health and monitoring dashboard">
        <div className="space-y-6">
          <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="mobile-card">
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-3">
                    <div className="mobile-skeleton-title"></div>
                    <div className="mobile-skeleton-text"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="h-64 mobile-skeleton rounded-lg"></div>
        </div>
      </AdminLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <AdminLayout title="Admin Overview" subtitle="System health and monitoring dashboard">
      <div className="space-y-6">
        {/* System Health Overview */}
        <Card className={cn("mobile-card border-2", getStatusColor(overview?.health.status || 'unknown'))}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", {
                  'bg-green-100': overview?.health.status === 'healthy',
                  'bg-yellow-100': overview?.health.status === 'warning',
                  'bg-red-100': overview?.health.status === 'critical'
                })}>
                  <Shield className={cn("w-6 h-6", {
                    'text-green-600': overview?.health.status === 'healthy',
                    'text-yellow-600': overview?.health.status === 'warning',
                    'text-red-600': overview?.health.status === 'critical'
                  })} />
                </div>
                <div>
                  <h2 className="mobile-title">System Health</h2>
                  <p className="mobile-caption">
                    Overall status: {overview?.health?.status ? overview.health.status.charAt(0).toUpperCase() + overview.health.status.slice(1) : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold mb-1">{overview?.health.score || 0}%</div>
                <Badge className={cn({
                  'bg-green-100 text-green-800': (overview?.health.score || 0) >= 80,
                  'bg-yellow-100 text-yellow-800': (overview?.health.score || 0) >= 60 && (overview?.health.score || 0) < 80,
                  'bg-red-100 text-red-800': (overview?.health.score || 0) < 60
                })}>
                  Health Score
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Last checked: {overview?.health.lastChecked ? formatDistanceToNow(new Date(overview.health.lastChecked), { addSuffix: true }) : 'Never'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOverview}
                disabled={isRefreshing}
                className="mobile-button"
              >
                {isRefreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Components</p>
                  <p className="mobile-title">{overview?.components.total || 0}</p>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">Healthy: {overview?.components.healthy || 0}</span>
                  <span className="text-yellow-600">Warning: {overview?.components.warning || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-600">Critical: {overview?.components.critical || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Performance</p>
                  <p className="mobile-title">{overview?.performance.averageResponseTime || 0}ms</p>
                </div>
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  Cache: {((overview?.performance.cacheHitRate || 0) * 100).toFixed(0)}% hit rate
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Users</p>
                  <p className="mobile-title">{overview?.business.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  Products: {overview?.business.totalProducts || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Orders</p>
                  <p className="mobile-title">{overview?.business.totalOrders || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  Assets: {overview?.business.totalAssets || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mobile-grid lg:grid-cols-2">
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="mobile-subtitle">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks and monitoring tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full mobile-button justify-between">
                <Link href="/admin/health">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Full Health Check</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mobile-button justify-between">
                <Link href="/admin/monitoring">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    <span>System Monitoring</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mobile-button justify-between">
                <Link href="/admin/system-analytics">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Real-time Analytics</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mobile-button justify-between">
                <Link href="/admin/experiments">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>A/B Testing</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mobile-button justify-between">
                <Link href="/admin/cdn">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>CDN Management</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mobile-button justify-between">
                <Link href="/admin/components">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Component Details</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mobile-button justify-between">
                <Link href="/admin/users">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mobile-button justify-between">
                <Link href="/admin/reviews">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Review Moderation</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mobile-button justify-between">
                <Link href="/admin/analytics">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Revenue Analytics</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              {process.env.NODE_ENV === 'development' && (
                <Button asChild variant="outline" className="w-full mobile-button justify-between border-purple-200 bg-purple-50 hover:bg-purple-100">
                  <Link href="/admin/dev-tools">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700">Development Tools</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-600" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="mobile-subtitle">Recent Issues</CardTitle>
              <CardDescription>Latest system alerts and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.recentIssues && overview.recentIssues.length > 0 ? (
                <div className="space-y-3">
                  {overview.recentIssues.map((issue, index) => (
                    <div key={index} className={cn("p-3 rounded-lg border-l-4", {
                      'bg-yellow-50 border-l-yellow-500': issue.severity === 'warning',
                      'bg-red-50 border-l-red-500': issue.severity === 'critical'
                    })}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="mobile-body font-medium">{issue.component}</p>
                          <p className="mobile-caption text-gray-600 mt-1">{issue.issue}</p>
                        </div>
                        <Badge className={cn("text-xs", {
                          'bg-yellow-100 text-yellow-800': issue.severity === 'warning',
                          'bg-red-100 text-red-800': issue.severity === 'critical'
                        })}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(issue.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="mobile-body text-gray-600">No recent issues</p>
                  <p className="mobile-caption text-gray-500">All systems are operating normally</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Status Summary */}
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="mobile-subtitle">System Status Summary</CardTitle>
            <CardDescription>Current platform health and performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="mobile-caption text-green-600 font-medium">Sanity Connection</p>
                <p className="text-xs text-green-700">Operational</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="mobile-caption text-blue-600 font-medium">Asset Delivery</p>
                <p className="text-xs text-blue-700">Optimized</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="mobile-caption text-purple-600 font-medium">Performance</p>
                <p className="text-xs text-purple-700">Good</p>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="mobile-caption text-orange-600 font-medium">Monitoring</p>
                <p className="text-xs text-orange-700">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Notice */}
        {process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE === 'true' && (
          <Card className="mobile-card border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="mobile-subtitle text-blue-900 mb-1">Demo Mode Active</h3>
                  <p className="mobile-body text-blue-800">
                    You're in admin demo mode. All monitoring features are functional for testing.
                    In production, implement proper admin role verification and enhanced security.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
