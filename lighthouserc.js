module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000',
        'http://localhost:3000/products/browse',
        'http://localhost:3000/learn',
        'http://localhost:3000/all-access',
        'http://localhost:3000/category/ui-kits',
        'http://localhost:3000/auth/signin'
      ],

      // Collection settings
      numberOfRuns: 3,
      startServerCommand: 'bun run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,

      // Chrome settings for consistent testing
      settings: {
        chromeFlags: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        preset: 'desktop', // Test desktop performance
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: [
          // Skip audits that aren't relevant for our use case
          'canonical', // We handle canonical URLs
          'robots-txt', // We have dynamic robots.txt
          'is-crawlable', // Auth pages shouldn't be crawlable
        ]
      }
    },

    assert: {
      // Performance thresholds - strict for enterprise standards
      assertions: {
        // Core Web Vitals thresholds
        'categories:performance': ['error', { minScore: 0.9 }], // 90+ performance score
        'categories:accessibility': ['error', { minScore: 0.95 }], // 95+ accessibility score
        'categories:best-practices': ['error', { minScore: 0.9 }], // 90+ best practices score
        'categories:seo': ['error', { minScore: 0.9 }], // 90+ SEO score

        // Specific metrics thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }], // < 1.5s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // < 2.5s
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }], // < 2s
        'speed-index': ['error', { maxNumericValue: 3000 }], // < 3s
        'interactive': ['error', { maxNumericValue: 3500 }], // < 3.5s
        'max-potential-fid': ['error', { maxNumericValue: 130 }], // < 130ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // < 0.1
        'total-blocking-time': ['error', { maxNumericValue: 300 }], // < 300ms

        // Resource optimization
        'unused-css-rules': ['error', { maxNumericValue: 50000 }], // < 50KB unused CSS
        'unused-javascript': ['error', { maxNumericValue: 100000 }], // < 100KB unused JS
        'modern-image-formats': ['error', { minScore: 0.8 }], // Use modern formats
        'uses-responsive-images': ['error', { minScore: 0.8 }], // Responsive images
        'efficient-animated-content': ['error', { minScore: 0.8 }], // Efficient animations

        // Security and best practices
        'uses-https': ['error', { minScore: 1 }], // HTTPS required
        'is-on-https': ['error', { minScore: 1 }], // HTTPS required
        'uses-http2': ['error', { minScore: 0.8 }], // HTTP/2 preferred
        'no-vulnerable-libraries': ['error', { minScore: 1 }], // No vulnerable deps

        // SEO requirements
        'meta-description': ['error', { minScore: 1 }], // Meta descriptions required
        'document-title': ['error', { minScore: 1 }], // Page titles required
        'structured-data': ['error', { minScore: 0.8 }], // Structured data preferred
      }
    },

    upload: {
      // Upload results to Lighthouse CI server or temporary storage
      target: 'temporary-public-storage',

      // Alternative: Upload to your own LHCI server
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },

    server: {
      // LHCI server configuration (if self-hosting)
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    }
  }
};
