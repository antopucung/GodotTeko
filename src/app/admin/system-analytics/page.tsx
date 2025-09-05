'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Activity,
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Eye,
  MouseIcon,
  Clock,
  ShoppingCart,
  Zap
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

interface AnalyticsSummary {
  totalEvents: number
  totalMetrics: number
  uniqueUsers: number
  uniqueSessions: number
  eventTypes: Record<string, number>
  metricSummaries: Record<string, {
    count: number
    avg: number
    min: number
    max: number
  }>
  topPages: Record<string, number>
  performanceAverages: Record<string, number>
}

interface AnalyticsData {
  summary: AnalyticsSummary
  events: Array<{
    eventType: string
    eventName: string
    properties: Record<string, any>
    timestamp: number
    sessionId: string
    userId?: string
    url: string
  }>
  metrics: Array<{
    name: string
    value: number
    timestamp: number
    url: string
    userAgent: string
  }>
  totalSessions: number
  timeframe: string
}

export default function SystemAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('24h')
  const [eventType, setEventType] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({ timeframe })
      if (eventType) params.append('eventType', eventType)

      const response = await fetch(`/api/analytics/events?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        toast.error('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics data')
    }
  }

  const refreshData = async () => {
    setLoading(true)
    await fetchAnalytics()
    setLoading(false)
  }

  useEffect(() => {
    refreshData()
  }, [timeframe, eventType])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, timeframe, eventType])

  const formatMetricValue = (name: string, value: number) => {
    if (['lcp', 'fcp', 'fid', 'ttfb'].includes(name)) {
      return `${value.toFixed(0)}ms`
    }
    if (name === 'cls') {
      return value.toFixed(3)
    }
    return value.toFixed(2)
  }

  const getPerformanceStatus = (name: string, value: number) => {
    const thresholds: Record<string, { good: number; fair: number }> = {
      lcp: { good: 2500, fair: 4000 },
      fcp: { good: 1800, fair: 3000 },
      fid: { good: 100, fair: 300 },
      cls: { good: 0.1, fair: 0.25 },
      ttfb: { good: 800, fair: 1800 }
    }

    const threshold = thresholds[name]
    if (!threshold) return 'unknown'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.fair) return 'fair'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Transform data for charts
  const eventTypeData = analyticsData ? Object.entries(analyticsData.summary.eventTypes).map(([type, count]) => ({
    name: type,
    value: count
  })) : []

  const topPagesData = analyticsData ? Object.entries(analyticsData.summary.topPages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([page, count]) => ({
      page: page.length > 20 ? `...${page.slice(-20)}` : page,
      views: count
    })) : []

  if (loading && !analyticsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading analytics data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Real-time Analytics</h1>
          <p className="text-gray-600">User behavior and performance monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm">Auto-refresh</label>
          </div>
          <Button onClick={refreshData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All event types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Events</SelectItem>
            <SelectItem value="engagement">Engagement</SelectItem>
            <SelectItem value="interaction">Interaction</SelectItem>
            <SelectItem value="conversion">Conversion</SelectItem>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold">{analyticsData.summary.totalEvents.toLocaleString()}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold">{analyticsData.summary.uniqueUsers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold">{analyticsData.summary.uniqueSessions.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Performance Metrics</p>
                  <p className="text-2xl font-bold">{analyticsData.summary.totalMetrics.toLocaleString()}</p>
                </div>
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Core Web Vitals */}
      {analyticsData && Object.keys(analyticsData.summary.performanceAverages).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Core Web Vitals</CardTitle>
            <CardDescription>Performance metrics overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(analyticsData.summary.performanceAverages).map(([metric, value]) => {
                const status = getPerformanceStatus(metric, value)
                return (
                  <div key={metric} className="text-center p-4 border rounded-lg">
                    <h3 className="font-medium uppercase text-sm text-gray-600 mb-2">{metric}</h3>
                    <p className="text-2xl font-bold mb-2">{formatMetricValue(metric, value)}</p>
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Event Types</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Distribution</CardTitle>
                <CardDescription>Breakdown of event types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Types Summary</CardTitle>
                <CardDescription>Event counts by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventTypeData.map(({ name, value }) => (
                    <div key={name} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium capitalize">{name}</span>
                      <Badge variant="outline">{value.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages by event count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPagesData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="page" width={100} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest user interactions and events</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData && analyticsData.events.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analyticsData.events.slice(0, 20).map((event, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.eventType}
                          </Badge>
                          <span className="font-medium text-sm">{event.eventName}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>Session: {event.sessionId.slice(-8)}</p>
                        {event.userId && <p>User: {event.userId.slice(-8)}</p>}
                        <p>URL: {event.url}</p>
                        {event.properties && Object.keys(event.properties).length > 0 && (
                          <p>Data: {JSON.stringify(event.properties).slice(0, 100)}...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Recent Events</h3>
                  <p className="text-gray-600">Events will appear here as users interact with the site</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Events</CardTitle>
              <CardDescription>JavaScript errors and issues</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData && analyticsData.events.filter(e => e.eventType === 'error').length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.events
                    .filter(event => event.eventType === 'error')
                    .slice(0, 10)
                    .map((event, index) => (
                      <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-red-800">{event.eventName}</span>
                          <span className="text-xs text-red-600">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-red-700">
                          {event.properties.message && (
                            <p className="mb-1">Message: {event.properties.message}</p>
                          )}
                          {event.properties.filename && (
                            <p className="mb-1">File: {event.properties.filename}:{event.properties.lineno}</p>
                          )}
                          <p>URL: {event.url}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Errors Found</h3>
                  <p className="text-gray-600">Great! No JavaScript errors have been reported recently</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
