import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
import { KeyboardNavigationProvider } from "@/components/KeyboardShortcuts";
import { CriticalResourceLoader, criticalImages, prefetchRoutes } from "@/components/CriticalResourceLoader";

export const metadata: Metadata = {
  title: {
    default: "Godot Tekko - Premium Design & Game Development Marketplace",
    template: "%s | Godot Tekko"
  },
  description: "Discover premium UI kits, game assets, Godot templates, and design resources at Godot Tekko. Perfect for game developers, designers, and creative professionals.",
  keywords: [
    "godot",
    "game development",
    "ui kits",
    "design resources",
    "game assets",
    "templates",
    "creative marketplace",
    "godot engine",
    "indie game development"
  ],
  authors: [{ name: "Godot Tekko Team" }],
  creator: "Godot Tekko",
  publisher: "Godot Tekko",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'),

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app',
    siteName: 'Godot Tekko',
    title: 'Godot Tekko - Premium Design & Game Development Marketplace',
    description: 'Discover premium UI kits, game assets, Godot templates, and design resources for game developers and designers.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Godot Tekko - Premium Design & Game Development Marketplace',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Godot Tekko - Premium Design & Game Development Marketplace',
    description: 'Discover premium UI kits, game assets, Godot templates, and design resources for game developers and designers.',
    images: ['/og-image.jpg'],
    creator: '@godottekko',
  },

  // Additional
  category: 'technology',

  // Icons and App Config
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  // Web App Manifest
  manifest: '/site.webmanifest',

  // App specific
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Godot Tekko',
    'application-name': 'Godot Tekko',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-tap-highlight': 'no',
    'theme-color': '#3b82f6',
  },
};

// Enhanced Structured Data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Godot Tekko",
  "description": "Premium Design & Game Development Marketplace",
  "url": process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app',
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'}/products/browse?query={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Godot Tekko Team",
    "url": process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app',
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'}/og-image.jpg`,
    "sameAs": [
      "https://github.com/godot-tekko",
      "https://twitter.com/godottekko"
    ]
  },
  "mainEntity": {
    "@type": "ItemList",
    "name": "Design Resources",
    "description": "Premium UI kits, game assets, and design templates",
    "numberOfItems": 11529
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Enhanced preconnect and performance hints */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://js.stripe.com" />

        {/* Critical font preloading */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          as="style"
        />
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Critical hero image preload */}
        <link
          rel="preload"
          href="https://ext.same-assets.com/1519585551/845175416.jpeg"
          as="image"
        />

        {/* Route prefetching for better navigation */}
        <link rel="prefetch" href="/products/browse" />
        <link rel="prefetch" href="/learn" />
        <link rel="prefetch" href="/play-station" />

        {/* PWA Icons */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎨</text></svg>" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎨</text></svg>" />

        {/* Performance hints */}
        <link rel="dns-prefetch" href="//cdn.sanity.io" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* Performance and accessibility */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className="antialiased font-sans"
        suppressHydrationWarning
      >
        {/* Critical Resource Loader for Performance */}
        <CriticalResourceLoader
          preloadFonts={true}
          preloadImages={criticalImages}
          prefetchRoutes={prefetchRoutes}
        />

        {/* Critical Error Boundary */}
        <ErrorBoundary
          level="critical"
          name="Root Application"
        >
          {/* Service Worker & PWA Provider */}
          <ServiceWorkerProvider
            enableNotifications={true}
            enableInstallPrompt={true}
          >
            {/* Keyboard Navigation Provider */}
            <KeyboardNavigationProvider enableGlobalShortcuts={true}>
              {/* App Providers (Auth, Cart, etc.) */}
              <ErrorBoundary level="page" name="App Providers">
                <Providers>
                  {/* Analytics Provider */}
                  <AnalyticsProvider>
                    {/* Onboarding Manager */}
                    <OnboardingManager>
                      {/* Page Content */}
                      <ErrorBoundary level="page" name="Page Content">
                        <main id="main-content" role="main">
                          {children}
                        </main>
                      </ErrorBoundary>
                    </OnboardingManager>
                  </AnalyticsProvider>

                  {/* Toast Notifications */}
                  <Toaster
                    position="top-right"
                    expand={true}
                    richColors={true}
                    closeButton={true}
                    toastOptions={{
                      style: {
                        background: '#1f2937',
                        color: '#f9fafb',
                        border: '1px solid #374151',
                      },
                      className: 'toast-notification',
                      duration: 4000,
                    }}
                    theme="dark"
                  />
                </Providers>
              </ErrorBoundary>
            </KeyboardNavigationProvider>
          </ServiceWorkerProvider>
        </ErrorBoundary>

        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to main content
        </a>

        {/* Performance monitoring script */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Core Web Vitals monitoring
                function sendToAnalytics(name, value, id) {
                  if (typeof gtag !== 'undefined') {
                    gtag('event', name, {
                      custom_parameter_1: value,
                      custom_parameter_2: id,
                    });
                  }
                }

                // Web Vitals
                new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (entry.entryType === 'largest-contentful-paint') {
                      sendToAnalytics('LCP', entry.startTime, entry.id);
                    }
                    if (entry.entryType === 'first-input') {
                      sendToAnalytics('FID', entry.processingStart - entry.startTime, entry.id);
                    }
                    if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                      sendToAnalytics('CLS', entry.value, entry.id);
                    }
                  }
                }).observe({entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']});

                // Network status monitoring
                function updateOnlineStatus() {
                  if (navigator.onLine) {
                    document.body.classList.remove('offline');
                  } else {
                    document.body.classList.add('offline');
                  }
                }
                window.addEventListener('online', updateOnlineStatus);
                window.addEventListener('offline', updateOnlineStatus);
                updateOnlineStatus();
              `
            }}
          />
        )}
      </body>
    </html>
  );
}
