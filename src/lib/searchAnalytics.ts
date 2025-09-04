import { SearchFilters } from '@/types'

interface SearchEvent {
  id: string
  timestamp: number
  query: string
  filters: SearchFilters
  resultsCount: number
  searchDuration: number
  fromCache: boolean
  userAgent: string
}

interface FilterUsageStats {
  filterType: string
  filterValue: string
  usageCount: number
  lastUsed: number
}

interface SearchAnalytics {
  totalSearches: number
  popularTerms: Record<string, number>
  filterUsage: FilterUsageStats[]
  averageSearchDuration: number
  cacheHitRate: number
  recentSearches: SearchEvent[]
  dailyStats: Record<string, number>
}

// Storage keys
const ANALYTICS_KEY = 'ui8-search-analytics'
const EVENTS_KEY = 'ui8-search-events'
const MAX_EVENTS = 1000 // Limit stored events to prevent bloat

// Get current analytics data
export function getSearchAnalytics(): SearchAnalytics {
  if (typeof window === 'undefined') {
    return getEmptyAnalytics()
  }

  try {
    const stored = localStorage.getItem(ANALYTICS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Analytics read error:', error)
  }

  return getEmptyAnalytics()
}

// Get empty analytics structure
function getEmptyAnalytics(): SearchAnalytics {
  return {
    totalSearches: 0,
    popularTerms: {},
    filterUsage: [],
    averageSearchDuration: 0,
    cacheHitRate: 0,
    recentSearches: [],
    dailyStats: {}
  }
}

// Track a search event
export function trackSearchEvent(
  query: string,
  filters: SearchFilters,
  resultsCount: number,
  searchDuration: number,
  fromCache: boolean = false
): void {
  if (typeof window === 'undefined') return

  try {
    const event: SearchEvent = {
      id: generateEventId(),
      timestamp: Date.now(),
      query: query.trim(),
      filters: { ...filters },
      resultsCount,
      searchDuration,
      fromCache,
      userAgent: navigator.userAgent
    }

    // Store the event
    storeSearchEvent(event)

    // Update analytics
    updateAnalytics(event)

    // Track filter usage
    trackFilterUsage(filters)

  } catch (error) {
    console.warn('Analytics tracking error:', error)
  }
}

// Store individual search event
function storeSearchEvent(event: SearchEvent): void {
  try {
    const events = getSearchEvents()
    events.unshift(event)

    // Keep only the most recent events
    const limitedEvents = events.slice(0, MAX_EVENTS)

    localStorage.setItem(EVENTS_KEY, JSON.stringify(limitedEvents))
  } catch (error) {
    console.warn('Event storage error:', error)
  }
}

// Get stored search events
function getSearchEvents(): SearchEvent[] {
  try {
    const stored = localStorage.getItem(EVENTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Events read error:', error)
    return []
  }
}

// Update aggregated analytics
function updateAnalytics(event: SearchEvent): void {
  try {
    const analytics = getSearchAnalytics()
    const events = getSearchEvents()

    // Update basic counts
    analytics.totalSearches = events.length

    // Update popular terms
    if (event.query) {
      analytics.popularTerms[event.query] = (analytics.popularTerms[event.query] || 0) + 1
    }

    // Update recent searches (keep last 20)
    analytics.recentSearches = events.slice(0, 20)

    // Calculate performance metrics
    const validDurations = events
      .filter(e => e.searchDuration > 0)
      .map(e => e.searchDuration)

    if (validDurations.length > 0) {
      analytics.averageSearchDuration =
        validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
    }

    // Calculate cache hit rate
    const cacheHits = events.filter(e => e.fromCache).length
    analytics.cacheHitRate = events.length > 0 ? (cacheHits / events.length) * 100 : 0

    // Update daily stats
    const today = new Date().toISOString().split('T')[0]
    analytics.dailyStats[today] = events.filter(e => {
      const eventDate = new Date(e.timestamp).toISOString().split('T')[0]
      return eventDate === today
    }).length

    // Clean up old daily stats (keep last 30 days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)

    Object.keys(analytics.dailyStats).forEach(date => {
      if (new Date(date) < cutoffDate) {
        delete analytics.dailyStats[date]
      }
    })

    // Save updated analytics
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics))

  } catch (error) {
    console.warn('Analytics update error:', error)
  }
}

// Track filter usage
function trackFilterUsage(filters: SearchFilters): void {
  try {
    const analytics = getSearchAnalytics()
    const now = Date.now()

    // Track each applied filter
    Object.entries(filters).forEach(([filterType, filterValue]) => {
      if (filterValue === undefined || filterValue === null) return

      let valueString: string
      if (Array.isArray(filterValue)) {
        if (filterValue.length === 0) return
        valueString = filterValue.join(',')
      } else {
        valueString = String(filterValue)
      }

      // Find existing filter usage or create new one
      const existingIndex = analytics.filterUsage.findIndex(
        f => f.filterType === filterType && f.filterValue === valueString
      )

      if (existingIndex >= 0) {
        analytics.filterUsage[existingIndex].usageCount += 1
        analytics.filterUsage[existingIndex].lastUsed = now
      } else {
        analytics.filterUsage.push({
          filterType,
          filterValue: valueString,
          usageCount: 1,
          lastUsed: now
        })
      }
    })

    // Sort by usage count and keep top 100
    analytics.filterUsage = analytics.filterUsage
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 100)

    // Save updated analytics
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics))

  } catch (error) {
    console.warn('Filter tracking error:', error)
  }
}

// Get popular search terms
export function getPopularSearchTerms(limit: number = 10): Array<{ term: string; count: number }> {
  const analytics = getSearchAnalytics()

  return Object.entries(analytics.popularTerms)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Get filter usage statistics
export function getFilterUsageStats(limit: number = 20): FilterUsageStats[] {
  const analytics = getSearchAnalytics()
  return analytics.filterUsage.slice(0, limit)
}

// Get performance metrics
export function getPerformanceMetrics(): {
  totalSearches: number
  averageSearchDuration: number
  cacheHitRate: number
  searchesThisWeek: number
  topSearchTerms: Array<{ term: string; count: number }>
} {
  const analytics = getSearchAnalytics()

  // Calculate searches this week
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  const searchesThisWeek = analytics.recentSearches.filter(
    event => event.timestamp > weekAgo
  ).length

  return {
    totalSearches: analytics.totalSearches,
    averageSearchDuration: Math.round(analytics.averageSearchDuration),
    cacheHitRate: Math.round(analytics.cacheHitRate * 10) / 10,
    searchesThisWeek,
    topSearchTerms: getPopularSearchTerms(5)
  }
}

// Clear analytics data
export function clearAnalytics(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(ANALYTICS_KEY)
    localStorage.removeItem(EVENTS_KEY)
  } catch (error) {
    console.warn('Analytics clear error:', error)
  }
}

// Generate unique event ID
function generateEventId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Export data for backup/analysis
export function exportAnalyticsData(): {
  analytics: SearchAnalytics
  events: SearchEvent[]
  exportedAt: string
} {
  return {
    analytics: getSearchAnalytics(),
    events: getSearchEvents(),
    exportedAt: new Date().toISOString()
  }
}

// Get daily search trends (last 7 days)
export function getDailySearchTrends(): Array<{ date: string; searches: number }> {
  const analytics = getSearchAnalytics()
  const trends: Array<{ date: string; searches: number }> = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]

    trends.push({
      date: dateString,
      searches: analytics.dailyStats[dateString] || 0
    })
  }

  return trends
}
