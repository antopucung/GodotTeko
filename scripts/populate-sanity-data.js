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

// Comprehensive Kenney.nl sections to scrape
const kenneyCategories = {
  assets: {
    url: 'https://kenney.nl/assets',
    type: 'asset',
    category: '3D Assets'
  },
  games: {
    url: 'https://kenney.nl/games',
    type: 'game',
    category: 'Games'
  },
  tools: {
    url: 'https://kenney.nl/tools',
    type: 'tool',
    category: 'Tools'
  },
  starterKits: {
    url: 'https://kenney.nl/starter-kits',
    type: 'starter-kit',
    category: 'Starter Kits'
  }
}

// Specific assets to prioritize (your requested list)
const priorityAssets = [
  'fantasy-town-kit',
  'blaster-kit',
  'city-kit-commercial',
  'city-kit-industrial',
  'blocky-characters',
  'fish-pack',
  'new-platformer-pack',
  'city-kit-suburban',
  'input-prompts',
  'city-kit-roads',
  'minigolf-kit',
  'retro-medieval-kit',
  'retro-urban-kit',
  'toy-car-kit',
  'tiny-town',
  'pirate-kit'
]

// Enhanced author data for Kenney
const kenneyAuthor = {
  _type: 'author',
  name: 'Kenney',
  slug: { current: 'kenney' },
  bio: 'Creating free game assets, tools, and games since 2010. All assets are released under Creative Commons CC0, meaning you can use them for commercial and non-commercial projects. Over 40,000 assets created!',
  website: 'https://kenney.nl',
  isVerified: true,
  isFeatured: true,
  productsCount: 500,
  stats: {
    totalSales: 100000,
    totalEarnings: 0, // Free assets
    averageRating: 4.9,
    followers: 45000
  },
  socialLinks: {
    twitter: 'https://twitter.com/KenneyWings',
    youtube: 'https://youtube.com/KenneyNL'
  }
}

// Enhanced category mappings
const categoryMappings = {
  '3D Assets': {
    name: '3D Assets',
    slug: '3d-assets',
    description: 'Three-dimensional game assets including models, kits, and environments',
    color: '#4169E1',
    icon: 'box'
  },
  '2D Graphics': {
    name: '2D Graphics',
    slug: '2d-graphics',
    description: 'Two-dimensional sprites, UI elements, and graphics',
    color: '#10B981',
    icon: 'image'
  },
  'User Interface': {
    name: 'User Interface',
    slug: 'user-interface',
    description: 'Interface elements, buttons, and UI components',
    color: '#F59E0B',
    icon: 'monitor'
  },
  'Audio Assets': {
    name: 'Audio Assets',
    slug: 'audio-assets',
    description: 'Sound effects, music, and audio resources',
    color: '#EF4444',
    icon: 'volume-2'
  },
  'Games': {
    name: 'Games',
    slug: 'games',
    description: 'Complete games and interactive experiences',
    color: '#8B5CF6',
    icon: 'gamepad-2'
  },
  'Tools': {
    name: 'Development Tools',
    slug: 'tools',
    description: 'Game development tools and utilities',
    color: '#06B6D4',
    icon: 'wrench'
  },
  'Starter Kits': {
    name: 'Starter Kits',
    slug: 'starter-kits',
    description: 'Complete starter projects and templates',
    color: '#EC4899',
    icon: 'rocket'
  }
}

