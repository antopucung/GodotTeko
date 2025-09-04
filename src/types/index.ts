// Base types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
  slug?: string
}

// User and Authentication types
export interface User extends BaseEntity {
  email: string
  name: string
  avatar?: string
  role: UserRole
  isVerified: boolean
}



export interface SocialLinks {
  dribbble?: string
  behance?: string
  instagram?: string
  twitter?: string
  linkedin?: string
}

export type UserRole = 'user' | 'admin' | 'vendor' | 'partner'

// Product types
export interface Product extends BaseEntity {
  title: string
  description: string
  shortDescription?: string
  price: number
  salePrice?: number
  originalPrice?: number
  currency: string
  images: ProductImage[]
  tags: Tag[]
  categories: Category[]
  author: Author | null
  stats: ProductStats
  status: ProductStatus
  featured: boolean
  freebie: boolean
  preview?: string
  demoUrl?: string
  compatibleWith: string[]
  fileTypes: string[]
  fileSize?: string
  lastUpdated?: string
  version?: string
  license: LicenseType
  seoMeta?: SEOMeta
}

export interface ProductImage {
  id: string
  url: string
  alt: string
  width: number
  height: number
  isPrimary: boolean
}



export interface ProductStats {
  views: number
  downloads: number
  likes: number
  rating: number
  reviews: number
  reviewsCount: number
}

export type ProductStatus = 'draft' | 'published' | 'archived' | 'pending'
export type LicenseType = 'standard' | 'extended' | 'free' | 'custom'

// Category and Tag types
export interface Category extends BaseEntity {
  name: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  children?: Category[]
  productCount: number
  isActive: boolean
  order: number
  seoMeta?: SEOMeta
}

export interface Tag extends BaseEntity {
  name: string
  color?: string
  productCount: number
}

// Author/Vendor types
export interface Author extends BaseEntity {
  name: string
  avatar?: string
  bio?: string
  website?: string
  socialLinks?: SocialLinks
  stats: AuthorStats
  isVerified: boolean
  isFeatured: boolean
  productsCount: number
  badges?: AuthorBadge[]
}

export interface AuthorStats {
  totalSales: number
  totalEarnings: number
  averageRating: number
  followers: number
}

export interface AuthorBadge {
  id: string
  name: string
  icon: string
  color: string
  description?: string
}

// Cart types
export interface CartItem {
  productId: string
  product: Product
  quantity: number
  price: number
}



// Search and Filter types
export interface SearchFilters {
  query?: string
  categories?: string[]
  tags?: string[]
  priceRange?: [number, number]
  sortBy?: SortOption
  author?: string
  featured?: boolean
  freebie?: boolean
  // Enhanced filtering options
  fileTypes?: string[]
  compatibleWith?: string[]
  minRating?: number
  dateRange?: [string, string] // [startDate, endDate]
  licenseType?: LicenseType
  status?: ProductStatus
}

export type SortOption =
  | 'relevance'
  | 'newest'
  | 'oldest'
  | 'popular'
  | 'price_low'
  | 'price_high'
  | 'rating'
  | 'trending'
  | 'alphabetical'
  | 'downloads'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  searchPerformed?: boolean
  fallback?: boolean
  error?: string
  cached?: boolean
  cacheTimestamp?: number
  performance?: {
    resultsFound: number
    searchQuery?: string
    filtersApplied: number
  }
}

export interface SearchResult<T> {
  data: T[]
  meta: PaginationMeta
  filters?: SearchFilters
}

// FAQ types
export interface FAQ extends BaseEntity {
  question: string
  answer: string
  category?: string
  order: number
  isActive: boolean
}

// Analytics types
export interface Analytics {
  pageViews: AnalyticsData[]
  productViews: AnalyticsData[]
  sales: AnalyticsData[]
  revenue: AnalyticsData[]
  users: AnalyticsData[]
}

export interface AnalyticsData {
  date: string
  value: number
  label?: string
}

// SEO types
export interface SEOMeta {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  canonicalUrl?: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface ApiError {
  message: string
  code?: string
  field?: string
}

// Component Props types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Theme types
export interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

// Form types
export interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

export interface AuthorApplicationForm {
  email: string
  fullName: string
  portfolioLink: string
  additionalInfo?: string
}

export interface NewsletterForm {
  email: string
}

// Sanity.io integration types
export interface SanityDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
}

export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  alt?: string
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}
