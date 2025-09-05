import {
  Product,
  Category,
  Author,
  FAQ,
  SearchFilters,
  SearchResult,
  ApiResponse,
  AuthorApplicationForm,
  NewsletterForm,
  ContactForm,
  SocialLinks
} from '@/types'
import { METRICS } from '@/config/constants'

// Import Sanity client and queries
import { client, queries, transformSanityProduct } from '@/lib/sanity'

// Import mock data for fallback
import {
  getProducts,
  getProductById,
  getCategories,
  getFAQs,
  getAuthors
} from '@/data/mock-data'

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// Add interfaces for Sanity data types
interface SanityCategory {
  _id: string
  name: string
  slug: { current: string }
  description?: string
  icon?: string
  color?: string
  productCount?: number
  isActive?: boolean
  order?: number
  _createdAt: string
  _updatedAt: string
}

interface SanityAuthor {
  _id: string
  name: string
  slug: { current: string }
  bio?: string
  avatar?: { asset?: { url?: string } }
  website?: string
  socialLinks?: Record<string, string>
  isVerified?: boolean
  isFeatured?: boolean
  productsCount?: number
  stats?: {
    totalSales?: number
    totalEarnings?: number
    averageRating?: number
    followers?: number
  }
  _createdAt: string
  _updatedAt: string
}

interface SanityFAQ {
  _id: string
  _createdAt: string
  _updatedAt: string
  question: string
  answer: string
  category: string
  order?: number
  isActive?: boolean
}

// Generic API request function for non-Sanity endpoints
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
}

// Sanity data transformation helpers
const transformSanityCategory = (sanityCategory: SanityCategory): Category => {
  return {
    id: sanityCategory._id,
    name: sanityCategory.name,
    slug: sanityCategory.slug?.current || '',
    description: sanityCategory.description || '',
    icon: sanityCategory.icon,
    color: sanityCategory.color,
    productCount: sanityCategory.productCount || 0,
    isActive: sanityCategory.isActive !== false,
    order: sanityCategory.order || 0,
    createdAt: sanityCategory._createdAt,
    updatedAt: sanityCategory._updatedAt
  }
}

const transformSanityAuthor = (sanityAuthor: SanityAuthor): Author => {
  return {
    id: sanityAuthor._id,
    name: sanityAuthor.name,
    slug: sanityAuthor.slug?.current || '',
    bio: sanityAuthor.bio || '',
    avatar: sanityAuthor.avatar?.asset?.url,
    website: sanityAuthor.website,
    socialLinks: sanityAuthor.socialLinks as SocialLinks,
    isVerified: sanityAuthor.isVerified || false,
    isFeatured: sanityAuthor.isFeatured || false,
    productsCount: sanityAuthor.productsCount || 0,
    stats: {
      totalSales: sanityAuthor.stats?.totalSales || 0,
      totalEarnings: sanityAuthor.stats?.totalEarnings || 0,
      averageRating: sanityAuthor.stats?.averageRating || 0,
      followers: sanityAuthor.stats?.followers || 0
    },
    createdAt: sanityAuthor._createdAt,
    updatedAt: sanityAuthor._updatedAt
  }
}

