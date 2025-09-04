import { SearchFilters, SearchResult, Product } from '@/types'

interface CacheEntry {
  data: SearchResult<Product>
  timestamp: number
  filters: SearchFilters
  cacheKey: string
}

// Cache configuration
const CACHE_PREFIX = 'ui8-search-cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_ENTRIES = 20 // Limit cache size

// Generate a simple cache key from filters
export function generateCacheKey(filters: SearchFilters, page: number = 1): string {
  // Create a normalized key from filters
  const keyParts = [
    filters.query || '',
    (filters.categories || []).sort().join(','),
    filters.sortBy || 'relevance',
    filters.featured?.toString() || '',
    filters.freebie?.toString() || '',
    filters.author || '',
    (filters.priceRange || []).join('-'),
    (filters.fileTypes || []).sort().join(','),
    (filters.compatibleWith || []).sort().join(','),
    filters.minRating?.toString() || '',
    page.toString()
  ]

  return btoa(keyParts.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
}

// Check if cache entry is valid
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now()
  return (now - entry.timestamp) < CACHE_DURATION
}

// Get cached result
export function getCachedResult(filters: SearchFilters, page: number = 1): SearchResult<Product> | null {
  if (typeof window === 'undefined') return null

  try {
    const cacheKey = generateCacheKey(filters, page)
    const cached = sessionStorage.getItem(`${CACHE_PREFIX}-${cacheKey}`)

    if (!cached) return null

    const entry: CacheEntry = JSON.parse(cached)

    if (!isCacheValid(entry)) {
      // Remove expired entry
      sessionStorage.removeItem(`${CACHE_PREFIX}-${cacheKey}`)
      return null
    }

    // Verify filters match (extra safety check)
    if (JSON.stringify(entry.filters) !== JSON.stringify(filters)) {
      return null
    }

    // Mark as cached result
    return {
      ...entry.data,
      meta: {
        ...entry.data.meta,
        cached: true,
        cacheTimestamp: entry.timestamp
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error)
    return null
  }
}

// Cache search result
export function setCachedResult(
  filters: SearchFilters,
  result: SearchResult<Product>,
  page: number = 1
): void {
  if (typeof window === 'undefined') return

  try {
    const cacheKey = generateCacheKey(filters, page)
    const entry: CacheEntry = {
      data: result,
      timestamp: Date.now(),
      filters: { ...filters }, // Deep copy filters
      cacheKey
    }

    // Store the entry
    sessionStorage.setItem(`${CACHE_PREFIX}-${cacheKey}`, JSON.stringify(entry))

    // Clean up old entries to prevent memory bloat
    cleanupCache()

  } catch (error) {
    console.warn('Cache write error:', error)
    // If storage is full, try cleaning cache first
    if (error instanceof DOMException && error.code === 22) {
      clearCache()
    }
  }
}

// Clean up old cache entries
function cleanupCache(): void {
  if (typeof window === 'undefined') return

  try {
    const entries: Array<{ key: string; timestamp: number }> = []

    // Find all cache entries
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const entry: CacheEntry = JSON.parse(sessionStorage.getItem(key) || '{}')
          entries.push({ key, timestamp: entry.timestamp || 0 })
        } catch {
          // Remove invalid entries
          sessionStorage.removeItem(key)
        }
      }
    }

    // Remove expired entries
    const now = Date.now()
    entries.forEach(({ key, timestamp }) => {
      if ((now - timestamp) > CACHE_DURATION) {
        sessionStorage.removeItem(key)
      }
    })

    // If still too many entries, remove oldest ones
    const validEntries = entries.filter(({ timestamp }) =>
      (now - timestamp) <= CACHE_DURATION
    )

    if (validEntries.length > MAX_CACHE_ENTRIES) {
      const entriesToRemove = validEntries
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, validEntries.length - MAX_CACHE_ENTRIES)

      entriesToRemove.forEach(({ key }) => {
        sessionStorage.removeItem(key)
      })
    }
  } catch (error) {
    console.warn('Cache cleanup error:', error)
  }
}

// Clear all cache
export function clearCache(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToRemove: string[] = []

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key))
  } catch (error) {
    console.warn('Cache clear error:', error)
  }
}

// Get cache statistics
export function getCacheStats(): {
  totalEntries: number
  totalSize: number
  oldestEntry: number | null
  newestEntry: number | null
} {
  if (typeof window === 'undefined') {
    return { totalEntries: 0, totalSize: 0, oldestEntry: null, newestEntry: null }
  }

  try {
    let totalEntries = 0
    let totalSize = 0
    let oldestEntry: number | null = null
    let newestEntry: number | null = null

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        const value = sessionStorage.getItem(key)
        if (value) {
          totalEntries++
          totalSize += value.length

          try {
            const entry: CacheEntry = JSON.parse(value)
            if (oldestEntry === null || entry.timestamp < oldestEntry) {
              oldestEntry = entry.timestamp
            }
            if (newestEntry === null || entry.timestamp > newestEntry) {
              newestEntry = entry.timestamp
            }
          } catch {
            // Ignore invalid entries
          }
        }
      }
    }

    return {
      totalEntries,
      totalSize,
      oldestEntry,
      newestEntry
    }
  } catch (error) {
    console.warn('Cache stats error:', error)
    return { totalEntries: 0, totalSize: 0, oldestEntry: null, newestEntry: null }
  }
}

// Check if filters have significantly changed (for smart invalidation)
export function hasSignificantFilterChange(
  oldFilters: SearchFilters,
  newFilters: SearchFilters
): boolean {
  // These changes should invalidate cache
  const significantChanges = [
    'query',
    'categories',
    'sortBy',
    'featured',
    'freebie',
    'author',
    'priceRange',
    'minRating'
  ]

  return significantChanges.some(key => {
    const oldValue = oldFilters[key as keyof SearchFilters]
    const newValue = newFilters[key as keyof SearchFilters]
    return JSON.stringify(oldValue) !== JSON.stringify(newValue)
  })
}
