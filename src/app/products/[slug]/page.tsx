import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { client } from '@/lib/sanity'
import { SEOUtils } from '@/lib/seo-utils'
import ProductPageClient from './ProductPageClient'

interface Product {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  price: number
  salePrice?: number
  images?: Array<{ asset: { url: string } }>
  category?: { title: string; slug: { current: string } }
  author?: { name: string; slug?: { current: string } }
  stats?: { likes?: number; rating?: number; reviewsCount?: number }
  freebie: boolean
  _createdAt: string
  _updatedAt: string
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const product = await client.fetch(
      `*[_type == "product" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        description,
        price,
        salePrice,
        "images": images[] {
          asset-> {
            url
          }
        },
        "category": category-> {
          title,
          slug
        },
        "author": author-> {
          name,
          slug
        },
        stats {
          likes,
          rating,
          reviewsCount
        },
        freebie,
        _createdAt,
        _updatedAt
      }`,
      { slug }
    )
    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await getProduct(params.slug)

  if (!product) {
    return {
      title: 'Product Not Found | Godot Tekko',
      description: 'The requested product could not be found.',
    }
  }

  return SEOUtils.generateProductMetadata(product)
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  // Generate structured data
  const productStructuredData = SEOUtils.generateProductStructuredData(product)

  // Generate breadcrumb structured data
  const breadcrumbStructuredData = SEOUtils.generateBreadcrumbStructuredData([
    { name: 'Home', url: process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app' },
    { name: 'Products', url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'}/products/browse` },
    ...(product.category ? [{
      name: product.category.title,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'}/category/${product.category.slug.current}`
    }] : []),
    { name: product.title, url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'}/products/${product.slug.current}` }
  ])

  return (
    <>
      {/* Enhanced Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />

      {/* Critical product image preload */}
      {product.images?.[0] && (
        <link
          rel="preload"
          href={product.images[0].asset.url}
          as="image"
        />
      )}

      {/* Product page content */}
      <ProductPageClient product={product} />
    </>
  )
}

// Generate static params for better performance
export async function generateStaticParams() {
  try {
    const products = await client.fetch(
      `*[_type == "product" && defined(slug.current)] {
        slug
      }[0...100]` // Limit to first 100 for build performance
    )

    return products.map((product: { slug: { current: string } }) => ({
      slug: product.slug.current,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}
