import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cdnManager } from '@/lib/cdn-integration'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'

    // Get CDN analytics
    const analytics = await cdnManager.getAnalytics(timeframe as any)
    const currentMetrics = cdnManager.getCurrentMetrics()
    const metricsHistory = cdnManager.getMetricsHistory()

    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedMetrics(analytics)

    // Get edge locations
    const edgeLocations = await cdnManager.getOptimalEdgeLocations()

    return NextResponse.json({
      current: currentMetrics,
      history: metricsHistory,
      analytics,
      aggregated: aggregatedMetrics,
      edgeLocations,
      timeframe,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching CDN metrics:', error)

    return NextResponse.json(
      { error: 'Failed to fetch CDN metrics' },
      { status: 500 }
    )
  }
}

// Calculate aggregated metrics from raw data
function calculateAggregatedMetrics(analytics: any[]) {
  if (!analytics.length) {
    return {
      totalRequests: 0,
      totalBandwidth: 0,
      averageHitRate: 0,
      averageEdgeResponseTime: 0,
      averageOriginResponseTime: 0,
      dataPoints: 0
    }
  }

  const totals = analytics.reduce((acc, metric) => {
    acc.requests += metric.requests || 0
    acc.bandwidth += metric.bandwidth || 0
    acc.hitRate += metric.hitRate || 0
    acc.edgeResponseTime += metric.edgeResponseTime || 0
    acc.originResponseTime += metric.originResponseTime || 0
    acc.count += 1
    return acc
  }, {
    requests: 0,
    bandwidth: 0,
    hitRate: 0,
    edgeResponseTime: 0,
    originResponseTime: 0,
    count: 0
  })

  return {
    totalRequests: totals.requests,
    totalBandwidth: totals.bandwidth,
    averageHitRate: totals.count > 0 ? (totals.hitRate / totals.count) : 0,
    averageEdgeResponseTime: totals.count > 0 ? (totals.edgeResponseTime / totals.count) : 0,
    averageOriginResponseTime: totals.count > 0 ? (totals.originResponseTime / totals.count) : 0,
    dataPoints: totals.count,

    // Performance ratings
    hitRateRating: getPerformanceRating(totals.hitRate / totals.count, 'hitRate'),
    responseTimeRating: getPerformanceRating(totals.edgeResponseTime / totals.count, 'responseTime'),

    // Bandwidth utilization
    bandwidthUtilization: formatBandwidth(totals.bandwidth),

    // Cache efficiency
    cacheEfficiency: calculateCacheEfficiency(analytics),

    // Performance trends
    trends: calculatePerformanceTrends(analytics)
  }
}

// Get performance rating
function getPerformanceRating(value: number, metricType: string): string {
  if (metricType === 'hitRate') {
    if (value >= 0.95) return 'excellent'
    if (value >= 0.85) return 'good'
    if (value >= 0.70) return 'fair'
    return 'poor'
  }

  if (metricType === 'responseTime') {
    if (value <= 50) return 'excellent'
    if (value <= 100) return 'good'
    if (value <= 200) return 'fair'
    return 'poor'
  }

  return 'unknown'
}

// Format bandwidth
function formatBandwidth(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// Calculate cache efficiency
function calculateCacheEfficiency(analytics: any[]) {
  if (!analytics.length) return 0

  const totalRequests = analytics.reduce((sum, metric) => sum + (metric.requests || 0), 0)
  const totalOriginRequests = analytics.reduce((sum, metric) => sum + (metric.originRequests || 0), 0)

  if (totalRequests === 0) return 0

  const cachedRequests = totalRequests - totalOriginRequests
  return (cachedRequests / totalRequests) * 100
}

// Calculate performance trends
function calculatePerformanceTrends(analytics: any[]) {
  if (analytics.length < 2) {
    return {
      hitRateTrend: 'stable',
      responseTimeTrend: 'stable',
      bandwidthTrend: 'stable'
    }
  }

  // Sort by timestamp
  const sortedAnalytics = analytics.sort((a, b) => a.timestamp - b.timestamp)
  const firstHalf = sortedAnalytics.slice(0, Math.floor(sortedAnalytics.length / 2))
  const secondHalf = sortedAnalytics.slice(Math.floor(sortedAnalytics.length / 2))

  // Calculate averages for each half
  const firstHalfAvg = {
    hitRate: firstHalf.reduce((sum, m) => sum + (m.hitRate || 0), 0) / firstHalf.length,
    responseTime: firstHalf.reduce((sum, m) => sum + (m.edgeResponseTime || 0), 0) / firstHalf.length,
    bandwidth: firstHalf.reduce((sum, m) => sum + (m.bandwidth || 0), 0) / firstHalf.length
  }

  const secondHalfAvg = {
    hitRate: secondHalf.reduce((sum, m) => sum + (m.hitRate || 0), 0) / secondHalf.length,
    responseTime: secondHalf.reduce((sum, m) => sum + (m.edgeResponseTime || 0), 0) / secondHalf.length,
    bandwidth: secondHalf.reduce((sum, m) => sum + (m.bandwidth || 0), 0) / secondHalf.length
  }

  // Determine trends
  const getTrend = (first: number, second: number, type: 'higher_better' | 'lower_better') => {
    const change = ((second - first) / first) * 100
    const threshold = 5 // 5% change threshold

    if (Math.abs(change) < threshold) return 'stable'

    if (type === 'higher_better') {
      return change > 0 ? 'improving' : 'declining'
    } else {
      return change < 0 ? 'improving' : 'declining'
    }
  }

  return {
    hitRateTrend: getTrend(firstHalfAvg.hitRate, secondHalfAvg.hitRate, 'higher_better'),
    responseTimeTrend: getTrend(firstHalfAvg.responseTime, secondHalfAvg.responseTime, 'lower_better'),
    bandwidthTrend: getTrend(firstHalfAvg.bandwidth, secondHalfAvg.bandwidth, 'higher_better'),

    // Percentage changes
    hitRateChange: ((secondHalfAvg.hitRate - firstHalfAvg.hitRate) / firstHalfAvg.hitRate) * 100,
    responseTimeChange: ((secondHalfAvg.responseTime - firstHalfAvg.responseTime) / firstHalfAvg.responseTime) * 100,
    bandwidthChange: ((secondHalfAvg.bandwidth - firstHalfAvg.bandwidth) / firstHalfAvg.bandwidth) * 100
  }
}
