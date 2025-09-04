#!/usr/bin/env node

import { createClient } from '@sanity/client'
import fetch from 'node-fetch'
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

// Mock data with real Unsplash images (from our working mock data)
const categories = [
  {
    name: 'UI Kits',
    slug: 'ui-kits',
    description: 'Modern interface components and design systems',
    color: '#4169E1',
    icon: 'layout'
  },
  {
    name: 'User Interface',
    slug: 'user-interface',
    description: 'Interface elements and UI components',
    color: '#10B981',
    icon: 'monitor'
  },
  {
    name: 'Games',
    slug: 'games',
    description: 'Game assets and interactive experiences',
    color: '#8B5CF6',
    icon: 'gamepad-2'
  },
  {
    name: '2D Graphics',
    slug: '2d-graphics',
    description: 'Two-dimensional sprites and graphics',
    color: '#F59E0B',
    icon: 'image'
  },
  {
    name: 'Icons',
    slug: 'icons',
    description: 'Icon collections and symbol libraries',
    color: '#EF4444',
    icon: 'star'
  },
  {
    name: 'Characters',
    slug: 'characters',
    description: 'Character sprites and people graphics',
    color: '#EC4899',
    icon: 'users'
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    description: 'Car sprites and transportation assets',
    color: '#06B6D4',
    icon: 'truck'
  },
  {
    name: 'Weapons',
    slug: 'weapons',
    description: 'Weapon sprites and combat assets',
    color: '#84CC16',
    icon: 'sword'
  },
  {
    name: 'Nature',
    slug: 'nature',
    description: 'Natural environment and outdoor assets',
    color: '#22C55E',
    icon: 'tree-pine'
  },
  {
    name: 'Buildings',
    slug: 'buildings',
    description: 'Architecture and construction assets',
    color: '#F97316',
    icon: 'building'
  }
]

const authors = [
  {
    name: 'UI8 Studio',
    slug: 'ui8-studio',
    bio: 'Premium UI design resources and templates for modern applications',
    website: 'https://ui8.net',
    isVerified: true,
    isFeatured: true,
    stats: {
      totalSales: 5000,
      totalEarnings: 150000,
      averageRating: 4.8,
      followers: 12500
    }
  },
  {
    name: 'Creative Labs',
    slug: 'creative-labs',
    bio: 'Mobile UI specialist and design system creator',
    isVerified: true,
    isFeatured: false,
    stats: {
      totalSales: 2500,
      totalEarnings: 75000,
      averageRating: 4.7,
      followers: 8500
    }
  },
  {
    name: 'Design Masters',
    slug: 'design-masters',
    bio: 'Professional design team creating high-quality mockups and illustrations',
    isVerified: true,
    isFeatured: false,
    stats: {
      totalSales: 1200,
      totalEarnings: 36000,
      averageRating: 4.5,
      followers: 3200
    }
  },
  {
    name: 'Game Studio Pro',
    slug: 'game-studio-pro',
    bio: 'Professional game asset creators specializing in 2D graphics and animations',
    isVerified: true,
    isFeatured: true,
    stats: {
      totalSales: 3200,
      totalEarnings: 96000,
      averageRating: 4.9,
      followers: 15800
    }
  },
  {
    name: 'Kenney Assets',
    slug: 'kenney-assets',
    bio: 'The largest collection of free game assets, sprites, and UI elements',
    website: 'https://kenney.nl',
    isVerified: true,
    isFeatured: true,
    stats: {
      totalSales: 8500,
      totalEarnings: 0,
      averageRating: 4.8,
      followers: 42000
    }
  }
]

