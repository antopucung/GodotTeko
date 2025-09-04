#!/usr/bin/env node

import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false
})

// Optimal category structure based on Kenney.nl analysis
const optimalCategories = {
  // Main content types (Top level)
  mainTypes: [
    {
      name: 'Assets',
      slug: 'assets',
      description: 'Art resources and creative assets for projects',
      color: '#4169E1',
      icon: 'image',
      order: 1,
      isMain: true
    },
    {
      name: 'Games',
      slug: 'games',
      description: 'Complete playable games and interactive experiences',
      color: '#8B5CF6',
      icon: 'gamepad-2',
      order: 2,
      isMain: true
    },
    {
      name: 'Tools',
      slug: 'tools',
      description: 'Development tools and creative utilities',
      color: '#06B6D4',
      icon: 'wrench',
      order: 3,
      isMain: true
    },
    {
      name: 'Starter Kits',
      slug: 'starter-kits',
      description: 'Ready-to-use project templates and boilerplates',
      color: '#EC4899',
      icon: 'rocket',
      order: 4,
      isMain: true
    }
  ],

  // Asset sub-categories (Format-based)
  assetFormats: [
    {
      name: '2D Graphics',
      slug: '2d-graphics',
      description: 'Sprites, backgrounds, and 2D visual elements',
      color: '#10B981',
      icon: 'image',
      order: 11,
      parentSlug: 'assets'
    },
    {
      name: '3D Models',
      slug: '3d-models',
      description: 'Three-dimensional models and environments',
      color: '#4169E1',
      icon: 'box',
      order: 12,
      parentSlug: 'assets'
    },
    {
      name: 'User Interface',
      slug: 'user-interface',
      description: 'UI elements, buttons, and interface components',
      color: '#F59E0B',
      icon: 'monitor',
      order: 13,
      parentSlug: 'assets'
    },
    {
      name: 'Audio',
      slug: 'audio',
      description: 'Sound effects, music, and audio resources',
      color: '#EF4444',
      icon: 'volume-2',
      order: 14,
      parentSlug: 'assets'
    },
    {
      name: 'Pixel Art',
      slug: 'pixel-art',
      description: 'Retro pixel art graphics and sprites',
      color: '#8B5CF6',
      icon: 'grid-3x3',
      order: 15,
      parentSlug: 'assets'
    },
    {
      name: 'Textures',
      slug: 'textures',
      description: 'Surface materials and texture maps',
      color: '#84CC16',
      icon: 'layers',
      order: 16,
      parentSlug: 'assets'
    }
  ],

  // Thematic series/collections
  collections: [
    {
      name: 'City Collection',
      slug: 'city-collection',
      description: 'Urban environments, buildings, and city assets',
      color: '#6B7280',
      icon: 'building',
      order: 21,
      isCollection: true
    },
    {
      name: 'Retro Collection',
      slug: 'retro-collection',
      description: 'Vintage and retro-styled assets',
      color: '#F59E0B',
      icon: 'archive',
      order: 22,
      isCollection: true
    },
    {
      name: 'Character Collection',
      slug: 'character-collection',
      description: 'Characters, people, and creatures',
      color: '#EC4899',
      icon: 'users',
      order: 23,
      isCollection: true
    },
    {
      name: 'Vehicle Collection',
      slug: 'vehicle-collection',
      description: 'Cars, ships, aircraft, and transportation',
      color: '#06B6D4',
      icon: 'car',
      order: 24,
      isCollection: true
    }
  ]
}

