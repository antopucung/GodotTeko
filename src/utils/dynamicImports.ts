'use client'

import dynamic from 'next/dynamic'
import { ComponentType, ReactNode, createElement } from 'react'

// Higher-order function for creating dynamic imports with better defaults
export function createDynamicImport<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: () => ReactNode
    error?: ComponentType<{ error: Error; retry: () => void }>
    ssr?: boolean
  } = {}
) {
  const {
    loading,
    error,
    ssr = false
  } = options

  return dynamic(importFn, {
    loading: loading ? ({ isLoading, error: loadingError }) => loading() : undefined,
    ssr
  })
}

// Simple loading component
const DefaultLoadingComponent = () =>
  createElement('div', {
    className: 'animate-pulse bg-gray-200 rounded h-32'
  })

// Pre-configured dynamic imports for common components

// Admin components (heavy, load on demand)
export const DynamicAdminDashboard = createDynamicImport(
  () => import('@/app/admin/page'),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicUserManagement = createDynamicImport(
  () => import('@/app/admin/users/page'),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicReviewModeration = createDynamicImport(
  () => import('@/app/admin/reviews/page'),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicAnalyticsDashboard = createDynamicImport(
  () => import('@/app/admin/analytics/page'),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

// User dashboard components
export const DynamicUserDashboard = createDynamicImport(
  () => import('@/app/user/dashboard/page'),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicLicensesTab = createDynamicImport(
  () => import('@/components/dashboard/LicensesTab').then(mod => ({ default: mod.LicensesTab })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicAccessPassTab = createDynamicImport(
  () => import('@/components/dashboard/AccessPassTab').then(mod => ({ default: mod.AccessPassTab })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicOrdersTab = createDynamicImport(
  () => import('@/components/dashboard/OrdersTab').then(mod => ({ default: mod.OrdersTab })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicSettingsTab = createDynamicImport(
  () => import('@/components/dashboard/SettingsTab').then(mod => ({ default: mod.SettingsTab })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicPartnerTab = createDynamicImport(
  () => import('@/components/dashboard/PartnerTab').then(mod => ({ default: mod.PartnerTab })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

// Heavy UI components - these need to be checked if they are default exports
export const DynamicProductReviews = createDynamicImport(
  () => import('@/components/ProductReviews').then(mod => ({ default: (mod as any).ProductReviews || (mod as any).default })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicPersonalizedRecommendations = createDynamicImport(
  () => import('@/components/PersonalizedRecommendations').then(mod => ({ default: (mod as any).PersonalizedRecommendations || (mod as any).default })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicRecentlyViewedProducts = createDynamicImport(
  () => import('@/components/RecentlyViewedProducts').then(mod => ({ default: (mod as any).RecentlyViewedProducts || (mod as any).default })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

// Modal and dialog components
export const DynamicKeyboardShortcuts = createDynamicImport(
  () => import('@/components/KeyboardShortcuts').then(mod => ({ default: mod.KeyboardShortcutsModal })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

export const DynamicCommandPalette = createDynamicImport(
  () => import('@/components/KeyboardShortcuts').then(mod => ({ default: mod.CommandPalette })),
  {
    ssr: false,
    loading: DefaultLoadingComponent
  }
)

// Utility functions for dynamic loading

// Preload a component
export function preloadComponent(componentImport: () => Promise<any>) {
  // Preload the component in the background
  componentImport().catch(() => {
    // Silently fail if preload doesn't work
  })
}

// Conditionally load components based on user role
export function loadByRole(userRole: string) {
  switch (userRole) {
    case 'admin':
      preloadComponent(() => import('@/app/admin/page'))
      preloadComponent(() => import('@/app/admin/users/page'))
      preloadComponent(() => import('@/app/admin/reviews/page'))
      break
    case 'partner':
      preloadComponent(() => import('@/components/dashboard/PartnerTab'))
      break
    default:
      // Preload common user components
      preloadComponent(() => import('@/app/user/dashboard/page'))
      break
  }
}

// Load components based on route
export function preloadByRoute(pathname: string) {
  if (pathname.startsWith('/admin')) {
    preloadComponent(() => import('@/app/admin/page'))
  } else if (pathname.startsWith('/user')) {
    preloadComponent(() => import('@/app/user/dashboard/page'))
  } else if (pathname.startsWith('/products/')) {
    preloadComponent(() => import('@/components/ProductReviews'))
    preloadComponent(() => import('@/components/PersonalizedRecommendations'))
  }
}

// Bundle splitting utilities

// Lazy load heavy utilities
export const lazyLoadUtils = {
  // Date utilities
  dateFns: () => import('date-fns'),

  // Form validation
  zod: () => import('zod'),

  // Animation libraries (if any)
  framerMotion: () => import('framer-motion').catch(() => null),

  // Chart libraries (if any)
  recharts: () => import('recharts'),

  // File processing utilities (currently not installed)
  // fileUtils: () => import('file-saver').catch(() => null)
}

// Progressive enhancement utilities
export function withProgressiveEnhancement<T extends Record<string, any>>(
  component: ComponentType<T>,
  fallback: ComponentType<T>
) {
  return function ProgressiveComponent(props: T) {
    // Use the enhanced component if JavaScript is enabled
    // Fall back to basic component otherwise
    if (typeof window !== 'undefined') {
      return createElement(component, props)
    }
    return createElement(fallback, props)
  }
}

// Performance monitoring for dynamic imports
export function measureImportPerformance(importName: string) {
  return async function<T>(importFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()

    try {
      const result = await importFn()
      const endTime = performance.now()

      console.log(`Dynamic import "${importName}" took ${endTime - startTime}ms`)

      // Send to analytics if needed
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'dynamic_import', {
          import_name: importName,
          load_time: endTime - startTime
        })
      }

      return result
    } catch (error) {
      console.error(`Dynamic import "${importName}" failed:`, error)
      throw error
    }
  }
}

// Code splitting strategy configuration
export const CODE_SPLITTING_CONFIG = {
  // Routes that should be code split
  splitRoutes: [
    '/admin',
    '/user/dashboard',
    '/products/[slug]',
    '/checkout',
    '/settings'
  ],

  // Components that should be lazy loaded
  lazyComponents: [
    'ProductReviews',
    'PersonalizedRecommendations',
    'AdminDashboard',
    'UserDashboard',
    'AnalyticsCharts'
  ],

  // Utilities that should be loaded on demand
  lazyUtils: [
    'date-fns',
    'zod',
    'recharts'
  ],

  // Preload strategies
  preloadStrategies: {
    onHover: ['ProductCard', 'CategoryCard'],
    onVisible: ['RecentlyViewedProducts', 'PersonalizedRecommendations'],
    onIdle: ['KeyboardShortcuts', 'CommandPalette'],
    onRouteChange: ['AdminComponents', 'UserComponents']
  }
}

// Export all dynamic components for easy access
export const DynamicComponents = {
  // Admin
  AdminDashboard: DynamicAdminDashboard,
  UserManagement: DynamicUserManagement,
  ReviewModeration: DynamicReviewModeration,
  AnalyticsDashboard: DynamicAnalyticsDashboard,

  // User
  UserDashboard: DynamicUserDashboard,
  LicensesTab: DynamicLicensesTab,
  AccessPassTab: DynamicAccessPassTab,
  OrdersTab: DynamicOrdersTab,
  SettingsTab: DynamicSettingsTab,
  PartnerTab: DynamicPartnerTab,

  // Features
  ProductReviews: DynamicProductReviews,
  PersonalizedRecommendations: DynamicPersonalizedRecommendations,
  RecentlyViewedProducts: DynamicRecentlyViewedProducts,

  // UI
  KeyboardShortcuts: DynamicKeyboardShortcuts,
  CommandPalette: DynamicCommandPalette
}