// Product API
export const productAPI = {
  // Get all products with optional filters
  getAll: async (filters?: SearchFilters): Promise<SearchResult<Product>> => {
    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (filters?.query) params.append('query', filters.query)
      if (filters?.categories?.length) params.append('categories', filters.categories.join(','))
      if (filters?.sortBy) params.append('sortBy', filters.sortBy)
      if (filters?.featured !== undefined) params.append('featured', filters.featured.toString())
      if (filters?.freebie !== undefined) params.append('freebie', filters.freebie.toString())
      if (filters?.author) params.append('author', filters.author)
      if (filters?.priceRange) {
        params.append('priceMin', filters.priceRange[0].toString())
        params.append('priceMax', filters.priceRange[1].toString())
      }

      const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`
      console.log('Fetching products from API route:', url)

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching products from API route:', error)
      // Fallback to mock data
      const products = await getProducts()
      return {
        data: products,
        meta: {
          page: 1,
          limit: products.length,
          total: products.length,
          totalPages: 1
        }
      }
    }
  },

  // Get single product by ID or slug
  getById: async (id: string): Promise<Product | null> => {
    try {
      console.log('Fetching product from API route:', `/api/products/${id}`)
      const response = await fetch(`/api/products/${id}`)

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching product from API route:', error)
      return await getProductById(id)
    }
  },

  // Get products by category
  getByCategory: async (categorySlug: string, filters?: SearchFilters): Promise<SearchResult<Product>> => {
    if (USE_MOCK_DATA) {
      const products = await getProducts()
      const filteredProducts = products.filter((p: Product) =>
        p.categories.some((c) => c.slug === categorySlug)
      )
      return {
        data: filteredProducts,
        meta: {
          page: 1,
          limit: filteredProducts.length,
          total: filteredProducts.length,
          totalPages: 1
        }
      }
    }

    try {
      const sanityProducts = await client.fetch(queries.productsByCategory, { categorySlug })
      const products = sanityProducts.map(transformSanityProduct)

      return {
        data: products,
        meta: {
          page: 1,
          limit: products.length,
          total: products.length,
          totalPages: 1
        }
      }
    } catch (error) {
      console.error('Error fetching products by category from Sanity:', error)
      return productAPI.getAll({ ...filters, categories: [categorySlug] })
    }
  },

  // Get featured products
  getFeatured: async (limit?: number): Promise<Product[]> => {
    if (USE_MOCK_DATA) {
      const products = await getProducts()
      return products.filter(p => p.featured).slice(0, limit)
    }

    try {
      let query = queries.featuredProducts
      if (limit) {
        query += `[0...${limit}]`
      }

      const sanityProducts = await client.fetch(query)
      return sanityProducts.map(transformSanityProduct)
    } catch (error) {
      console.error('Error fetching featured products from Sanity:', error)
      const products = await getProducts()
      return products.filter(p => p.featured).slice(0, limit)
    }
  }
}

// Category API
export const categoryAPI = {
  getAll: async (): Promise<Category[]> => {
    try {
      console.log('Fetching categories from API route')
      const response = await fetch('/api/categories')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching categories from API route:', error)
      return await getCategories()
    }
  },

  getBySlug: async (slug: string): Promise<Category | null> => {
    if (USE_MOCK_DATA) {
      const categories = await getCategories()
      return categories.find(c => c.slug === slug) || null
    }

    try {
      const sanityCategory = await client.fetch(queries.category, { slug })
      return sanityCategory ? transformSanityCategory(sanityCategory) : null
    } catch (error) {
      console.error('Error fetching category from Sanity:', error)
      const categories = await getCategories()
      return categories.find(c => c.slug === slug) || null
    }
  }
}

// Author API
export const authorAPI = {
  getAll: async (): Promise<Author[]> => {
    try {
      console.log('Fetching authors from API route')
      const response = await fetch('/api/authors')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching authors from API route:', error)
      return await getAuthors()
    }
  },

  getById: async (id: string): Promise<Author | null> => {
    if (USE_MOCK_DATA) {
      const authors = await getAuthors()
      return authors.find(a => a.id === id) || null
    }

    try {
      // Try to get by slug first, then by ID
      let sanityAuthor = await client.fetch(queries.author, { slug: id })

      if (!sanityAuthor) {
        sanityAuthor = await client.fetch(`*[_type == "author" && _id == $id][0]`, { id })
      }

      return sanityAuthor ? transformSanityAuthor(sanityAuthor) : null
    } catch (error) {
      console.error('Error fetching author from Sanity:', error)
      const authors = await getAuthors()
      return authors.find(a => a.id === id) || null
    }
  },

  // Submit author application
  applyToBecome: async (application: AuthorApplicationForm): Promise<boolean> => {
    try {
      // Create a new author application document in Sanity
      const doc = {
        _type: 'authorApplication',
        email: application.email,
        fullName: application.fullName,
        portfolioLink: application.portfolioLink,
        additionalInfo: application.additionalInfo,
        status: 'pending',
        submittedAt: new Date().toISOString()
      }

      await client.create(doc)
      return true
    } catch (error) {
      console.error('Error submitting author application:', error)
      return false
    }
  }
}

// FAQ API
export const faqAPI = {
  getAll: async (): Promise<FAQ[]> => {
    if (USE_MOCK_DATA) {
      return await getFAQs()
    }

    try {
      const sanityFAQs = await client.fetch(`
        *[_type == "faq" && isActive == true] | order(order asc) {
          _id,
          _createdAt,
          _updatedAt,
          question,
          answer,
          category,
          order,
          isActive
        }
      `)

      return sanityFAQs.map((faq: SanityFAQ) => ({
        id: faq._id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order || 0,
        isActive: faq.isActive !== false,
        createdAt: faq._createdAt,
        updatedAt: faq._updatedAt
      }))
    } catch (error) {
      console.error('Error fetching FAQs from Sanity:', error)
      return await getFAQs()
    }
  }
}

// Newsletter API
export const newsletterAPI = {
  subscribe: async (form: NewsletterForm): Promise<boolean> => {
    try {
      // Create a newsletter subscription document in Sanity
      const doc = {
        _type: 'newsletterSubscription',
        email: form.email,
        subscribedAt: new Date().toISOString(),
        status: 'active'
      }

      await client.create(doc)
      return true
    } catch (error) {
      console.error('Error subscribing to newsletter:', error)
      return false
    }
  }
}

// Contact API
export const contactAPI = {
  submit: async (form: ContactForm): Promise<boolean> => {
    try {
      // Create a contact form submission document in Sanity
      const doc = {
        _type: 'contactSubmission',
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        submittedAt: new Date().toISOString(),
        status: 'new'
      }

      await client.create(doc)
      return true
    } catch (error) {
      console.error('Error submitting contact form:', error)
      return false
    }
  }
}

// Search API
export const searchAPI = {
  products: async (query: string, filters?: SearchFilters): Promise<SearchResult<Product>> => {
    return productAPI.getAll({ ...filters, query })
  },

  suggestions: async (query: string): Promise<string[]> => {
    if (USE_MOCK_DATA) {
      // Mock search suggestions
      const suggestions = [
        'UI Kit', 'Mobile App', 'Dashboard', 'Landing Page', 'Icon Set',
        'Illustration', 'Mockup', 'Template', 'Design System', 'Components'
      ]
      return suggestions.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    }

    try {
      // Get suggestions from product titles and categories
      const suggestions = await client.fetch(`
        [
          ...(*[_type == "product" && title match $searchTerm].title[0...5]),
          ...(*[_type == "category" && name match $searchTerm].name[0...3])
        ]
      `, { searchTerm: `*${query}*` })

      return [...new Set(suggestions)].slice(0, 5) as string[]
    } catch (error) {
      console.error('Error fetching search suggestions:', error)
      return []
    }
  }
}

// Analytics API (for admin/vendor dashboards)
export const analyticsAPI = {
  getDashboardStats: async (): Promise<Record<string, number>> => {
    try {
      const stats = await client.fetch(`{
        "totalProducts": count(*[_type == "product"]),
        "totalCategories": count(*[_type == "category"]),
        "totalAuthors": count(*[_type == "author"]),
        "featuredProducts": count(*[_type == "product" && featured == true])
      }`)

      return {
        totalProducts: stats.totalProducts || 0,
        totalCategories: stats.totalCategories || 0,
        totalAuthors: stats.totalAuthors || 0,
        featuredProducts: stats.featuredProducts || 0,
        totalUsers: METRICS.analytics.totalUsers,
        totalSales: METRICS.analytics.totalSales,
        totalRevenue: METRICS.analytics.totalRevenue
      }
    } catch (error) {
      console.error('Error fetching analytics from Sanity:', error)
      return {
        totalProducts: METRICS.analytics.totalProducts,
        totalUsers: METRICS.analytics.totalUsers,
        totalSales: METRICS.analytics.totalSales,
        totalRevenue: METRICS.analytics.totalRevenue
      }
    }
  }
}

// File upload API
export const uploadAPI = {
  uploadFile: async (file: File, type: 'product' | 'avatar' | 'asset'): Promise<string> => {
    try {
      // Upload to Sanity assets
      const asset = await client.assets.upload('image', file, {
        filename: file.name
      })

      return asset.url
    } catch (error) {
      console.error('Error uploading file to Sanity:', error)
      throw new Error('Upload failed')
    }
  }
}

// Site settings API
export const siteAPI = {
  getSettings: async () => {
    try {
      const settings = await client.fetch(queries.siteSettings)
      return settings
    } catch (error) {
      console.error('Error fetching site settings from Sanity:', error)
      return null
    }
  }
}

// Export all APIs as a single object for easy importing
export const api = {
  products: productAPI,
  categories: categoryAPI,
  authors: authorAPI,
  faqs: faqAPI,
  newsletter: newsletterAPI,
  contact: contactAPI,
  search: searchAPI,
  analytics: analyticsAPI,
  upload: uploadAPI,
  site: siteAPI
}
