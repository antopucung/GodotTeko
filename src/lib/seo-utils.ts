import { Metadata } from 'next'

interface ProductSEO {
  _id: string
  title: string
  description?: string
  price: number
  salePrice?: number
  images?: Array<{ asset: { url: string } }>
  category?: { title: string; slug: { current: string } }
  author?: { name: string }
  stats?: { likes?: number; rating?: number; reviewsCount?: number }
  freebie: boolean
  slug: { current: string }
  _createdAt: string
  _updatedAt: string
}

interface CategorySEO {
  title: string
  description?: string
  slug: { current: string }
  productCount?: number
}

export class SEOUtils {
  private static baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'

  // Generate product structured data
  static generateProductStructuredData(product: ProductSEO) {
    const price = product.salePrice || product.price
    const currency = 'USD'

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description || `${product.title} - Premium design resource from Godot Tekko marketplace`,
      image: product.images?.[0]?.asset?.url || '',
      url: `${this.baseUrl}/products/${product.slug.current}`,
      productID: product._id,
      brand: {
        '@type': 'Brand',
        name: 'Godot Tekko'
      },
      category: product.category?.title || 'Design Resources',
      offers: {
        '@type': 'Offer',
        price: product.freebie ? '0' : price.toString(),
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
        url: `${this.baseUrl}/products/${product.slug.current}`,
        seller: {
          '@type': 'Organization',
          name: product.author?.name || 'Godot Tekko'
        },
        validFrom: product._createdAt,
        ...(product.salePrice && product.salePrice !== product.price && {
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
      },
      ...(product.stats?.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.stats.rating,
          reviewCount: product.stats.reviewsCount || 1,
          worstRating: 1,
          bestRating: 5
        }
      }),
      datePublished: product._createdAt,
      dateModified: product._updatedAt,
      author: {
        '@type': 'Person',
        name: product.author?.name || 'Godot Tekko Team'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Godot Tekko',
        url: this.baseUrl
      },
      keywords: [
        product.category?.title || 'Design',
        'UI Kit',
        'Template',
        'Game Development',
        'Godot Engine',
        'Design Resources'
      ].join(', ')
    }
  }

  // Generate breadcrumb structured data
  static generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    }
  }

  // Generate category page structured data
  static generateCategoryStructuredData(category: CategorySEO) {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${category.title} - Godot Tekko`,
      description: category.description || `Browse ${category.title} design resources and templates`,
      url: `${this.baseUrl}/category/${category.slug.current}`,
      mainEntity: {
        '@type': 'ItemList',
        name: category.title,
        description: category.description,
        numberOfItems: category.productCount || 0
      },
      breadcrumb: this.generateBreadcrumbStructuredData([
        { name: 'Home', url: this.baseUrl },
        { name: 'Categories', url: `${this.baseUrl}/products/browse` },
        { name: category.title, url: `${this.baseUrl}/category/${category.slug.current}` }
      ])
    }
  }

  // Generate organization structured data
  static generateOrganizationStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Godot Tekko',
      url: this.baseUrl,
      logo: `${this.baseUrl}/og-image.jpg`,
      description: 'Premium Design & Game Development Marketplace',
      sameAs: [
        'https://github.com/godot-tekko',
        'https://twitter.com/godottekko'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@godot-tekko.com'
      },
      founder: {
        '@type': 'Person',
        name: 'Godot Tekko Team'
      }
    }
  }

  // Generate product page metadata
  static generateProductMetadata(product: ProductSEO): Metadata {
    const price = product.salePrice || product.price
    const priceText = product.freebie ? 'Free' : `$${price}`

    return {
      title: `${product.title} - ${priceText} | Godot Tekko`,
      description: product.description || `Download ${product.title} - Premium ${product.category?.title || 'design resource'} for game developers and designers. ${priceText} at Godot Tekko marketplace.`,
      keywords: [
        product.title,
        product.category?.title || 'design',
        'UI kit',
        'template',
        'game development',
        'godot engine',
        'design resources',
        product.author?.name || 'godot tekko'
      ],
      authors: [{ name: product.author?.name || 'Godot Tekko Team' }],
      creator: product.author?.name || 'Godot Tekko',
      category: product.category?.title || 'Design Resources',

      openGraph: {
        type: 'article',
        title: `${product.title} - ${priceText}`,
        description: product.description || `Premium ${product.category?.title || 'design resource'} for game developers`,
        url: `${this.baseUrl}/products/${product.slug.current}`,
        siteName: 'Godot Tekko',
        images: [
          {
            url: product.images?.[0]?.asset?.url || `${this.baseUrl}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: product.title,
          },
        ],
        locale: 'en_US',
        publishedTime: product._createdAt,
        modifiedTime: product._updatedAt,
        authors: [product.author?.name || 'Godot Tekko Team'],
        section: product.category?.title || 'Design Resources',
        tags: [
          product.category?.title || 'Design',
          'UI Kit',
          'Template',
          'Game Development'
        ],
      },

      twitter: {
        card: 'summary_large_image',
        title: `${product.title} - ${priceText}`,
        description: product.description || `Premium ${product.category?.title || 'design resource'} for game developers`,
        images: [product.images?.[0]?.asset?.url || `${this.baseUrl}/og-image.jpg`],
        creator: '@godottekko',
      },

      alternates: {
        canonical: `${this.baseUrl}/products/${product.slug.current}`,
      },

      other: {
        'product:price:amount': product.freebie ? '0' : price.toString(),
        'product:price:currency': 'USD',
        'product:availability': 'in stock',
        'product:condition': 'new',
        'product:brand': 'Godot Tekko',
        'product:category': product.category?.title || 'Design Resources',
        ...(product.stats?.rating && {
          'product:rating': product.stats.rating.toString(),
          'product:rating:scale': '5',
          'product:rating:count': (product.stats.reviewsCount || 1).toString(),
        }),
      },
    }
  }

  // Generate category page metadata
  static generateCategoryMetadata(category: CategorySEO): Metadata {
    return {
      title: `${category.title} - Design Resources | Godot Tekko`,
      description: category.description || `Browse ${category.title} design resources, UI kits, and templates for game developers. Premium ${category.title.toLowerCase()} collection at Godot Tekko marketplace.`,
      keywords: [
        category.title,
        'design resources',
        'ui kits',
        'templates',
        'game development',
        'godot engine',
        'marketplace'
      ],

      openGraph: {
        type: 'website',
        title: `${category.title} - Design Resources`,
        description: category.description || `Browse premium ${category.title.toLowerCase()} for game developers`,
        url: `${this.baseUrl}/category/${category.slug.current}`,
        siteName: 'Godot Tekko',
        images: [
          {
            url: `${this.baseUrl}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: `${category.title} - Godot Tekko`,
          },
        ],
      },

      twitter: {
        card: 'summary_large_image',
        title: `${category.title} - Design Resources`,
        description: category.description || `Browse premium ${category.title.toLowerCase()} for game developers`,
        images: [`${this.baseUrl}/og-image.jpg`],
      },

      alternates: {
        canonical: `${this.baseUrl}/category/${category.slug.current}`,
      },
    }
  }

  // Generate FAQ structured data
  static generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }
  }

  // Generate review structured data
  static generateReviewStructuredData(reviews: Array<{
    author: string
    rating: number
    reviewBody: string
    datePublished: string
  }>, product: ProductSEO) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      review: reviews.map(review => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          worstRating: 1,
          bestRating: 5
        },
        reviewBody: review.reviewBody,
        datePublished: review.datePublished
      })),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
        reviewCount: reviews.length,
        worstRating: 1,
        bestRating: 5
      }
    }
  }

  // Generate blog article structured data (for learning content)
  static generateArticleStructuredData(article: {
    title: string
    description: string
    content: string
    author: string
    datePublished: string
    dateModified: string
    slug: string
    category?: string
    image?: string
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      image: article.image || `${this.baseUrl}/og-image.jpg`,
      author: {
        '@type': 'Person',
        name: article.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'Godot Tekko',
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/og-image.jpg`
        }
      },
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${this.baseUrl}/learn/${article.slug}`
      },
      articleSection: article.category || 'Game Development',
      wordCount: article.content.split(' ').length,
      articleBody: article.content
    }
  }

  // Generate course structured data
  static generateCourseStructuredData(course: {
    title: string
    description: string
    instructor: string
    duration: string
    price: number
    rating?: number
    reviewCount?: number
    slug: string
    skills: string[]
    level: string
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: course.description,
      provider: {
        '@type': 'Organization',
        name: 'Godot Tekko'
      },
      instructor: {
        '@type': 'Person',
        name: course.instructor
      },
      offers: {
        '@type': 'Offer',
        price: course.price.toString(),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      },
      courseCode: course.slug,
      educationalLevel: course.level,
      teaches: course.skills,
      timeRequired: course.duration,
      url: `${this.baseUrl}/learn/courses/${course.slug}`,
      ...(course.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: course.rating,
          reviewCount: course.reviewCount || 1,
          worstRating: 1,
          bestRating: 5
        }
      })
    }
  }
}
