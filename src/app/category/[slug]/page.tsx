import { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { SEOUtils } from '@/lib/seo-utils'
import CategoryPageClient from "@/components/CategoryPageClient";

interface Category {
  title: string
  description?: string
  slug: { current: string }
  productCount?: number
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const category = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0] {
        title,
        description,
        slug,
        "productCount": count(*[_type == "product" && category._ref == ^._id])
      }`,
      { slug }
    )
    return category
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const category = await getCategory(resolvedParams.slug)

  if (!category) {
    return {
      title: 'Category Not Found | Godot Tekko',
      description: 'The requested category could not be found.',
    }
  }

  return SEOUtils.generateCategoryMetadata(category)
}

export async function generateStaticParams() {
  try {
    // Fetch real categories from Sanity
    const categories = await client.fetch(
      `*[_type == "category" && defined(slug.current)] {
        slug
      }`
    )

    // Combine with fallback categories for compatibility
    const fallbackCategories = [
      // Main Content Types
      { slug: 'assets' },
      { slug: 'games' },
      { slug: 'tools' },
      { slug: 'starter-kits' },

      // Asset Formats
      { slug: '2d-graphics' },
      { slug: '3d-models' },
      { slug: 'user-interface' },
      { slug: 'audio' },
      { slug: 'pixel-art' },
      { slug: 'textures' },

      // Collections
      { slug: 'city-collection' },
      { slug: 'retro-collection' },
      { slug: 'character-collection' },
      { slug: 'vehicle-collection' },

      // Legacy categories (for compatibility)
      { slug: '3d-assets' },
      { slug: 'ui-kits' },
      { slug: 'coded-templates' },
      { slug: 'illustrations' },
      { slug: 'icons' },
      { slug: 'mockups' },
      { slug: 'fonts' },
      { slug: 'wireframes' },
      { slug: 'presentation' },
      { slug: 'themes' },
      { slug: 'freebies' },
      { slug: 'no-code' }
    ]

    // Merge real categories with fallbacks
    const realCategories = categories?.map((cat: any) => ({ slug: cat.slug.current })) || []
    const allCategories = [...realCategories, ...fallbackCategories]

    // Remove duplicates
    const uniqueCategories = allCategories.filter((cat, index, self) =>
      index === self.findIndex(c => c.slug === cat.slug)
    )

    return uniqueCategories
  } catch (error) {
    console.error('Error generating static params:', error);
    // Fallback to basic params
    return [
      { slug: 'assets' },
      { slug: 'games' },
      { slug: 'tools' }
    ];
  }
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const category = await getCategory(resolvedParams.slug)

  // Generate structured data if category exists
  const categoryStructuredData = category ? SEOUtils.generateCategoryStructuredData(category) : null

  return (
    <>
      {/* Category Structured Data */}
      {categoryStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(categoryStructuredData)
          }}
        />
      )}

      <CategoryPageClient slug={resolvedParams.slug} />
    </>
  );
}
