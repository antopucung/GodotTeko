import { NextRequest, NextResponse } from 'next/server'


interface AnalyticsEvent {
  eventType: string
  eventName: string
  properties: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
  url: string
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
  userAgent: string
  connectionType?: string
}

interface AnalyticsPayload {
  events: AnalyticsEvent[]
  metrics: PerformanceMetric[]
  sessionId: string
  userId?: string
  timestamp: number
}

// In-memory storage for demo - replace with database in production
const analyticsData: {
  events: AnalyticsEvent[]
  metrics: PerformanceMetric[]
  sessions: Set<string>
} = {
  events: [],
  metrics: [],
  sessions: new Set()
}

export async function POST(request: NextRequest) {
  try {
    const payload: AnalyticsPayload = await request.json()

    // Validate payload
    if (!payload.sessionId || !Array.isArray(payload.events) || !Array.isArray(payload.metrics)) {
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      )
    }

    // Process events
    for (const event of payload.events) {
      // Validate event structure
      if (!event.eventType || !event.eventName || !event.timestamp) {
        continue // Skip invalid events
      }

      // Store event (in production, save to database)
      analyticsData.events.push({
        ...event,
        receivedAt: Date.now()
      })

      // Process specific event types
      await processAnalyticsEvent(event)
    }

    // Process performance metrics
    for (const metric of payload.metrics) {
      // Validate metric structure
      if (!metric.name || typeof metric.value !== 'number' || !metric.timestamp) {
        continue // Skip invalid metrics
      }

      // Store metric (in production, save to database)
      analyticsData.metrics.push({
        ...metric,
        receivedAt: Date.now()
      })

      // Process specific metrics
      await processPerformanceMetric(metric)
    }

    // Track session
    analyticsData.sessions.add(payload.sessionId)

    // Log analytics reception for monitoring
    if (payload.events.length > 0 || payload.metrics.length > 0) {
      reportServerMessage(
        `Analytics received: ${payload.events.length} events, ${payload.metrics.length} metrics`,
        'info',
        {
          sessionId: payload.sessionId,
          userId: payload.userId,
          eventsCount: payload.events.length,
          metricsCount: payload.metrics.length,
          userAgent: request.headers.get('user-agent')
        }
      )
    }

    return NextResponse.json({
      success: true,
      processed: {
        events: payload.events.length,
        metrics: payload.metrics.length
      }
    })

  } catch (error) {
    console.error('Analytics processing error:', error)

    reportServerMessage(
      'Analytics processing failed',
      'error',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    )

    return NextResponse.json(
      { error: 'Failed to process analytics data' },
      { status: 500 }
    )
  }
}

// Get analytics data for dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'
    const eventType = searchParams.get('eventType')
    const metricName = searchParams.get('metricName')

    // Calculate time range
    const now = Date.now()
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }

    const timeRange = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h']
    const startTime = now - timeRange

    // Filter events
    let filteredEvents = analyticsData.events.filter(event =>
      event.timestamp >= startTime
    )

    if (eventType) {
      filteredEvents = filteredEvents.filter(event =>
        event.eventType === eventType
      )
    }

    // Filter metrics
    let filteredMetrics = analyticsData.metrics.filter(metric =>
      metric.timestamp >= startTime
    )

    if (metricName) {
      filteredMetrics = filteredMetrics.filter(metric =>
        metric.name === metricName
      )
    }

    // Generate summary statistics
    const summary = generateAnalyticsSummary(filteredEvents, filteredMetrics)

    return NextResponse.json({
      summary,
      events: filteredEvents.slice(-100), // Last 100 events
      metrics: filteredMetrics.slice(-100), // Last 100 metrics
      totalSessions: analyticsData.sessions.size,
      timeframe,
      timestamp: now
    })

  } catch (error) {
    console.error('Analytics retrieval error:', error)

    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    )
  }
}

// Process individual analytics events
async function processAnalyticsEvent(event: AnalyticsEvent) {
  try {
    switch (event.eventType) {
      case 'ecommerce':
        await processEcommerceEvent(event)
        break

      case 'performance':
        await processPerformanceEvent(event)
        break

      case 'error':
        await processErrorEvent(event)
        break

      case 'conversion':
        await processConversionEvent(event)
        break

      case 'engagement':
        await processEngagementEvent(event)
        break

      default:
        // Generic event processing
        break
    }
  } catch (error) {
    console.error('Event processing error:', error)
  }
}

