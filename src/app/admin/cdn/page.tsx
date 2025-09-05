'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Zap,
  Globe,
  TrendingUp,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface CDNMetrics {
  current: {
    requests: number
    bandwidth: number
    hitRate: number
    originRequests: number
    edgeResponseTime: number
    originResponseTime: number
    timestamp: number
  } | null
  aggregated: {
    totalRequests: number
    totalBandwidth: string
    averageHitRate: number
    averageEdgeResponseTime: number
    hitRateRating: string
    responseTimeRating: string
    cacheEfficiency: number
    trends: {
      hitRateTrend: string
      responseTimeTrend: string
      bandwidthTrend: string
    }
  }
  edgeLocations: Array<{
    code: string
    city: string
    country: string
    region: string
  }>
}

interface PurgeHistory {
  id: string
  type: string
  urls?: string[]
  tags?: string[]
  initiatedBy: string
  reason: string
  timestamp: string
  status: string
}

export default function CDNManagement() {
  const [metrics, setMetrics] = useState<CDNMetrics | null>(null)
  const [purgeHistory, setPurgeHistory] = useState<PurgeHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [purging, setPurging] = useState(false)

  // Purge form state
  const [purgeUrls, setPurgeUrls] = useState('')
  const [purgeTags, setPurgeTags] = useState('')
  const [purgeReason, setPurgeReason] = useState('')
  const [purgeEverything, setPurgeEverything] = useState(false)

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/cdn/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch CDN metrics:', error)
    }
  }

  const fetchPurgeHistory = async () => {
    try {
      const response = await fetch('/api/cdn/purge')
      if (response.ok) {
        const data = await response.json()
        setPurgeHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to fetch purge history:', error)
    }
  }

  const handlePurgeCache = async () => {
    if (!purgeEverything && !purgeUrls.trim() && !purgeTags.trim()) {
      toast.error('Please specify URLs, tags, or select purge everything')
      return
    }

    setPurging(true)

    try {
      const purgeRequest: any = {
        reason: purgeReason || 'Manual purge via admin panel'
      }

      if (purgeEverything) {
        purgeRequest.purgeEverything = true
      } else {
        if (purgeUrls.trim()) {
          purgeRequest.urls = purgeUrls.split('\n').map(url => url.trim()).filter(Boolean)
        }
        if (purgeTags.trim()) {
          purgeRequest.tags = purgeTags.split('\n').map(tag => tag.trim()).filter(Boolean)
        }
      }

      const response = await fetch('/api/cdn/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purgeRequest)
      })

      if (response.ok) {
        toast.success('CDN cache purged successfully')
        // Clear form
        setPurgeUrls('')
        setPurgeTags('')
        setPurgeReason('')
        setPurgeEverything(false)
        // Refresh data
        await fetchPurgeHistory()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to purge cache')
      }
    } catch (error) {
      toast.error('Failed to purge cache')
    } finally {
      setPurging(false)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([fetchMetrics(), fetchPurgeHistory()])
    setLoading(false)
    toast.success('CDN data refreshed')
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchMetrics(), fetchPurgeHistory()])
      setLoading(false)
    }
    loadData()

    // Auto-refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'fair': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading CDN data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CDN Management</h1>
          <p className="text-gray-600">Monitor and manage global edge caching</p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hit Rate</p>
                  <p className="text-2xl font-bold">
                    {(metrics.aggregated.averageHitRate * 100).toFixed(1)}%
                  </p>
                  <Badge className={`text-xs ${getRatingColor(metrics.aggregated.hitRateRating)}`}>
                    {metrics.aggregated.hitRateRating}
                  </Badge>
                </div>
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Edge Response</p>
                  <p className="text-2xl font-bold">
                    {metrics.aggregated.averageEdgeResponseTime.toFixed(0)}ms
                  </p>
                  <Badge className={`text-xs ${getRatingColor(metrics.aggregated.responseTimeRating)}`}>
                    {metrics.aggregated.responseTimeRating}
                  </Badge>
                </div>
                <Zap className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bandwidth</p>
                  <p className="text-2xl font-bold">{metrics.aggregated.totalBandwidth}</p>
                  <p className="text-xs text-gray-500">Cache efficiency: {metrics.aggregated.cacheEfficiency.toFixed(1)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Edge Locations</p>
                  <p className="text-2xl font-bold">{metrics.edgeLocations.length}</p>
                  <p className="text-xs text-gray-500">Global coverage</p>
                </div>
                <Globe className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Trends */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>CDN performance trends and optimizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Hit Rate Trend</p>
                  <p className="text-sm text-gray-600 capitalize">{metrics.aggregated.trends.hitRateTrend}</p>
                </div>
                {getTrendIcon(metrics.aggregated.trends.hitRateTrend)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Response Time</p>
                  <p className="text-sm text-gray-600 capitalize">{metrics.aggregated.trends.responseTimeTrend}</p>
                </div>
                {getTrendIcon(metrics.aggregated.trends.responseTimeTrend)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Bandwidth</p>
                  <p className="text-sm text-gray-600 capitalize">{metrics.aggregated.trends.bandwidthTrend}</p>
                </div>
                {getTrendIcon(metrics.aggregated.trends.bandwidthTrend)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="purge" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purge">Cache Purge</TabsTrigger>
          <TabsTrigger value="history">Purge History</TabsTrigger>
          <TabsTrigger value="locations">Edge Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="purge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purge CDN Cache</CardTitle>
              <CardDescription>
                Clear cached content from the CDN edge servers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="purgeEverything"
                    checked={purgeEverything}
                    onChange={(e) => setPurgeEverything(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="purgeEverything" className="text-sm font-medium">
                    Purge Everything (Use with caution)
                  </label>
                </div>

                {!purgeEverything && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">URLs to Purge</label>
                      <Textarea
                        placeholder="Enter URLs to purge (one per line)&#10;/products&#10;/api/products&#10;/static/css/main.css"
                        value={purgeUrls}
                        onChange={(e) => setPurgeUrls(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Cache Tags to Purge</label>
                      <Textarea
                        placeholder="Enter cache tags (one per line)&#10;product-images&#10;user-content&#10;static-assets"
                        value={purgeTags}
                        onChange={(e) => setPurgeTags(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Reason for Purge</label>
                  <Input
                    placeholder="Brief reason for cache purge (e.g., Product updates, Bug fix)"
                    value={purgeReason}
                    onChange={(e) => setPurgeReason(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handlePurgeCache}
                  disabled={purging}
                  className="w-full"
                  variant={purgeEverything ? "destructive" : "default"}
                >
                  {purging ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Purging Cache...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {purgeEverything ? 'Purge All Cache' : 'Purge Selected Cache'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purge History</CardTitle>
              <CardDescription>Recent cache purge operations</CardDescription>
            </CardHeader>
            <CardContent>
              {purgeHistory.length > 0 ? (
                <div className="space-y-3">
                  {purgeHistory.map((purge) => (
                    <div key={purge.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {purge.type}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            by {purge.initiatedBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">{purge.status}</span>
                        </div>
                      </div>

                      <p className="text-sm mb-2">{purge.reason}</p>

                      {purge.urls && (
                        <div className="text-xs text-gray-600">
                          URLs: {purge.urls.join(', ')}
                        </div>
                      )}
                      {purge.tags && (
                        <div className="text-xs text-gray-600">
                          Tags: {purge.tags.join(', ')}
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(purge.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Purge History</h3>
                  <p className="text-gray-600">Cache purge operations will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edge Locations</CardTitle>
              <CardDescription>Global CDN edge server locations</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && metrics.edgeLocations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.edgeLocations.map((location) => (
                    <div key={location.code} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{location.city}</h3>
                        <Badge variant="outline">{location.code}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{location.country}</p>
                      <p className="text-xs text-gray-500">{location.region}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Edge Locations</h3>
                  <p className="text-gray-600">Edge locations will appear here when CDN is configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
