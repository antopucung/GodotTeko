import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'

interface Product {
  slug: { current: string }
  _updatedAt: string
}

interface Category {
  slug: { current: string }
  _updatedAt: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/products/browse`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/play-station`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/all-access`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/become-partner`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  try {
    // Fetch products
    const products: Product[] = await client.fetch(`
      *[_type == "product" && defined(slug.current)] {
        slug,
        _updatedAt
      }
    `)

    // Fetch categories
    const categories: Category[] = await client.fetch(`
      *[_type == "category" && defined(slug.current)] {
        slug,
        _updatedAt
      }
    `)

    // Generate product pages
    const productPages = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug.current}`,
      lastModified: new Date(product._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Generate category pages
    const categoryPages = categories.map((category) => ({
      url: `${baseUrl}/category/${category.slug.current}`,
      lastModified: new Date(category._updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...categoryPages, ...productPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if dynamic generation fails
    return staticPages
  }
}
