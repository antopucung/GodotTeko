// Site Configuration Constants
export const SITE_CONFIG = {
  name: 'Godot Tekko',
  title: 'Godot Tekko - Premium Design Resources & Game Assets',
  description: 'Discover thousands of high-quality design resources, game assets, Godot templates, and more.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://godottekko.com',
  company: {
    name: 'Godot Tekko Studio',
    legalName: 'Godot Tekko Ltd.',
    email: 'hello@godottekko.com',
    supportEmail: 'support@godottekko.com'
  }
} as const

// Business Metrics
export const METRICS = {
  hero: {
    totalResources: 11475,
    totalMembers: 948739,
    growthRate: 0.15 // 15% monthly growth
  },
  analytics: {
    totalProducts: 11475,
    totalUsers: 948739,
    totalSales: 125000,
    totalRevenue: 2500000,
    conversionRate: 0.034, // 3.4%
    averageOrderValue: 69
  }
} as const

// Pricing & Commerce
export const COMMERCE = {
  tax: {
    rate: 0.08, // 8% tax rate
    enabled: true
  },
  currency: {
    default: 'USD',
    symbol: '$',
    locale: 'en-US'
  },
  allAccess: {
    monthlyPrice: 19,
    yearlyPrice: 199,
    discountPercentage: 13 // Yearly saves 13%
  },
  freeThreshold: 0, // Products under this price are free
  minimumPrice: 5
} as const

// Category Configuration
export const CATEGORIES = {
  'ui-kits': {
    name: 'UI Kits',
    description: 'Complete design systems and UI components',
    icon: 'layout',
    color: '#4169E1',
    productCount: 4841
  },
  'coded-templates': {
    name: 'Coded Templates',
    description: 'Ready-to-use coded solutions',
    icon: 'code',
    color: '#10B981',
    productCount: 240
  },
  'mockups': {
    name: 'Mockups',
    description: 'Device and scene mockups',
    icon: 'smartphone',
    color: '#F59E0B',
    productCount: 726
  },
  'illustrations': {
    name: 'Illustrations',
    description: 'Vector and raster illustrations',
    icon: 'brush',
    color: '#EF4444',
    productCount: 1298
  },
  'wireframes': {
    name: 'Wireframe Kits',
    description: 'Low-fidelity wireframes and prototypes',
    icon: 'grid',
    color: '#8B5CF6',
    productCount: 189
  }
} as const

// Sample/Placeholder Data
export const PLACEHOLDERS = {
  email: 'designer@example.com',
  names: {
    user: 'Alex Designer',
    author: 'Creative Studio',
    company: 'Design Co.'
  },
  text: {
    bio: 'Tell us about yourself...',
    website: 'https://yourportfolio.com',
    location: 'San Francisco, CA',
    additionalInfo: 'Share any additional information about your work...'
  },
  passwords: {
    placeholder: 'Enter your password',
    confirm: 'Confirm your password'
  }
} as const

// File Upload & Assets
export const ASSETS = {
  defaultAvatarSize: 128,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  placeholderImages: {
    products: '/images/products/placeholder.jpg',
    avatars: '/images/avatars/default.jpg',
    heroes: '/images/backgrounds/hero-bg.jpg'
  },
  cdn: {
    baseUrl: process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.ui8.net',
    imageDomains: ['cdn.ui8.net', 'same-assets.com', 'sanity.io']
  }
} as const

// Authentication & User Roles
export const AUTH = {
  roles: {
    admin: {
      name: 'Administrator',
      permissions: ['all']
    },
    author: {
      name: 'Author',
      permissions: ['create_products', 'manage_own_products', 'view_analytics']
    },
    user: {
      name: 'Designer',
      permissions: ['purchase', 'download', 'favorite']
    }
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 1 day
  }
} as const

// Cart & Storage
export const STORAGE = {
  keys: {
    cart: 'ui8-cart',
    preferences: 'ui8-preferences',
    theme: 'ui8-theme',
    recentlyViewed: 'ui8-recent'
  },
  limits: {
    cartItems: 50,
    recentlyViewed: 20,
    wishlist: 100
  }
} as const

// API Configuration
export const API = {
  endpoints: {
    products: '/api/products',
    categories: '/api/categories',
    authors: '/api/authors',
    orders: '/api/orders',
    analytics: '/api/analytics'
  },
  timeouts: {
    default: 10000, // 10 seconds
    upload: 60000 // 60 seconds
  },
  pagination: {
    defaultLimit: 12,
    maxLimit: 100
  }
} as const

// UI/UX Constants
export const UI = {
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  colors: {
    primary: '#4169E1',
    secondary: '#3b51bf',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#161717',
    surface: '#1a1a1a'
  },
  spacing: {
    headerHeight: 64,
    sidebarWidth: 280,
    containerMaxWidth: 1280
  }
} as const

// Feature Flags
export const FEATURES = {
  search: true,
  cart: true,
  authentication: true,
  payments: true,
  analytics: true,
  socialLogin: false, // Disabled until OAuth is configured
  notifications: true,
  darkMode: false, // Single theme for now
  multiLanguage: false
} as const

// SEO & Meta
export const SEO = {
  defaultMeta: {
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    keywords: ['Godot Tekko', 'design', 'game assets', 'Godot templates', 'UI kits', 'marketplace', 'game developers'],
    ogImage: '/images/og-image.jpg',
    twitterCard: 'summary_large_image'
  },
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`
  }
} as const