// Process performance metrics
async function processPerformanceMetric(metric: PerformanceMetric) {
  try {
    // Check for performance issues
    const performanceThresholds = {
      lcp: 2500, // Largest Contentful Paint
      fid: 100,  // First Input Delay
      cls: 0.1,  // Cumulative Layout Shift
      fcp: 1500, // First Contentful Paint
      ttfb: 600  // Time to First Byte
    }

    if (metric.name in performanceThresholds) {
      const threshold = performanceThresholds[metric.name as keyof typeof performanceThresholds]

      if (metric.value > threshold) {
        reportServerMessage(
          `Performance threshold exceeded: ${metric.name}`,
          'warning',
          {
            metricName: metric.name,
            value: metric.value,
            threshold,
            url: metric.url,
            userAgent: metric.userAgent
          }
        )
      }
    }

    // Store metric for trending analysis
    // In production, this would update database aggregations

  } catch (error) {
    console.error('Performance metric processing error:', error)
  }
}

// Event type processors
async function processEcommerceEvent(event: AnalyticsEvent) {
  if (event.eventName === 'purchase') {
    // Track revenue, conversion rates, etc.
    console.log('Purchase tracked:', event.properties)
  } else if (event.eventName === 'add_to_cart') {
    // Track cart additions
    console.log('Add to cart tracked:', event.properties)
  }
}

async function processPerformanceEvent(event: AnalyticsEvent) {
  // Process performance-related events
  console.log('Performance event:', event.eventName, event.properties)
}

async function processErrorEvent(event: AnalyticsEvent) {
  // Track JavaScript errors for analysis
  reportServerMessage(
    `Frontend error: ${event.eventName}`,
    'error',
    {
      message: event.properties.message,
      filename: event.properties.filename,
      stack: event.properties.stack,
      url: event.url,
      userId: event.userId
    }
  )
}

async function processConversionEvent(event: AnalyticsEvent) {
  // Track conversion funnel events
  console.log('Conversion event:', event.eventName, event.properties)
}

async function processEngagementEvent(event: AnalyticsEvent) {
  // Track user engagement metrics
  console.log('Engagement event:', event.eventName, event.properties)
}

// Generate analytics summary
function generateAnalyticsSummary(events: AnalyticsEvent[], metrics: PerformanceMetric[]) {
  const summary = {
    totalEvents: events.length,
    totalMetrics: metrics.length,
    uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
    uniqueSessions: new Set(events.map(e => e.sessionId)).size,
    eventTypes: {} as Record<string, number>,
    metricSummaries: {} as Record<string, { count: number; avg: number; min: number; max: number }>,
    topPages: {} as Record<string, number>,
    performanceAverages: {} as Record<string, number>
  }

  // Event type breakdown
  events.forEach(event => {
    summary.eventTypes[event.eventType] = (summary.eventTypes[event.eventType] || 0) + 1
  })

  // Page popularity
  events.forEach(event => {
    if (event.url) {
      const path = new URL(event.url).pathname
      summary.topPages[path] = (summary.topPages[path] || 0) + 1
    }
  })

  // Metric summaries
  const metricGroups = metrics.reduce((groups, metric) => {
    if (!groups[metric.name]) {
      groups[metric.name] = []
    }
    groups[metric.name].push(metric.value)
    return groups
  }, {} as Record<string, number[]>)

  Object.entries(metricGroups).forEach(([name, values]) => {
    summary.metricSummaries[name] = {
      count: values.length,
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    }
  })

  // Core Web Vitals averages
  const coreVitals = ['lcp', 'fid', 'cls', 'fcp', 'ttfb']
  coreVitals.forEach(vital => {
    const vitalMetrics = metrics.filter(m => m.name === vital)
    if (vitalMetrics.length > 0) {
      summary.performanceAverages[vital] =
        vitalMetrics.reduce((sum, m) => sum + m.value, 0) / vitalMetrics.length
    }
  })

  return summary
}

// Rate limiting (basic implementation)
const requestCounts = new Map<string, { count: number; timestamp: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 100 // Max 100 requests per minute

  const current = requestCounts.get(ip)

  if (!current || now - current.timestamp > windowMs) {
    requestCounts.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}