// Products with real Unsplash images mapped to categories
const products = [
  // UI Kits & Interface
  {
    title: 'Premium UI Kit Collection',
    slug: 'premium-ui-kit-collection',
    category: 'ui-kits',
    author: 'ui8-studio',
    price: 89,
    featured: true,
    shortDescription: 'Complete UI components for modern applications',
    description: 'A comprehensive UI kit with modern design components for mobile and web applications. Includes buttons, forms, navigation, and data visualization elements.',
    imageUrls: [
      'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Figma', 'Sketch', 'Adobe XD'],
    fileTypes: ['fig', 'sketch', 'xd'],
    stats: { views: 2105, downloads: 323, likes: 161, rating: 4.8, reviewsCount: 32 }
  },
  {
    title: 'Modern Interface Elements',
    slug: 'modern-interface-elements',
    category: 'user-interface',
    author: 'creative-labs',
    price: 59,
    shortDescription: 'Clean and modern UI elements for web and mobile',
    description: 'Complete design system with carefully crafted components, icons, and layouts. Perfect for creating professional interfaces quickly.',
    imageUrls: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Photoshop', 'Figma', 'Sketch'],
    fileTypes: ['psd', 'fig', 'sketch'],
    stats: { views: 1534, downloads: 234, likes: 117, rating: 4.6, reviewsCount: 23 }
  },
  {
    title: 'RPG UI Pack',
    slug: 'rpg-ui-pack',
    category: 'ui-kits',
    author: 'game-studio-pro',
    price: 45,
    shortDescription: 'Fantasy game interface elements and components',
    description: 'Modern and clean UI kit featuring contemporary design trends. Includes dark and light modes with extensive customization options.',
    imageUrls: [
      'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Unreal Engine', 'Godot'],
    fileTypes: ['png', 'psd'],
    stats: { views: 1876, downloads: 287, likes: 143, rating: 4.7, reviewsCount: 28 }
  },

  // Game Assets
  {
    title: 'Platformer Game Assets',
    slug: 'platformer-game-assets',
    category: 'games',
    author: 'game-studio-pro',
    price: 75,
    featured: true,
    shortDescription: '2D platformer sprites and backgrounds',
    description: 'High-quality game assets perfect for indie developers and studios. Includes sprites, backgrounds, and complete art sets.',
    imageUrls: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Godot', 'Game Maker'],
    fileTypes: ['png', 'svg', 'psd'],
    stats: { views: 3245, downloads: 512, likes: 256, rating: 4.9, reviewsCount: 51 }
  },
  {
    title: 'Pixel Art Redux Pack',
    slug: 'pixel-art-redux-pack',
    category: '2d-graphics',
    author: 'kenney-assets',
    price: 0,
    freebie: true,
    shortDescription: 'Free pixel art collection for indie games',
    description: 'Professional game graphics with consistent art style. Optimized for performance and easy integration.',
    imageUrls: [
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Godot', 'Game Maker'],
    fileTypes: ['png', 'gif'],
    stats: { views: 4567, downloads: 892, likes: 445, rating: 4.8, reviewsCount: 89 }
  },
  {
    title: 'Abstract Platformer Pack',
    slug: 'abstract-platformer-pack',
    category: 'games',
    author: 'game-studio-pro',
    price: 55,
    shortDescription: 'Minimalist game assets with abstract design',
    description: 'Complete game asset collection with characters, environments, and UI elements. Ready for immediate use in your projects.',
    imageUrls: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Unreal Engine'],
    fileTypes: ['png', 'fbx'],
    stats: { views: 2134, downloads: 324, likes: 162, rating: 4.5, reviewsCount: 32 }
  },
  {
    title: 'Deluxe Platformer Art',
    slug: 'deluxe-platformer-art',
    category: '2d-graphics',
    author: 'kenney-assets',
    price: 0,
    freebie: true,
    shortDescription: 'High-quality 2D game sprites and tiles',
    description: 'Professional game graphics with consistent art style. Optimized for performance and easy integration.',
    imageUrls: [
      'https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Godot', 'Game Maker'],
    fileTypes: ['png', 'svg'],
    stats: { views: 3891, downloads: 756, likes: 378, rating: 4.7, reviewsCount: 75 }
  },

  // Icons
  {
    title: 'Game Icons Collection',
    slug: 'game-icons-collection',
    category: 'icons',
    author: 'kenney-assets',
    price: 0,
    freebie: true,
    shortDescription: 'Comprehensive game icon library',
    description: 'Comprehensive icon collection with modern design language. Perfect for web and mobile applications.',
    imageUrls: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Figma', 'Sketch', 'Unity'],
    fileTypes: ['png', 'svg', 'ico'],
    stats: { views: 5234, downloads: 1245, likes: 623, rating: 4.8, reviewsCount: 124 }
  },
  {
    title: 'Input Prompts Pack',
    slug: 'input-prompts-pack',
    category: 'icons',
    author: 'kenney-assets',
    price: 0,
    freebie: true,
    shortDescription: 'Controller and keyboard input icons',
    description: 'High-quality vector icons with consistent styling. Available in multiple formats and sizes.',
    imageUrls: [
      'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Unreal Engine', 'Web'],
    fileTypes: ['png', 'svg'],
    stats: { views: 2876, downloads: 567, likes: 284, rating: 4.6, reviewsCount: 56 }
  },
  {
    title: 'UI Icons Extended',
    slug: 'ui-icons-extended',
    category: 'icons',
    author: 'ui8-studio',
    price: 39,
    shortDescription: 'Extended collection of interface icons',
    description: 'Professional icon set designed for user interfaces. Includes dark and light variants.',
    imageUrls: [
      'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Figma', 'Sketch', 'Adobe XD'],
    fileTypes: ['svg', 'png', 'ico'],
    stats: { views: 1789, downloads: 298, likes: 149, rating: 4.7, reviewsCount: 29 }
  },

  // Characters & Vehicles
  {
    title: 'Toon Characters Pack',
    slug: 'toon-characters-pack',
    category: 'characters',
    author: 'game-studio-pro',
    price: 65,
    shortDescription: 'Cartoon-style character sprites for games',
    description: 'Cartoon-style character sprites perfect for family-friendly games and educational apps.',
    imageUrls: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Godot', 'Game Maker'],
    fileTypes: ['png', 'psd'],
    stats: { views: 2456, downloads: 387, likes: 194, rating: 4.8, reviewsCount: 38 }
  },
  {
    title: 'Racing Car Collection',
    slug: 'racing-car-collection',
    category: 'vehicles',
    author: 'game-studio-pro',
    price: 49,
    shortDescription: 'Top-down racing car sprites and assets',
    description: 'Professional vehicle sprites optimized for racing games and top-down gameplay.',
    imageUrls: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Unreal Engine', 'Godot'],
    fileTypes: ['png', 'fbx'],
    stats: { views: 1967, downloads: 312, likes: 156, rating: 4.6, reviewsCount: 31 }
  },

  // More diverse products to reach 15+ total
  {
    title: 'Weapon Pack Collection',
    slug: 'weapon-pack-collection',
    category: 'weapons',
    author: 'game-studio-pro',
    price: 55,
    shortDescription: 'Fantasy and modern weapon sprites',
    description: 'Comprehensive weapon collection for action games and RPGs.',
    imageUrls: [
      'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Unreal Engine'],
    fileTypes: ['png', 'psd'],
    stats: { views: 2234, downloads: 356, likes: 178, rating: 4.7, reviewsCount: 35 }
  },
  {
    title: 'Nature Pack Extended',
    slug: 'nature-pack-extended',
    category: 'nature',
    author: 'kenney-assets',
    price: 0,
    freebie: true,
    shortDescription: 'Trees, rocks, and natural environment assets',
    description: 'Beautiful natural environment assets for outdoor and adventure games.',
    imageUrls: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Godot', 'Unreal Engine'],
    fileTypes: ['png', 'fbx'],
    stats: { views: 3456, downloads: 678, likes: 339, rating: 4.8, reviewsCount: 67 }
  },
  {
    title: 'Building Kit Pro',
    slug: 'building-kit-pro',
    category: 'buildings',
    author: 'game-studio-pro',
    price: 68,
    shortDescription: 'Modular building components for city scenes',
    description: 'Professional architecture assets for creating detailed urban environments.',
    imageUrls: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop&crop=center'
    ],
    compatibleWith: ['Unity', 'Unreal Engine', 'Blender'],
    fileTypes: ['fbx', 'obj', 'png'],
    stats: { views: 1876, downloads: 298, likes: 149, rating: 4.9, reviewsCount: 29 }
  }
]

