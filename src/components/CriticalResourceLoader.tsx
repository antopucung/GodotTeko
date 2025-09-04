'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface CriticalResourceLoaderProps {
  preloadFonts?: boolean
  preloadImages?: string[]
  prefetchRoutes?: string[]
  criticalCSS?: string
}

export function CriticalResourceLoader({
  preloadFonts = true,
  preloadImages = [],
  prefetchRoutes = [],
  criticalCSS
}: CriticalResourceLoaderProps) {

  useEffect(() => {
    // Font optimization
    if (preloadFonts && typeof window !== 'undefined') {
      // Preload Google Fonts with font-display: swap
      const fontLink = document.createElement('link')
      fontLink.rel = 'preload'
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
      fontLink.as = 'style'
      fontLink.onload = () => {
        fontLink.rel = 'stylesheet'
      }
      document.head.appendChild(fontLink)

      // Preload font files directly for critical text
      const criticalFonts = [
        'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
      ]

      criticalFonts.forEach(fontUrl => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = fontUrl
        link.as = 'font'
        link.type = 'font/woff2'
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })
    }

    // Image preloading
    preloadImages.forEach(imageUrl => {
      if (imageUrl && typeof window !== 'undefined') {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = imageUrl
        link.as = 'image'
        document.head.appendChild(link)
      }
    })

    // Route prefetching
    prefetchRoutes.forEach(route => {
      if (route && typeof window !== 'undefined') {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = route
        document.head.appendChild(link)
      }
    })

    // Critical CSS injection
    if (criticalCSS && typeof window !== 'undefined') {
      const style = document.createElement('style')
      style.textContent = criticalCSS
      style.setAttribute('data-critical', 'true')
      document.head.appendChild(style)
    }

    // Performance optimization: Resource hints
    const resourceHints = [
      // DNS prefetch for external domains
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
      { rel: 'dns-prefetch', href: '//cdn.sanity.io' },
      { rel: 'dns-prefetch', href: '//images.unsplash.com' },

      // Preconnect for critical third-party domains
      { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossOrigin: 'anonymous' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'preconnect', href: 'https://cdn.sanity.io' },
      { rel: 'preconnect', href: 'https://js.stripe.com' },
    ]

    resourceHints.forEach(hint => {
      const existingLink = document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = hint.rel
        link.href = hint.href
        if (hint.crossOrigin) {
          link.crossOrigin = hint.crossOrigin
        }
        document.head.appendChild(link)
      }
    })

    // Service Worker registration for enhanced caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    // Critical resource preloading based on route
    const currentPath = window.location.pathname

    if (currentPath === '/') {
      // Homepage critical resources
      const homepageResources = [
        '/api/products?featured=true&limit=8',
        '/api/categories'
      ]

      homepageResources.forEach(resource => {
        fetch(resource).catch(() => {}) // Preload but don't fail if it errors
      })
    } else if (currentPath.startsWith('/products/')) {
      // Product page critical resources
      const productResources = [
        '/api/products?sortBy=related&limit=4'
      ]

      productResources.forEach(resource => {
        fetch(resource).catch(() => {})
      })
    }

    // Performance monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Monitor First Contentful Paint
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              console.log('FCP:', entry.startTime)

              // Send to analytics if available
              if ((window as any).gtag) {
                (window as any).gtag('event', 'timing_complete', {
                  name: 'first_contentful_paint',
                  value: Math.round(entry.startTime)
                })
              }
            }
          }
        })

        observer.observe({ entryTypes: ['paint'] })
      } catch (e) {
        // PerformanceObserver not supported
      }
    }

    // Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('img[data-lazy]')
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.lazy || ''
            img.removeAttribute('data-lazy')
            imageObserver.unobserve(img)
          }
        })
      }, {
        rootMargin: '50px 0px'
      })

      lazyImages.forEach(img => imageObserver.observe(img))
    }

  }, [preloadFonts, preloadImages, prefetchRoutes, criticalCSS])

  return (
    <>
      {/* Critical CSS for above-the-fold content */}
      <style jsx>{`
        /* Critical CSS for immediate rendering */
        html {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
        }

        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background-color: #161617;
          color: #ffffff;
        }

        /* Critical header styles */
        header {
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: #161617;
          border-bottom: 1px solid #374151;
        }

        /* Critical loading states */
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Critical font loading */
        .font-loading {
          font-family: system-ui, -apple-system, sans-serif;
          visibility: hidden;
        }

        .font-loaded {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          visibility: visible;
        }
      `}</style>

      {/* Performance monitoring script */}
      <Script
        id="performance-monitor"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Mark critical resources as loaded
            window.addEventListener('load', function() {
              if (window.performance && window.performance.mark) {
                window.performance.mark('critical-resources-loaded');
              }
            });

            // Font loading optimization
            if ('FontFace' in window) {
              const inter = new FontFace('Inter', 'url(https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2)', {
                weight: '400',
                style: 'normal',
                display: 'swap'
              });

              inter.load().then(function(loadedFont) {
                document.fonts.add(loadedFont);
                document.body.classList.add('font-loaded');
                document.body.classList.remove('font-loading');
              }).catch(function(error) {
                console.warn('Font loading failed:', error);
                document.body.classList.add('font-loaded'); // Fallback to system fonts
              });
            }

            // Critical path optimization
            if (typeof window !== 'undefined') {
              // Preload critical API data
              const criticalAPIs = [
                '/api/site-configuration',
                '/api/categories'
              ];

              criticalAPIs.forEach(function(api) {
                fetch(api, { priority: 'high' }).catch(function() {});
              });
            }
          `
        }}
      />

      {/* Font optimization */}
      <link
        rel="preload"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        as="style"
        onLoad="this.onload=null;this.rel='stylesheet'"
      />
      <noscript>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </noscript>
    </>
  )
}

// Critical CSS extraction utility
export const criticalCSS = `
  html { font-family: system-ui, sans-serif; line-height: 1.5; }
  body { margin: 0; background: #161617; color: white; }
  header { position: sticky; top: 0; z-index: 50; background: #161617; border-bottom: 1px solid #374151; }
  .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite; }
  @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`

// Preload image URLs for critical content
export const criticalImages = [
  'https://ext.same-assets.com/1519585551/845175416.jpeg', // Hero background
]

// Routes to prefetch for better navigation
export const prefetchRoutes = [
  '/products/browse',
  '/learn',
  '/play-station',
  '/all-access'
]
