module.exports = {
  ci: {
    collect: {
      // Same URLs as desktop but with mobile testing
      url: [
        'http://localhost:3000',
        'http://localhost:3000/products/browse',
        'http://localhost:3000/learn',
        'http://localhost:3000/all-access',
        'http://localhost:3000/category/ui-kits',
        'http://localhost:3000/auth/signin'
      ],

      numberOfRuns: 3,
      startServerCommand: 'bun run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,

      // Mobile-specific Chrome settings
      settings: {
        chromeFlags: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions'
        ],
        preset: 'mobile', // Mobile testing
        throttling: {
          // Simulate mobile network conditions
          rttMs: 150,
          throughputKbps: 1638,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 150,
          downloadThroughputKbps: 1638,
          uploadThroughputKbps: 675
        },
        emulatedFormFactor: 'mobile',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: [
          'canonical',
          'robots-txt',
          'is-crawlable',
          'tap-targets', // Sometimes problematic on mobile
        ]
      }
    },

    assert: {
      // Mobile-optimized performance thresholds (more lenient than desktop)
      assertions: {
        // Core categories - mobile-adjusted scores
        'categories:performance': ['error', { minScore: 0.8 }], // 80+ for mobile
        'categories:accessibility': ['error', { minScore: 0.95 }], // Still high for accessibility
        'categories:best-practices': ['error', { minScore: 0.9 }], // 90+ best practices
        'categories:seo': ['error', { minScore: 0.9 }], // 90+ SEO

        // Mobile-specific Core Web Vitals thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }], // < 2s on mobile
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }], // < 3.5s on mobile
        'first-meaningful-paint': ['error', { maxNumericValue: 3000 }], // < 3s on mobile
        'speed-index': ['error', { maxNumericValue: 4000 }], // < 4s on mobile
        'interactive': ['error', { maxNumericValue: 5000 }], // < 5s on mobile
        'max-potential-fid': ['error', { maxNumericValue: 180 }], // < 180ms on mobile
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // Same CLS threshold
        'total-blocking-time': ['error', { maxNumericValue: 400 }], // < 400ms on mobile

        // Mobile-specific optimizations
        'unused-css-rules': ['error', { maxNumericValue: 75000 }], // < 75KB unused CSS
        'unused-javascript': ['error', { maxNumericValue: 150000 }], // < 150KB unused JS
        'modern-image-formats': ['error', { minScore: 0.8 }], // Critical for mobile
        'uses-responsive-images': ['error', { minScore: 0.9 }], // Very important for mobile
        'efficient-animated-content': ['error', { minScore: 0.8 }], // Efficient animations
        'uses-optimized-images': ['error', { minScore: 0.8 }], // Optimized images
        'uses-webp-images': ['error', { minScore: 0.7 }], // WebP support

        // Network optimization (critical for mobile)
        'render-blocking-resources': ['error', { maxNumericValue: 500 }], // < 500ms
        'uses-rel-preconnect': ['error', { minScore: 0.8 }], // Preconnect important
        'uses-text-compression': ['error', { minScore: 0.9 }], // Compression critical

        // Mobile usability
        'viewport': ['error', { minScore: 1 }], // Viewport meta tag required
        'font-size': ['error', { minScore: 0.9 }], // Readable font sizes
        'touch-targets': ['warn', { minScore: 0.8 }], // Touch target size warning only

        // Security (same standards)
        'uses-https': ['error', { minScore: 1 }],
        'is-on-https': ['error', { minScore: 1 }],
        'no-vulnerable-libraries': ['error', { minScore: 1 }],

        // SEO (mobile-first indexing)
        'meta-description': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'structured-data': ['error', { minScore: 0.8 }],
        'meta-viewport': ['error', { minScore: 1 }], // Critical for mobile
      }
    },

    upload: {
      target: 'temporary-public-storage',

      // Add mobile-specific context
      extraHeaders: {
        'X-Device-Type': 'mobile'
      }
    }
  }
};
