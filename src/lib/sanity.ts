import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// Sanity client configuration with enhanced error handling and CORS support
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
  token: process.env.SANITY_API_READ_TOKEN,
  perspective: 'published',
  ignoreBrowserTokenWarning: true,
  // Add timeout and retry logic
  timeout: 10000,
  // Ensure proper CORS handling
  withCredentials: false,
  requestTagPrefix: 'ui8-clone'
})

// Image URL builder
export const urlFor = (source: any) => {
  if (!source?.asset?._ref && !source?.asset?.url && !source?._ref) {
    return null
  }

  try {
    const builder = imageUrlBuilder(client)
    return builder.image(source)
  } catch (error) {
    console.error('Error building image URL:', error)
    return null
  }
}

// Enhanced client with retry logic for CORS issues
export const sanityFetch = async (query: string, params?: any, options?: any) => {
  const maxRetries = 3
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout and better error handling
      const result = await client.fetch(query, params, {
        cache: 'force-cache',
        next: { revalidate: 3600 }, // 1 hour cache
        ...options
      })
      return result
    } catch (error: any) {
      console.error(`Sanity fetch attempt ${attempt} failed:`, error)
      lastError = error

      // Check if it's a CORS error and provide helpful message
      if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
        console.error(`
🚨 CORS Error detected!
📍 This usually happens when:
   1. Sanity project CORS settings need to be updated
   2. The domain needs to be added to Sanity's allowed origins
   3. Environment variables are misconfigured

🛠️  Quick fix:
   1. Go to https://manage.sanity.io/
   2. Select your project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
   3. Go to Settings > API
   4. Add these origins:
      - https://3000-nchbdszhmdfoalqmsrxqsmoyykpmsmus.preview.same-app.com
      - http://localhost:3000
      - https://localhost:3000
   5. Save the settings

🔧 Environment check:
   - Project ID: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
   - Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}
   - API Token: ${process.env.SANITY_API_READ_TOKEN ? 'Present' : 'Missing'}
        `)
      }

      // Don't retry on certain errors
      if (error.statusCode === 404 || error.statusCode === 403) {
        throw error
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  throw lastError
}

// Alternative client configuration for development
export const devClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false, // Always fetch fresh data in development
  token: process.env.SANITY_API_READ_TOKEN, // Fixed to match env variable
  perspective: 'published',
  ignoreBrowserTokenWarning: true
})

// Health check function
export const checkSanityConnection = async () => {
  try {
    const result = await client.fetch('*[_type == "sanity.imageAsset"][0]{_id}')
    return {
      status: 'connected',
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      result
    }
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET
    }
  }
}

// Placeholder for queries (to maintain compatibility with existing imports)
export const queries = {
  products: `*[_type == "product"] {
    _id,
    title,
    slug,
    price,
    salePrice,
    images,
    featured,
    freebie,
    description,
    categories,
    author,
    stats
  }`,
  product: `*[_type == "product" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    price,
    salePrice,
    images,
    featured,
    freebie,
    description,
    categories,
    author,
    stats
  }`,
  productsByCategory: `*[_type == "product" && category->slug.current == $categorySlug] {
    _id,
    title,
    slug,
    price,
    salePrice,
    images,
    featured,
    freebie,
    description,
    categories,
    author,
    stats
  }`,
  featuredProducts: `*[_type == "product" && featured == true] {
    _id,
    title,
    slug,
    price,
    salePrice,
    images,
    featured,
    freebie,
    description,
    categories,
    author,
    stats
  }`,
  categories: `*[_type == "category"] {
    _id,
    name,
    slug,
    description,
    productCount
  }`,
  category: `*[_type == "category" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    productCount
  }`,
  authors: `*[_type == "author"] {
    _id,
    name,
    slug,
    bio,
    avatar
  }`,
  author: `*[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    bio,
    avatar
  }`,
  siteSettings: `*[_type == "siteSettings"][0] {
    _id,
    siteName,
    siteDescription,
    logo,
    heroTitle,
    heroSubtitle
  }`
}

// Placeholder transform function (to maintain compatibility)
export const transformSanityProduct = (product: any) => {
  return {
    id: product._id,
    title: product.title,
    slug: product.slug?.current || '',
    price: product.price || 0,
    salePrice: product.salePrice,
    images: product.images || [],
    featured: product.featured || false,
    freebie: product.freebie || false,
    description: product.description || '',
    categories: product.categories || [],
    author: product.author,
    stats: product.stats || {},
    createdAt: product._createdAt,
    updatedAt: product._updatedAt
  }
}
