// Service Worker for Godot Tekko Platform
// Version 1.0.0 - Advanced Caching & Performance

const CACHE_NAME = 'godot-tekko-v1'
const STATIC_CACHE = 'static-v1'
const API_CACHE = 'api-v1'
const IMAGE_CACHE = 'images-v1'

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/auth/signin',
  '/all-access',
  '/user/dashboard',
  '/offline',
  '/manifest.json'
]

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/site-configuration',
  '/api/subscription-plans',
  '/api/products',
  '/api/categories'
]

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  API: 5 * 60 * 1000, // 5 minutes
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 1 * 60 * 1000 // 1 minute
}

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS)
      }),

      // Cache API responses
      caches.open(API_CACHE).then(cache => {
        return Promise.all(
          CACHEABLE_APIS.map(api => {
            return fetch(api)
              .then(response => response.ok ? cache.put(api, response) : null)
              .catch(() => null) // Fail silently for non-critical APIs
          })
        )
      }),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated')

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME &&
                cacheName !== STATIC_CACHE &&
                cacheName !== API_CACHE &&
                cacheName !== IMAGE_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),

      // Take control of all pages
      self.clients.claim()
    ])
  )
})

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests (except for known CDNs)
  if (!isAllowedOrigin(url)) {
    return
  }

  // Route to appropriate cache strategy
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request))
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request))
  } else {
    event.respondWith(handleDynamicRequest(request))
  }
})

// Check if origin is allowed
function isAllowedOrigin(url) {
  const allowedOrigins = [
    self.location.origin,
    'https://cdn.sanity.io',
    'https://images.unsplash.com',
    'https://same-assets.com'
  ]

  return allowedOrigins.some(origin => url.href.startsWith(origin))
}

// Check if request is for static assets
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot']
  const pathname = url.pathname.toLowerCase()

  return staticExtensions.some(ext => pathname.endsWith(ext)) ||
         pathname.startsWith('/_next/static/') ||
         pathname === '/manifest.json' ||
         pathname === '/favicon.ico'
}

// Check if request is for API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/')
}

// Check if request is for images
function isImageRequest(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']
  const pathname = url.pathname.toLowerCase()

  return imageExtensions.some(ext => pathname.includes(ext)) ||
         url.hostname === 'cdn.sanity.io' ||
         url.hostname === 'images.unsplash.com'
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_DURATIONS.STATIC)) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('📡 Static asset fetch failed, serving from cache:', error)
    const cache = await caches.open(STATIC_CACHE)
    const fallback = await cache.match(request)
    return fallback || new Response('Asset not available offline', { status: 503 })
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)

  // Don't cache user-specific or mutation APIs
  if (isPrivateApi(url.pathname)) {
    return fetch(request)
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('📡 API fetch failed, serving from cache:', error)
    const cache = await caches.open(API_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    return new Response(JSON.stringify({
      error: 'Service temporarily unavailable',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_DURATIONS.IMAGES)) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('📡 Image fetch failed:', error)
    const cache = await caches.open(IMAGE_CACHE)
    const fallback = await cache.match(request)

    if (fallback) {
      return fallback
    }

    // Return placeholder image
    return new Response(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <text x="200" y="150" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">
          Image unavailable offline
        </text>
      </svg>
    `, {
      headers: { 'Content-Type': 'image/svg+xml' }
    })
  }
}

// Handle dynamic requests with stale-while-revalidate
async function handleDynamicRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)

    // Return cached version immediately if available
    if (cachedResponse) {
      // Revalidate in background
      fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone())
        }
      }).catch(() => {})

      return cachedResponse
    }

    // No cache, fetch from network
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('📡 Dynamic request failed:', error)

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE)
      const offlinePage = await cache.match('/offline')
      return offlinePage || new Response('Offline', { status: 503 })
    }

    return new Response('Service unavailable', { status: 503 })
  }
}

// Check if API is private/user-specific
function isPrivateApi(pathname) {
  const privatePatterns = [
    '/api/user/',
    '/api/admin/',
    '/api/auth/',
    '/api/checkout/',
    '/api/cart/',
    '/api/orders/'
  ]

  return privatePatterns.some(pattern => pathname.startsWith(pattern))
}

// Check if cache entry is expired
function isCacheExpired(response, maxAge) {
  const dateHeader = response.headers.get('date')
  if (!dateHeader) return true

  const responseTime = new Date(dateHeader).getTime()
  const now = Date.now()

  return (now - responseTime) > maxAge
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync())
  }
})

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Sync any pending offline actions
    // This could include form submissions, likes, etc.
    console.log('🔄 Performing background sync...')

    // Implementation would depend on your offline strategy
    // For now, just clear expired cache entries
    await cleanExpiredCaches()

  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Clean expired cache entries
async function cleanExpiredCaches() {
  const cacheNames = [API_CACHE, IMAGE_CACHE, CACHE_NAME]

  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()

      for (const request of keys) {
        const response = await cache.match(request)
        if (response && isCacheExpired(response, CACHE_DURATIONS.API)) {
          await cache.delete(request)
        }
      }
    } catch (error) {
      console.error('Error cleaning cache:', cacheName, error)
    }
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'CACHE_URLS':
      if (payload && payload.urls) {
        event.waitUntil(cacheUrls(payload.urls))
      }
      break

    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches())
      break

    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size })
      }))
      break

    default:
      console.log('Unknown message type:', type)
  }
})

// Cache specific URLs
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME)
  return Promise.all(
    urls.map(url =>
      fetch(url).then(response =>
        response.ok ? cache.put(url, response) : null
      ).catch(() => null)
    )
  )
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  return Promise.all(cacheNames.map(name => caches.delete(name)))
}

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0

  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()

    for (const request of keys) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }

  return totalSize
}

console.log('🚀 Godot Tekko Service Worker loaded and ready!')