// Create or update category in Sanity
async function createOrUpdateCategory(categoryData) {
  try {
    // Check if category already exists
    const existingCategory = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0]`,
      { slug: categoryData.slug }
    )

    if (existingCategory) {
      // Update existing category
      const updated = await client
        .patch(existingCategory._id)
        .set({
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
          icon: categoryData.icon,
          order: categoryData.order,
          isActive: true,
          isMain: categoryData.isMain || false,
          isCollection: categoryData.isCollection || false,
          parentSlug: categoryData.parentSlug || null
        })
        .commit()

      console.log(`✅ Updated category: ${categoryData.name}`)
      return updated
    } else {
      // Create new category
      const newCategory = await client.create({
        _type: 'category',
        name: categoryData.name,
        slug: { current: categoryData.slug },
        description: categoryData.description,
        color: categoryData.color,
        icon: categoryData.icon,
        order: categoryData.order,
        isActive: true,
        isMain: categoryData.isMain || false,
        isCollection: categoryData.isCollection || false,
        parentSlug: categoryData.parentSlug || null,
        productCount: 0
      })

      console.log(`✨ Created category: ${categoryData.name}`)
      return newCategory
    }
  } catch (error) {
    console.error(`❌ Error with category ${categoryData.name}:`, error.message)
    return null
  }
}

// Update product categorization based on content analysis
async function recategorizeProducts() {
  try {
    console.log('\n🔄 Analyzing and recategorizing existing products...')

    // Get all products
    const products = await client.fetch(`
      *[_type == "product"] {
        _id,
        title,
        description,
        compatibleWith,
        fileTypes,
        tags[]->{name}
      }
    `)

    console.log(`📊 Found ${products.length} products to analyze`)

    for (const product of products) {
      const newCategorySlug = determineOptimalCategory(product)

      if (newCategorySlug) {
        // Get the category reference
        const category = await client.fetch(
          `*[_type == "category" && slug.current == $slug][0]`,
          { slug: newCategorySlug }
        )

        if (category) {
          await client
            .patch(product._id)
            .set({
              category: {
                _type: 'reference',
                _ref: category._id
              }
            })
            .commit()

          console.log(`📝 ${product.title} → ${category.name}`)
        }
      }
    }

    console.log('✅ Product recategorization complete!')

  } catch (error) {
    console.error('❌ Error recategorizing products:', error.message)
  }
}

// Determine optimal category for a product based on its characteristics
function determineOptimalCategory(product) {
  const title = product.title.toLowerCase()
  const description = product.description.toLowerCase()
  const tags = product.tags?.map(tag => tag.name.toLowerCase()) || []
  const content = `${title} ${description} ${tags.join(' ')}`

  // Check for main content types first
  if (content.includes('game') || title.includes('game')) {
    return 'games'
  }

  if (content.includes('tool') || content.includes('mixer') || content.includes('forge')) {
    return 'tools'
  }

  if (content.includes('starter') || content.includes('kit') && content.includes('complete')) {
    return 'starter-kits'
  }

  // Default to assets, then determine format
  if (content.includes('audio') || content.includes('sound') || content.includes('music')) {
    return 'audio'
  }

  if (content.includes('ui') || content.includes('interface') || content.includes('button') || content.includes('prompt')) {
    return 'user-interface'
  }

  if (content.includes('pixel') || tags.includes('pixel')) {
    return 'pixel-art'
  }

  if (content.includes('texture') || content.includes('material')) {
    return 'textures'
  }

  // Check file types for 2D vs 3D
  const fileTypes = product.fileTypes || []
  const is3D = fileTypes.some(type => ['fbx', 'obj', 'blend', 'dae'].includes(type))
  const is2D = fileTypes.some(type => ['png', 'svg', 'psd', 'ai', 'gif'].includes(type))

  if (is3D) {
    return '3d-models'
  } else if (is2D) {
    return '2d-graphics'
  }

  // Default to 3D for Kenney assets (most are 3D)
  return '3d-models'
}

// Update category counts
async function updateCategoryCounts() {
  try {
    console.log('\n📊 Updating category product counts...')

    const categories = await client.fetch(`*[_type == "category"]`)

    for (const category of categories) {
      const count = await client.fetch(
        `count(*[_type == "product" && references($categoryId)])`,
        { categoryId: category._id }
      )

      await client
        .patch(category._id)
        .set({ productCount: count })
        .commit()

      console.log(`📊 ${category.name}: ${count} products`)
    }

    console.log('✅ Category counts updated!')

  } catch (error) {
    console.error('❌ Error updating category counts:', error.message)
  }
}

// Main execution function
async function updateCategoryStructure() {
  try {
    console.log('🎯 Updating category structure to match Kenney.nl best practices...\n')

    // 1. Create main content type categories
    console.log('📁 Creating main content type categories...')
    for (const category of optimalCategories.mainTypes) {
      await createOrUpdateCategory(category)
    }

    // 2. Create asset format subcategories
    console.log('\n🎨 Creating asset format subcategories...')
    for (const category of optimalCategories.assetFormats) {
      await createOrUpdateCategory(category)
    }

    // 3. Create thematic collections
    console.log('\n📚 Creating thematic collections...')
    for (const category of optimalCategories.collections) {
      await createOrUpdateCategory(category)
    }

    // 4. Recategorize existing products
    await recategorizeProducts()

    // 5. Update category counts
    await updateCategoryCounts()

    console.log('\n🎉 Category structure update completed successfully!')
    console.log('📊 Structure now matches Kenney.nl best practices:')
    console.log('   • Main Types: Assets, Games, Tools, Starter Kits')
    console.log('   • Asset Formats: 2D, 3D, UI, Audio, Pixel Art, Textures')
    console.log('   • Collections: City, Retro, Character, Vehicle')
    console.log('   • Products automatically recategorized based on content analysis')

  } catch (error) {
    console.error('❌ Error updating category structure:', error.message)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  updateCategoryStructure()
}