// Create category in Sanity
async function createCategory(categoryData) {
  try {
    const category = {
      _type: 'category',
      name: categoryData.name,
      slug: { current: categoryData.slug },
      description: categoryData.description,
      icon: categoryData.icon,
      color: categoryData.color,
      productCount: 0,
      isActive: true,
      order: categories.indexOf(categoryData) + 1
    }

    const result = await client.create(category)
    console.log(`✅ Created category: ${categoryData.name}`)
    return result
  } catch (error) {
    console.error(`❌ Error creating category:`, error.message)
    return null
  }
}

// Create author in Sanity
async function createAuthor(authorData) {
  try {
    const author = {
      _type: 'author',
      name: authorData.name,
      slug: { current: authorData.slug },
      bio: authorData.bio,
      website: authorData.website || '',
      isVerified: authorData.isVerified,
      isFeatured: authorData.isFeatured,
      productsCount: 0,
      stats: authorData.stats
    }

    const result = await client.create(author)
    console.log(`✅ Created author: ${authorData.name}`)
    return result
  } catch (error) {
    console.error(`❌ Error creating author:`, error.message)
    return null
  }
}

// Create product in Sanity with uploaded images
async function createProduct(productData, authorRef, categoryRef) {
  try {
    // Upload all images to Sanity
    const images = []
    for (const imageUrl of productData.imageUrls) {
      const image = await uploadImageToSanity(imageUrl, productData.title)
      if (image) {
        images.push(image)
      }
      // Small delay between image uploads
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (images.length === 0) {
      console.warn(`⚠️  No images uploaded for ${productData.title}`)
    }

    const product = {
      _type: 'product',
      title: productData.title,
      slug: { current: productData.slug },
      description: productData.description,
      shortDescription: productData.shortDescription,
      price: productData.price,
      currency: 'USD',
      images,
      category: {
        _type: 'reference',
        _ref: categoryRef._id
      },
      author: {
        _type: 'reference',
        _ref: authorRef._id
      },
      tags: [],
      featured: productData.featured || false,
      freebie: productData.freebie || false,
      status: 'published',
      compatibleWith: productData.compatibleWith,
      fileTypes: productData.fileTypes,
      license: productData.freebie ? 'free' : 'standard',
      stats: productData.stats
    }

    const result = await client.create(product)
    console.log(`✅ Created product: ${productData.title}`)
    return result
  } catch (error) {
    console.error(`❌ Error creating product ${productData.title}:`, error.message)
    return null
  }
}

// Upload image URL to Sanity asset storage
async function uploadImageToSanity(imageUrl, altText) {
  try {
    console.log(`📸 Uploading image: ${imageUrl}`)

    // Fetch the image from Unsplash
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()

    // Upload to Sanity asset storage
    const asset = await client.assets.upload('image', Buffer.from(imageBuffer), {
      filename: `unsplash-${Date.now()}.jpg`
    })

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id
      },
      alt: altText
    }
  } catch (error) {
    console.error(`❌ Error uploading image ${imageUrl}:`, error.message)
    return null
  }
}

