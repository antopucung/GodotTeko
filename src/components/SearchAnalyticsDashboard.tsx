'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  TrendingUp,
  Clock,
  Zap,
  BarChart3,
  Download,
  Filter,
  Users,
  RefreshCw,
  Trash2
} from 'lucide-react'
import {
  getSearchAnalytics,
  getPopularSearchTerms,
  getFilterUsageStats,
  getPerformanceMetrics,
  getDailySearchTrends,
  exportAnalyticsData,
  clearAnalytics
} from '@/lib/searchAnalytics'

interface SearchAnalyticsDashboardProps {
  isVisible?: boolean
  onClose?: () => void
}

export default function SearchAnalyticsDashboard({
  isVisible = true,
  onClose
}: SearchAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [popularTerms, setPopularTerms] = useState<any[]>([])
  const [filterStats, setFilterStats] = useState<any[]>([])
  const [dailyTrends, setDailyTrends] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadAnalytics = () => {
    setRefreshing(true)

    setTimeout(() => {
      setMetrics(getPerformanceMetrics())
      setPopularTerms(getPopularSearchTerms(10))
      setFilterStats(getFilterUsageStats(15))
      setDailyTrends(getDailySearchTrends())
      setRefreshing(false)
    }, 100)
  }

  useEffect(() => {
    if (isVisible) {
      loadAnalytics()
    }
  }, [isVisible])

  const handleExportData = () => {
    const data = exportAnalyticsData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `godot-tekko-search-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
      clearAnalytics()
      loadAnalytics()
    }
  }

  if (!isVisible) return null

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Search Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Insights into user search behavior and performance</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Searches</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalSearches.toLocaleString()}</p>
                </div>
                <Search className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.searchesThisWeek}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageSearchDuration}ms</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.cacheHitRate}%</p>
                </div>
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Popular Search Terms
            </CardTitle>
            <CardDescription>Most frequently searched terms</CardDescription>
          </CardHeader>
          <CardContent>
            {popularTerms.length > 0 ? (
              <div className="space-y-3">
                {popularTerms.map((term, index) => (
                  <div key={term.term} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        #{index + 1}
                      </span>
                      <span className="ml-2 text-gray-900">{term.term}</span>
                    </div>
                    <Badge variant="secondary">{term.count} searches</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No search data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter Usage
            </CardTitle>
            <CardDescription>Most used search filters</CardDescription>
          </CardHeader>
          <CardContent>
            {filterStats.length > 0 ? (
              <div className="space-y-3">
                {filterStats.slice(0, 8).map((filter, index) => (
                  <div key={`${filter.filterType}-${filter.filterValue}`} className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        #{index + 1}
                      </span>
                      <div className="ml-2 min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {filter.filterType}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {filter.filterValue}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      {filter.usageCount}x
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No filter usage data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Search Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Daily Search Trends (Last 7 Days)
          </CardTitle>
          <CardDescription>Search volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyTrends.length > 0 ? (
            <div className="space-y-4">
              {/* Simple bar chart */}
              <div className="grid grid-cols-7 gap-2 h-32">
                {dailyTrends.map((day, index) => {
                  const maxSearches = Math.max(...dailyTrends.map(d => d.searches))
                  const height = maxSearches > 0 ? (day.searches / maxSearches) * 100 : 0

                  return (
                    <div key={day.date} className="flex flex-col items-center">
                      <div className="flex-1 flex items-end w-full">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                          style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '2px' }}
                          title={`${day.searches} searches on ${day.date}`}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        <div>{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                        <div className="font-medium">{day.searches}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No trend data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or clear analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Analytics Data
            </Button>

            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="text-sm text-gray-600">
            <p><strong>Privacy Note:</strong> All analytics data is stored locally in your browser and is not transmitted to external servers. Data includes search terms, filter usage, and performance metrics but no personal information.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
