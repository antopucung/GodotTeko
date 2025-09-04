'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  Server,
  Database,
  Globe,
  Zap,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  score: number
  lastChecked: string
  components: {
    total: number
    healthy: number
    warning: number
    critical: number
  }
  recentIssues: Array<{
    component: string
    issue: string
    severity: 'warning' | 'critical'
    timestamp: string
  }>
}

interface ErrorSummary {
  totalErrors: number
  errorRate: number
  topErrors: Array<{
    message: string
    count: number
    lastSeen: string
    severity: string
  }>
  errorTrend: Array<{
    timestamp: string
    count: number
  }>
}

export default function SystemMonitoring() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/health?type=detailed')
      if (response.ok) {
        const data = await response.json()
        setSystemHealth(data)
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    }
  }

  const fetchErrorSummary = async () => {
    // Mock error data - in production this would connect to Sentry API
    const mockErrorSummary: ErrorSummary = {
      totalErrors: 23,
      errorRate: 0.02, // 2%
      topErrors: [
        {
          message: "TypeError: Cannot read property 'length' of undefined",
          count: 8,
          lastSeen: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          severity: 'warning'
        },
        {
          message: "Network request failed: 500 Internal Server Error",
          count: 5,
          lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          severity: 'critical'
        },
        {
          message: "Stripe webhook validation failed",
          count: 4,
          lastSeen: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          severity: 'warning'
        },
        {
          message: "Image upload timeout",
          count: 3,
          lastSeen: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
          severity: 'warning'
        },
        {
          message: "Database connection timeout",
          count: 3,
          lastSeen: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
          severity: 'critical'
        }
      ],
      errorTrend: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        count: Math.floor(Math.random() * 10) + 1
      }))
    }
    setErrorSummary(mockErrorSummary)
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([fetchSystemHealth(), fetchErrorSummary()])
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => {
    refreshData()

    // Auto-refresh every 2 minutes
    const interval = setInterval(refreshData, 120000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !systemHealth) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading system status...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Error tracking and system health overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button onClick={refreshData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {systemHealth && (
        <Card className={`border-2 ${getStatusColor(systemHealth.status)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(systemHealth.status)}
                <div>
                  <h2 className="text-2xl font-bold">System Status: {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}</h2>
                  <p className="text-gray-600">Overall health score: {systemHealth.score}%</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{systemHealth.score}%</div>
                <div className="text-sm text-gray-600">Health Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemHealth && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Healthy Components</p>
                    <p className="text-2xl font-bold text-green-600">{systemHealth.components.healthy}</p>
                  </div>
                  <Server className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Warning Components</p>
                    <p className="text-2xl font-bold text-yellow-600">{systemHealth.components.warning}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Critical Issues</p>
                    <p className="text-2xl font-bold text-red-600">{systemHealth.components.critical}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {errorSummary && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Errors (24h)</p>
                  <p className="text-2xl font-bold">{errorSummary.totalErrors}</p>
                  <p className="text-xs text-gray-500">Error rate: {(errorSummary.errorRate * 100).toFixed(2)}%</p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="uptime">Uptime</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {/* Recent Issues */}
          {systemHealth && systemHealth.recentIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Issues</CardTitle>
                <CardDescription>Latest system alerts and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemHealth.recentIssues.map((issue, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      issue.severity === 'critical' ? 'bg-red-50 border-l-red-500' : 'bg-yellow-50 border-l-yellow-500'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{issue.component}</h4>
                          <p className="text-sm text-gray-600 mt-1">{issue.issue}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(issue.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Component Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Database</h3>
                    <p className="text-sm text-gray-600">Sanity CMS</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Response time: 45ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">CDN</h3>
                    <p className="text-sm text-gray-600">Edge Caching</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Hit rate: 89%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-gray-600">NextAuth</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Success rate: 99.8%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Payment Processing</h3>
                    <p className="text-sm text-gray-600">Stripe</p>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Webhook delays detected
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Service</h3>
                    <p className="text-sm text-gray-600">Resend</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Delivery rate: 98.5%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Analytics</h3>
                    <p className="text-sm text-gray-600">Real-time</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Events processing: OK
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {errorSummary && (
            <>
              {/* Error Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Error Trend (24 Hours)</CardTitle>
                  <CardDescription>Error count over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={errorSummary.errorTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                        />
                        <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Errors */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Errors</CardTitle>
                  <CardDescription>Most frequent errors in the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {errorSummary.topErrors.map((error, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-red-800">{error.message}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Last seen: {new Date(error.lastSeen).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                            <Badge variant="outline">
                              {error.count} occurrences
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Average Response Time</h3>
                    <p className="text-2xl font-bold">145ms</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-3">
                  <Badge className="bg-green-100 text-green-800">Good</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">P95 Response Time</h3>
                    <p className="text-2xl font-bold">389ms</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <div className="mt-3">
                  <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Throughput</h3>
                    <p className="text-2xl font-bold">1.2k req/min</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-3">
                  <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uptime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Uptime</CardTitle>
              <CardDescription>Availability metrics for the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">Overall Uptime</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">99.9%</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">API Uptime</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">99.8%</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">CDN Uptime</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">100%</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">Database Uptime</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">99.95%</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