// Scrape category page to get list of items
async function scrapeCategoryPage(categoryUrl, type) {
  try {
    console.log(`Scraping category page: ${categoryUrl}`)

    const response = await fetch(categoryUrl)
    const html = await response.text()

    const items = []

    // Extract item links from the category page
    const linkRegex = new RegExp(`href="/${type === 'starter-kit' ? 'starter-kits' : type === 'asset' ? 'assets' : type}s?/([^"]+)"`, 'g')
    let match

    while ((match = linkRegex.exec(html)) !== null) {
      const slug = match[1]
      // Skip if it's just a category or filter link
      if (!slug.includes('/') && !slug.includes('?') && slug.length > 2) {
        items.push(slug)
      }
    }

    // Remove duplicates and limit to reasonable number
    const uniqueItems = [...new Set(items)].slice(0, 30)
    console.log(`Found ${uniqueItems.length} items in ${categoryUrl}`)

    return uniqueItems

  } catch (error) {
    console.error(`Error scraping category ${categoryUrl}:`, error.message)
    return []
  }
}

// Enhanced individual item scraping
async function scrapeItemPage(itemSlug, type) {
  try {
    const baseUrl = type === 'starter-kit' ? 'https://kenney.nl/starter-kits' :
                   type === 'asset' ? 'https://kenney.nl/assets' :
                   type === 'game' ? 'https://kenney.nl/games' :
                   'https://kenney.nl/tools'

    console.log(`Scraping ${type}: ${itemSlug}...`)

    const response = await fetch(`${baseUrl}/${itemSlug}`)
    const html = await response.text()

    // Extract title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const title = titleMatch ? titleMatch[1].trim() : itemSlug.replace(/-/g, ' ')

    // Extract category based on type and content
    let category = '3D Assets' // default
    if (type === 'game') category = 'Games'
    else if (type === 'tool') category = 'Tools'
    else if (type === 'starter-kit') category = 'Starter Kits'
    else {
      // For assets, try to determine category from content
      const categoryMatch = html.match(/Category\/series<\/td>\s*<td[^>]*>.*?<a[^>]*>([^<]+)<\/a>/)
      if (categoryMatch) {
        const rawCategory = categoryMatch[1]
        if (rawCategory.includes('2D') || rawCategory.includes('UI')) {
          category = '2D Graphics'
        } else if (rawCategory.includes('Audio') || rawCategory.includes('Sound')) {
          category = 'Audio Assets'
        } else if (rawCategory.includes('Interface') || rawCategory.includes('UI')) {
          category = 'User Interface'
        }
      }
    }

    // Extract description from meta or first paragraph
    let description = ''
    const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/)
    if (metaDescMatch) {
      description = metaDescMatch[1]
    } else {
      const firstParagraphMatch = html.match(/<p[^>]*>([^<]+)<\/p>/)
      if (firstParagraphMatch) {
        description = firstParagraphMatch[1]
      }
    }

    // Extract file count
    const filesMatch = html.match(/Files<\/td>\s*<td[^>]*>(\d+)×<\/td>/)
    const fileCount = filesMatch ? parseInt(filesMatch[1]) : Math.floor(Math.random() * 50) + 10

    // Extract tags from content and URL structure
    const tags = []
    const tagsSection = html.match(/Tags<\/td>\s*<td[^>]*>(.*?)<\/td>/s)
    if (tagsSection) {
      const tagMatches = tagsSection[1].match(/tag:([^"]+)"/g)
      if (tagMatches) {
        tagMatches.forEach(match => {
          const tag = match.replace('tag:', '').replace('"', '')
          tags.push(tag)
        })
      }
    }

    // Add tags based on title and type
    if (title.toLowerCase().includes('city')) tags.push('city', 'urban')
    if (title.toLowerCase().includes('medieval')) tags.push('medieval', 'fantasy')
    if (title.toLowerCase().includes('character')) tags.push('character', 'people')
    if (title.toLowerCase().includes('ui') || title.toLowerCase().includes('interface')) tags.push('ui', 'interface')
    if (type === 'game') tags.push('complete-game', 'playable')
    if (type === 'tool') tags.push('development', 'utility')

    // Extract features
    const features = []
    if (html.includes('Animation')) features.push('Animations')
    if (html.includes('Texture')) features.push('Textures')
    if (html.includes('Sound')) features.push('Audio')
    if (html.includes('Variation')) features.push('Variations')

    // Extract preview images - look for various image patterns
    const imageUrls = []

    // Look for Kenney's image patterns
    const imagePatterns = [
      /https:\/\/[^"]*\.kenney\.nl[^"]*\.png/g,
      /https:\/\/ext\.same-assets\.com\/[^"]*\.png/g,
      /\/assets\/[^"]*\.png/g
    ]

    imagePatterns.forEach(pattern => {
      const matches = html.match(pattern)
      if (matches) {
        matches.forEach(url => {
          // Convert relative URLs to absolute
          if (url.startsWith('/')) {
            url = 'https://kenney.nl' + url
          }
          imageUrls.push(url)
        })
      }
    })

    // Remove duplicates and limit
    const uniqueImages = [...new Set(imageUrls)].slice(0, 4)

    // Generate enhanced description if none found
    if (!description || description.length < 50) {
      description = generateEnhancedDescription(title, category, tags, features, fileCount, type)
    }

    return {
      title,
      slug: itemSlug,
      category,
      type,
      fileCount,
      tags: [...new Set(tags)], // Remove duplicate tags
      features,
      imageUrls: uniqueImages,
      description,
      price: generateEnhancedPrice(tags, fileCount, type),
      stats: generateEnhancedStats(fileCount, tags, type)
    }

  } catch (error) {
    console.error(`Error scraping ${type} ${itemSlug}:`, error.message)
    return null
  }
}

// Generate enhanced description
function generateEnhancedDescription(title, category, tags, features, fileCount, type) {
  const typeText = type === 'game' ? 'complete game' :
                  type === 'tool' ? 'development tool' :
                  type === 'starter-kit' ? 'starter kit' : 'asset pack'

  const tagText = tags.length > 0 ? tags.slice(0, 3).join(', ') : 'game development'
  const featureText = features.length > 0 ? ` Features include ${features.join(', ').toLowerCase()}.` : ''
  const fileText = fileCount > 0 ? ` Contains ${fileCount} high-quality files.` : ''

  return `Professional ${category.toLowerCase()} ${typeText} perfect for ${tagText} projects.${fileText}${featureText} Created by Kenney with industry-standard quality and CC0 licensing for commercial and personal use.`
}

// Generate enhanced pricing based on type and complexity
function generateEnhancedPrice(tags = [], fileCount = 0, type = 'asset') {
  // Base pricing by type
  const basePrices = {
    'game': [39, 49, 69, 89], // Complete games are more valuable
    'tool': [19, 29, 39, 49], // Development tools
    'starter-kit': [29, 39, 59], // Starter projects
    'asset': [9, 19, 29, 39] // Individual assets
  }

  // Premium multipliers for special tags
  const premiumTags = {
    'complete-game': 2.0,
    'tool': 1.5,
    'medieval': 1.3,
    'city': 1.2,
    'character': 1.4,
    'ui': 1.1
  }

  const prices = basePrices[type] || basePrices['asset']
  let basePrice = prices[Math.floor(Math.random() * prices.length)]

  // Apply premium multipliers
  for (const tag of tags) {
    if (premiumTags[tag]) {
      basePrice = Math.floor(basePrice * premiumTags[tag])
      break // Only apply one premium multiplier
    }
  }

  // File count bonus
  if (fileCount > 100) basePrice += 20
  else if (fileCount > 50) basePrice += 10

  return Math.min(basePrice, 99) // Cap at $99
}

// Generate enhanced stats
function generateEnhancedStats(fileCount, tags = [], type = 'asset') {
  const typeMultipliers = {
    'game': 2.0,     // Games get more attention
    'tool': 1.5,     // Tools are popular
    'starter-kit': 1.3,
    'asset': 1.0
  }

  const multiplier = typeMultipliers[type] || 1.0
  const baseViews = Math.floor((Math.random() * 15000 + 5000) * multiplier)
  const downloadRate = 0.15 + (Math.random() * 0.15) // 15-30% conversion
  const downloads = Math.floor(baseViews * downloadRate)

  return {
    views: baseViews,
    downloads: downloads,
    likes: Math.floor(downloads * (0.4 + Math.random() * 0.2)), // 40-60% like rate
    rating: 4.3 + Math.random() * 0.6, // 4.3 - 4.9
    reviewsCount: Math.floor(downloads * (0.05 + Math.random() * 0.05)) // 5-10% review rate
  }
}

// Upload image to Sanity with error handling
async function uploadImageToSanity(imageUrl, altText) {
  try {
    console.log(`Uploading image: ${imageUrl}`)

    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const asset = await client.assets.upload('image', Buffer.from(imageBuffer), {
      filename: imageUrl.split('/').pop() || 'kenney-asset.png'
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
    console.error(`Error uploading image ${imageUrl}:`, error.message)
    return null
  }
}

// Create category in Sanity
async function createCategory(categoryData) {
  try {
    const category = {
      _type: 'category',
      ...categoryData,
      productCount: 0,
      isActive: true,
      order: Object.keys(categoryMappings).indexOf(categoryData.name) + 1
    }

    const result = await client.create(category)
    console.log(`Created category: ${categoryData.name}`)
    return result
  } catch (error) {
    console.error(`Error creating category:`, error.message)
    return null
  }
}

// Create author in Sanity
async function createAuthor(authorData) {
  try {
    const result = await client.create(authorData)
    console.log(`Created author: ${authorData.name}`)
    return result
  } catch (error) {
    console.error(`Error creating author:`, error.message)
    return null
  }
}

// Create product in Sanity
async function createProduct(productData, authorRef, categoryRef) {
  try {
    // Upload images
    const images = []
    for (const imageUrl of productData.imageUrls) {
      const image = await uploadImageToSanity(imageUrl, productData.title)
      if (image) {
        images.push(image)
      }
    }

    // Create tags
    const tags = []
    for (const tagName of productData.tags) {
      try {
        const tag = {
          _type: 'tag',
          name: tagName,
          slug: { current: tagName.toLowerCase().replace(/\s+/g, '-') },
          productCount: 1
        }
        const tagResult = await client.create(tag)
        tags.push({
          _type: 'reference',
          _ref: tagResult._id
        })
      } catch (tagError) {
        console.warn(`Failed to create tag ${tagName}:`, tagError.message)
      }
    }

    const product = {
      _type: 'product',
      title: productData.title,
      slug: { current: productData.slug },
      description: productData.description,
      shortDescription: `${productData.category} ${productData.type} with ${productData.fileCount || 'multiple'} files`,
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
      tags,
      featured: Math.random() > 0.75, // 25% chance of featured
      freebie: Math.random() > 0.85,  // 15% chance of freebie
      status: 'published',
      compatibleWith: getCompatibleSoftware(productData.category, productData.type),
      fileTypes: getFileTypes(productData.category, productData.type),
      license: 'free',
      stats: productData.stats
    }

    const result = await client.create(product)
    console.log(`Created product: ${productData.title}`)
    return result
  } catch (error) {
    console.error(`Error creating product ${productData.title}:`, error.message)
    return null
  }
}

// Get compatible software based on category and type
function getCompatibleSoftware(category, type) {
  if (type === 'game') return ['Browser', 'Windows', 'Mac', 'Linux']
  if (type === 'tool') return ['Windows', 'Mac', 'Linux', 'Cross-platform']

  switch (category) {
    case '3D Assets':
      return ['Blender', 'Unity', 'Unreal Engine', 'Maya', 'Cinema 4D']
    case '2D Graphics':
      return ['Photoshop', 'GIMP', 'Unity', 'Godot', 'Game Maker']
    case 'User Interface':
      return ['Figma', 'Sketch', 'Adobe XD', 'Unity', 'Web Browsers']
    case 'Audio Assets':
      return ['Audacity', 'Unity', 'Unreal Engine', 'FMOD']
    default:
      return ['Unity', 'Godot', 'Game Maker', 'Cross-platform']
  }
}

// Get file types based on category and type
function getFileTypes(category, type) {
  if (type === 'game') return ['html', 'js', 'exe', 'app']
  if (type === 'tool') return ['exe', 'app', 'jar', 'py']

  switch (category) {
    case '3D Assets':
      return ['fbx', 'obj', 'blend', 'dae', 'png']
    case '2D Graphics':
      return ['png', 'svg', 'psd', 'ai', 'gif']
    case 'User Interface':
      return ['fig', 'sketch', 'xd', 'png', 'svg']
    case 'Audio Assets':
      return ['wav', 'mp3', 'ogg', 'aiff']
    default:
      return ['png', 'svg', 'zip']
  }
}

// Main execution function
async function populateComprehensiveKenneyData() {
  try {
    console.log('🎨 Starting comprehensive Kenney.nl data population...')

    // 1. Create author (Kenney)
    console.log('\n📝 Creating enhanced author profile...')
    const author = await createAuthor(kenneyAuthor)
    if (!author) {
      throw new Error('Failed to create author')
    }

    // 2. Create all categories
    console.log('\n📂 Creating comprehensive categories...')
    const categories = {}
    for (const [key, categoryData] of Object.entries(categoryMappings)) {
      const category = await createCategory(categoryData)
      if (category) {
        categories[key] = category
      }
    }

    // 3. First, create priority assets (your specific requests)
    console.log('\n🎯 Creating priority assets...')
    let successCount = 0
    let failureCount = 0

    for (const assetSlug of priorityAssets) {
      try {
        const productData = await scrapeItemPage(assetSlug, 'asset')
        if (productData) {
          const categoryRef = categories[productData.category] || categories['3D Assets']
          const product = await createProduct(productData, author, categoryRef)
          if (product) {
            successCount++
          } else {
            failureCount++
          }
        } else {
          failureCount++
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000))

      } catch (error) {
        console.error(`Error processing priority asset ${assetSlug}:`, error.message)
        failureCount++
      }
    }

    // 4. Then scrape additional items from category pages
    console.log('\n📋 Discovering additional items from category pages...')

    for (const [sectionName, sectionConfig] of Object.entries(kenneyCategories)) {
      try {
        console.log(`\n🔍 Scraping ${sectionName} section...`)
        const items = await scrapeCategoryPage(sectionConfig.url, sectionConfig.type)

        // Process up to 10 additional items per section (excluding priority assets)
        const newItems = items.filter(item => !priorityAssets.includes(item)).slice(0, 10)

        for (const itemSlug of newItems) {
          try {
            const productData = await scrapeItemPage(itemSlug, sectionConfig.type)
            if (productData) {
              const categoryRef = categories[productData.category] || categories[sectionConfig.category]
              const product = await createProduct(productData, author, categoryRef)
              if (product) {
                successCount++
              } else {
                failureCount++
              }
            } else {
              failureCount++
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000))

          } catch (error) {
            console.error(`Error processing ${sectionConfig.type} ${itemSlug}:`, error.message)
            failureCount++
          }
        }

      } catch (error) {
        console.error(`Error processing section ${sectionName}:`, error.message)
      }
    }

    console.log('\n✅ Comprehensive data population completed!')
    console.log(`📊 Results: ${successCount} successful, ${failureCount} failed`)
    console.log(`🎯 Total products created: ${successCount}`)
    console.log(`👨‍💼 Author created: ${author.name}`)
    console.log(`📂 Categories created: ${Object.keys(categories).length}`)
    console.log(`🎨 Coverage: Assets, Games, Tools, and Starter Kits`)

  } catch (error) {
    console.error('❌ Error during comprehensive data population:', error.message)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateComprehensiveKenneyData()
}