// Main execution function
async function populateSanityWithMockData() {
  try {
    console.log('🎨 Starting Sanity population with mock data and real images...')

    // 1. Clear existing data (optional)
    console.log('\n🗑️  Clearing existing data...')
    try {
      await client.delete({ query: '*[_type == "product"]' })
      await client.delete({ query: '*[_type == "author"]' })
      await client.delete({ query: '*[_type == "category"]' })
      console.log('✅ Cleared existing data')
    } catch (error) {
      console.log('⚠️  Note: Could not clear existing data (might be empty)')
    }

    // 2. Create categories
    console.log('\n📂 Creating categories...')
    const categoryRefs = {}
    for (const categoryData of categories) {
      const category = await createCategory(categoryData)
      if (category) {
        categoryRefs[categoryData.slug] = category
      }
    }

    // 3. Create authors
    console.log('\n👨‍💼 Creating authors...')
    const authorRefs = {}
    for (const authorData of authors) {
      const author = await createAuthor(authorData)
      if (author) {
        authorRefs[authorData.slug] = author
      }
    }

    // 4. Create products with real images
    console.log('\n📦 Creating products with real Unsplash images...')
    let successCount = 0
    let failureCount = 0

    for (const productData of products) {
      try {
        const categoryRef = categoryRefs[productData.category]
        const authorRef = authorRefs[productData.author]

        if (categoryRef && authorRef) {
          const product = await createProduct(productData, authorRef, categoryRef)
          if (product) {
            successCount++
          } else {
            failureCount++
          }
        } else {
          console.error(`❌ Missing refs for product ${productData.title}`)
          failureCount++
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ Error processing product ${productData.title}:`, error.message)
        failureCount++
      }
    }

    console.log('\n🎉 Sanity population completed!')
    console.log(`📊 Results:`)
    console.log(`   ✅ ${successCount} products created successfully`)
    console.log(`   ❌ ${failureCount} products failed`)
    console.log(`   📂 ${Object.keys(categoryRefs).length} categories created`)
    console.log(`   👨‍💼 ${Object.keys(authorRefs).length} authors created`)
    console.log(`   🖼️  Real Unsplash images integrated`)
    console.log(`   🎨 Ready for production use!`)

  } catch (error) {
    console.error('❌ Error during Sanity population:', error.message)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateSanityWithMockData()
}
