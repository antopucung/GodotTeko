'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  Download,
  Eye,
  Settings,
  Zap,
  TrendingUp,
  BarChart3,
  Smartphone
} from 'lucide-react'
import { cn } from '@/styles/component-variants'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface HealthData {
  timestamp: string
  summary: {
    status: 'healthy' | 'warning' | 'critical'
    message: string
    issueCount: number
    criticalIssues: number
    warningIssues: number
  }
  data: {
    connectionHealth: any
    queryPerformance: any[]
    schemaValidation: any[]
    assetDelivery: any
    cacheHealth: any
    dataConsistency: any[]
    componentStatus: any[]
    extensible: any
  }
}

export default function AdminHealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastChecked, setLastChecked] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)

  const fetchHealthData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true)
      }

      const response = await fetch(`/api/admin/health?type=full${forceRefresh ? '&force=true' : ''}`)
      if (!response.ok) {
        throw new Error('Failed to fetch health data')
      }

      const data = await response.json()
      setHealthData(data)
      setLastChecked(data.timestamp)

      if (forceRefresh) {
        toast.success('Health data refreshed successfully')
      }
    } catch (error) {
      console.error('Error fetching health data:', error)
      toast.error('Failed to fetch health data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchHealthData()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchHealthData()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const handleManualRefresh = () => {
    fetchHealthData(true)
  }

  const handleExportHealthData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/health?type=full&format=${format}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sanity-health-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Health data exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
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

  const calculateOverallHealthScore = () => {
    if (!healthData?.data) return 0

    const components = healthData.data.componentStatus
    if (!components.length) return 100

    const scores = components.map((comp: any) => {
      if (comp.status === 'healthy') return 100
      if (comp.status === 'warning') return 60
      if (comp.status === 'critical') return 20
      return 50
    })

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  if (isLoading) {
    return (
      <AdminLayout title="Health Monitor" subtitle="Real-time system health monitoring">
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
          <div className="h-96 mobile-skeleton rounded-lg"></div>
        </div>
      </AdminLayout>
    )
  }

  const overallHealthScore = calculateOverallHealthScore()

  return (
    <AdminLayout title="Health Monitor" subtitle="Real-time Sanity CMS health monitoring">
      <div className="space-y-6">
        {/* Overall Health Status */}
        <div className="mobile-card bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8" />
                <h2 className="mobile-title text-white">
                  System Health: {healthData?.summary?.status ? healthData.summary.status.charAt(0).toUpperCase() + healthData.summary.status.slice(1) : 'Unknown'}
                </h2>
              </div>
              <p className="mobile-body text-blue-100 mb-4">
                {healthData?.summary.message || 'System status unknown'}
              </p>
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="mobile-button"
                >
                  {isRefreshing ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  <span className="mobile-only">Refresh</span>
                  <span className="desktop-only">Refresh Now</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="mobile-button text-white border-white hover:bg-white hover:text-blue-600"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
                </Button>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-center">
              <div className="w-24 h-24 relative">
                <div className="w-full h-full rounded-full border-4 border-white border-opacity-30"></div>
                <div
                  className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"
                  style={{
                    animation: 'none',
                    borderTopColor: 'transparent',
                    borderRightColor: overallHealthScore > 70 ? '#10b981' : overallHealthScore > 40 ? '#f59e0b' : '#ef4444',
                    borderBottomColor: overallHealthScore > 70 ? '#10b981' : overallHealthScore > 40 ? '#f59e0b' : '#ef4444',
                    borderLeftColor: overallHealthScore > 70 ? '#10b981' : overallHealthScore > 40 ? '#f59e0b' : '#ef4444',
                    transform: `rotate(${(overallHealthScore / 100) * 360}deg)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{overallHealthScore}%</span>
                </div>
              </div>
              <p className="text-blue-100 text-sm mt-2">Health Score</p>
            </div>

            <div className="md:hidden">
              <Smartphone className="w-12 h-12 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
          <Card className={cn("mobile-card border-2", getStatusColor(healthData?.data.connectionHealth.status || 'unknown'))}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Connection</p>
                  <p className="mobile-body font-semibold">{healthData?.data.connectionHealth.status}</p>
                  {healthData?.data.connectionHealth.responseTime && (
                    <p className="text-xs text-gray-600 mt-1">
                      {healthData.data.connectionHealth.responseTime}ms
                    </p>
                  )}
                </div>
                {getStatusIcon(healthData?.data.connectionHealth.status)}
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Components</p>
                  <p className="mobile-title">{healthData?.data.componentStatus.length || 0}</p>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-green-600 font-medium">
                  {healthData?.data.componentStatus.filter((c: any) => c.status === 'healthy').length || 0} healthy
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Performance</p>
                  <p className="mobile-title">{healthData?.data.cacheHealth.details?.hitRate ? `${(healthData.data.cacheHealth.details.hitRate * 100).toFixed(0)}%` : 'N/A'}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  Cache hit rate
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Issues</p>
                  <p className="mobile-title">{healthData?.summary.issueCount || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-red-600 font-medium">
                  {healthData?.summary.criticalIssues || 0} critical
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Updated Info */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last checked: {lastChecked ? formatDistanceToNow(new Date(lastChecked), { addSuffix: true }) : 'Never'}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportHealthData('json')}
              className="mobile-button"
            >
              <Download className="w-4 h-4 mr-1" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportHealthData('csv')}
              className="mobile-button"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        {/* Detailed Health Monitoring */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger
              value="overview"
              className="mobile-button py-3 data-[state=active]:bg-white text-xs md:text-sm"
            >
              <Activity className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="components"
              className="mobile-button py-3 data-[state=active]:bg-white text-xs md:text-sm"
            >
              <Database className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Components</span>
              <span className="sm:hidden">Comp</span>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="mobile-button py-3 data-[state=active]:bg-white text-xs md:text-sm"
            >
              <Zap className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Performance</span>
              <span className="sm:hidden">Perf</span>
            </TabsTrigger>
            <TabsTrigger
              value="extensible"
              className="mobile-button py-3 data-[state=active]:bg-white text-xs md:text-sm"
            >
              <BarChart3 className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Connection and Core Services */}
            <div className="mobile-grid lg:grid-cols-2">
              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="mobile-subtitle flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Sanity Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={cn("flex items-center gap-3 p-3 rounded-lg", getStatusColor(healthData?.data.connectionHealth.status))}>
                      {getStatusIcon(healthData?.data.connectionHealth.status)}
                      <div>
                        <p className="font-medium">{healthData?.data.connectionHealth.message}</p>
                        {healthData?.data.connectionHealth.responseTime && (
                          <p className="text-sm opacity-75">Response time: {healthData.data.connectionHealth.responseTime}ms</p>
                        )}
                      </div>
                    </div>

                    {healthData?.data.connectionHealth.suggestions && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Suggestions:</p>
                        <ul className="text-sm space-y-1">
                          {healthData.data.connectionHealth.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="mobile-subtitle flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Asset Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={cn("flex items-center gap-3 p-3 rounded-lg", getStatusColor(healthData?.data.assetDelivery.status))}>
                      {getStatusIcon(healthData?.data.assetDelivery.status)}
                      <div>
                        <p className="font-medium">{healthData?.data.assetDelivery.message}</p>
                        {healthData?.data.assetDelivery.responseTime && (
                          <p className="text-sm opacity-75">Asset load time: {healthData.data.assetDelivery.responseTime}ms</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Schema Validation Summary */}
            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="mobile-subtitle">Schema Validation</CardTitle>
                <CardDescription>All platform schemas and data integrity checks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {healthData?.data.schemaValidation.map((schema: any, index: number) => (
                    <div key={index} className={cn("p-3 rounded-lg text-center", getStatusColor(schema.status))}>
                      {getStatusIcon(schema.status)}
                      <p className="font-medium text-sm mt-1">{schema.name.replace('Schema: ', '')}</p>
                      {schema.details?.documentCount && (
                        <p className="text-xs opacity-75">{schema.details.documentCount} docs</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="space-y-6">
            <div className="space-y-4">
              {healthData?.data.componentStatus.map((component: any, index: number) => (
                <Card key={index} className={cn("mobile-card border-l-4", {
                  'border-l-green-500': component.status === 'healthy',
                  'border-l-yellow-500': component.status === 'warning',
                  'border-l-red-500': component.status === 'critical'
                })}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(component.status)}
                          <h3 className="mobile-subtitle">{component.componentName}</h3>
                          <Badge className={cn("text-xs", {
                            'bg-green-100 text-green-800': component.status === 'healthy',
                            'bg-yellow-100 text-yellow-800': component.status === 'warning',
                            'bg-red-100 text-red-800': component.status === 'critical'
                          })}>
                            {component.status}
                          </Badge>
                        </div>
                        <p className="mobile-caption text-gray-600 mb-3">
                          Dependencies: {component.dependencies.join(', ')}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedComponent(selectedComponent === component.componentName ? null : component.componentName)}
                        className="mobile-button"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {selectedComponent === component.componentName ? 'Hide' : 'Details'}
                      </Button>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Avg Response</p>
                        <p className="mobile-body font-semibold">{component.performance.averageResponseTime.toFixed(0)}ms</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Error Rate</p>
                        <p className="mobile-body font-semibold">{(component.performance.errorRate * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Cache Hit</p>
                        <p className="mobile-body font-semibold">
                          {component.performance.cacheHitRate ? `${(component.performance.cacheHitRate * 100).toFixed(0)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedComponent === component.componentName && (
                      <div className="border-t pt-4 space-y-4 mobile-fade-in">
                        <div>
                          <h4 className="mobile-body font-semibold mb-2">Endpoint</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block">{component.endpoint}</code>
                        </div>

                        {component.issues.length > 0 && (
                          <div>
                            <h4 className="mobile-body font-semibold mb-2">Issues</h4>
                            <div className="space-y-2">
                              {component.issues.map((issue: any, issueIndex: number) => (
                                <div key={issueIndex} className={cn("p-3 rounded-lg", getStatusColor(issue.status))}>
                                  <p className="font-medium">{issue.message}</p>
                                  {issue.suggestions && (
                                    <ul className="text-sm mt-2 space-y-1">
                                      {issue.suggestions.map((suggestion: string, suggestionIndex: number) => (
                                        <li key={suggestionIndex} className="flex items-start gap-1">
                                          <span>•</span>
                                          <span>{suggestion}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Query Performance */}
            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="mobile-subtitle">Query Performance</CardTitle>
                <CardDescription>GROQ query response times and optimization insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthData?.data.queryPerformance.map((query: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(query.status)}
                        <div>
                          <p className="mobile-body font-medium">{query.name}</p>
                          <p className="mobile-caption text-gray-600">{query.responseTime}ms response time</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge className={cn({
                          'bg-green-100 text-green-800': query.responseTime < 500,
                          'bg-yellow-100 text-yellow-800': query.responseTime >= 500 && query.responseTime < 1000,
                          'bg-red-100 text-red-800': query.responseTime >= 1000
                        })}>
                          {query.responseTime < 500 ? 'Fast' : query.responseTime < 1000 ? 'Slow' : 'Very Slow'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="mobile-subtitle">Cache Performance</CardTitle>
                <CardDescription>Caching efficiency and optimization metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={cn("p-4 rounded-lg", getStatusColor(healthData?.data.cacheHealth.status))}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Cache Health</span>
                      {getStatusIcon(healthData?.data.cacheHealth.status)}
                    </div>
                    <p className="text-sm">{healthData?.data.cacheHealth.message}</p>
                  </div>

                  {healthData?.data.cacheHealth.details && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Total Entries</p>
                        <p className="mobile-body font-semibold">{healthData.data.cacheHealth.details.total}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Active</p>
                        <p className="mobile-body font-semibold">{healthData.data.cacheHealth.details.active}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Hit Rate</p>
                        <p className="mobile-body font-semibold">{(healthData.data.cacheHealth.details.hitRate * 100).toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Expired</p>
                        <p className="mobile-body font-semibold">{healthData.data.cacheHealth.details.expired}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extensible" className="space-y-6">
            {/* Business Metrics */}
            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="mobile-subtitle">Business Metrics</CardTitle>
                <CardDescription>Platform usage and growth indicators</CardDescription>
              </CardHeader>
              <CardContent>
                {healthData?.data.extensible?.businessMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="mobile-caption text-blue-600">Products</p>
                      <p className="mobile-title text-blue-700">{healthData.data.extensible.businessMetrics.totalProducts}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="mobile-caption text-green-600">Users</p>
                      <p className="mobile-title text-green-700">{healthData.data.extensible.businessMetrics.totalUsers}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="mobile-caption text-purple-600">Orders</p>
                      <p className="mobile-title text-purple-700">{healthData.data.extensible.businessMetrics.totalOrders}</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="mobile-caption text-orange-600">Assets</p>
                      <p className="mobile-title text-orange-700">{healthData.data.extensible.businessMetrics.totalAssets}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Integration Health */}
            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="mobile-subtitle">Integration Status</CardTitle>
                <CardDescription>External service integrations and API health</CardDescription>
              </CardHeader>
              <CardContent>
                {healthData?.data.extensible?.integrationData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Sanity Version</p>
                        <p className="mobile-body font-semibold">{healthData.data.extensible.integrationData.sanityVersion}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="mobile-caption text-gray-600">Dataset Size</p>
                        <p className="mobile-body font-semibold">{healthData.data.extensible.integrationData.datasetSize} docs</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Future Metrics Placeholder */}
            <Card className="mobile-card border-dashed border-2">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="mobile-subtitle text-gray-600 mb-2">Extensible Monitoring</h3>
                  <p className="mobile-body text-gray-500 mb-4">
                    This section is ready for additional monitoring features and custom health checks.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center text-xs">
                    {healthData?.data.extensible?.futureMetrics?.extensionPoints?.map((point: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {point.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <Card className="mobile-card border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mobile-subtitle text-blue-900 mb-1">Health Monitoring Actions</h3>
                <p className="mobile-body text-blue-800">
                  Configure monitoring settings and manage health check automation.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="mobile-button">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Configure Health Monitoring</AlertDialogTitle>
                      <AlertDialogDescription>
                        Adjust monitoring thresholds and notification settings. Changes will take effect immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Save Configuration</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
