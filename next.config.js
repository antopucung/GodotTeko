/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    domains: [
      'cdn.sanity.io',
      'images.unsplash.com',
      'via.placeholder.com',
      'same-assets.com',
      'github.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        // Cache static assets
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // Cache API responses
        source: '/api/site-configuration',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600'
          }
        ]
      },
      {
        // Cache subscription plans
        source: '/api/subscription-plans',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=600, s-maxage=1200'
          }
        ]
      },
      {
        // Cache product data
        source: '/api/products',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600'
          }
        ]
      }
    ]
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: isServer ? 8888 : 8889,
            openAnalyzer: true
          })
        )
      }
      return config
    }
  }),

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 200000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
            },
            // Framework chunks
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true
            },
            // UI Library chunks
            ui: {
              name: 'ui-libs',
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|sonner)[\\/]/,
              chunks: 'all',
              priority: 30
            },
            // Auth and API chunks
            auth: {
              name: 'auth-libs',
              test: /[\\/]node_modules[\\/](next-auth|@auth)[\\/]/,
              chunks: 'all',
              priority: 25
            },
            // CMS and data chunks
            cms: {
              name: 'cms-libs',
              test: /[\\/]node_modules[\\/](@sanity|groq)[\\/]/,
              chunks: 'all',
              priority: 25
            },
            // Payment processing chunks
            payment: {
              name: 'payment-libs',
              test: /[\\/]node_modules[\\/](stripe|@stripe)[\\/]/,
              chunks: 'all',
              priority: 25
            },
            // Utility libraries
            utils: {
              name: 'utils-libs',
              test: /[\\/]node_modules[\\/](date-fns|clsx|class-variance-authority)[\\/]/,
              chunks: 'all',
              priority: 20
            },
            // Large vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
              maxSize: 150000
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              priority: -15
            }
          }
        },
        // Advanced optimizations
        usedExports: true,
        sideEffects: false,
        concatenateModules: true,
        flagIncludedChunks: true,
        occurrenceOrder: true,
        providedExports: true,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true
      }

      // CSS optimization
      config.optimization.minimizer = config.optimization.minimizer || []

      // Add source map optimization for better debugging
      if (process.env.NODE_ENV === 'production') {
        config.devtool = 'source-map'
      }
    }

    // Bundle analysis in development
    if (dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true
        })
      )
    }

    return config
  },

  // Experimental features for performance
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    },
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'sonner',
      'next-auth',
      '@sanity/client',
      'stripe'
    ],
    serverComponentsExternalPackages: ['sharp']
  },

  // Static export configuration (for CDN)
  // trailingSlash: true, // Disabled for Netlify compatibility

  // Environment variables
  env: {
    SITE_URL: process.env.SITE_URL || 'https://godot-tekko.com',
    CDN_URL: process.env.CDN_URL || ''
  },

  // Redirects for SEO and performance
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      },
      {
        source: '/dashboard',
        destination: '/user/dashboard',
        permanent: false
      }
    ]
  },

  // API routes optimization
  async rewrites() {
    return [
      {
        source: '/api-cache/:path*',
        destination: '/api/:path*'
      }
    ]
  }
}

export default nextConfig
