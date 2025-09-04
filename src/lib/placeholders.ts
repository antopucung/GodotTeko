import { ASSETS, PLACEHOLDERS } from '@/config/constants'

// Demo Asset Collections - Using reliable sources with proper CORS
const DEMO_ASSETS = {
  uiElements: [
    'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=400&h=300&fit=crop&crop=center'
  ],
  gameAssets: [
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=400&h=300&fit=crop&crop=center'
  ],
  icons: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=300&fit=crop&crop=center'
  ],
  vehicles: [
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center'
  ],
  characters: [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1529258283598-8d6fe60b27f4?w=400&h=300&fit=crop&crop=center'
  ],
  weapons: [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=300&fit=crop&crop=center'
  ],
  nature: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center'
  ],
  buildings: [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop&crop=center'
  ]
}

// Category to asset mapping (using demo assets for now)
const CATEGORY_ASSET_MAP: Record<string, keyof typeof DEMO_ASSETS> = {
  'ui-kits': 'uiElements',
  'user-interface': 'uiElements',
  'icons': 'icons',
  'games': 'gameAssets',
  '2d-graphics': 'gameAssets',
  'characters': 'characters',
  'vehicles': 'vehicles',
  'weapons': 'weapons',
  'nature': 'nature',
  'buildings': 'buildings',
  'assets': 'uiElements',
  'tools': 'uiElements',
  'mockups': 'uiElements',
  'illustrations': 'characters',
  'fonts': 'uiElements',
  'themes': 'uiElements',
  'coded-templates': 'uiElements',
  'starter-kits': 'gameAssets'
}

// Generate placeholder image URLs using a service like picsum or placeholder services
export function getPlaceholderImage(width: number = 400, height: number = 300, _seed?: string): string {
  // Simple random color selection
  const colors = ['4169E1', '10B981', 'F59E0B', 'EF4444', '8B5CF6', '06B6D4', 'EC4899', '84CC16']
  const color = colors[Math.floor(Math.random() * colors.length)]

  // Use a more reliable placeholder service
  return `https://via.placeholder.com/${width}x${height}/${color}/ffffff?text=UI8`
}

// Generate avatar placeholder
export function getPlaceholderAvatar(name: string, size: number = ASSETS.defaultAvatarSize): string {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=4169E1&color=fff&font-size=0.4`
}

// Get real demo asset image based on category and product
export function getDemoAssetImage(categorySlug?: string, productId?: string, index: number = 0): string {
  // Default to uiElements if no category or unknown category
  const assetCategory = categorySlug && CATEGORY_ASSET_MAP[categorySlug] ? CATEGORY_ASSET_MAP[categorySlug] : 'uiElements'
  const assets = DEMO_ASSETS[assetCategory]

  // Use productId hash or index to select a consistent image for each product
  let assetIndex = index % assets.length
  if (productId) {
    // Simple hash function to ensure same product always gets same image
    const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    assetIndex = hash % assets.length
  }

  return assets[assetIndex]
}

// Get product placeholder images - Now uses real demo assets
export function getProductPlaceholder(productId?: string, index: number = 0, categorySlug?: string): string {
  return getDemoAssetImage(categorySlug, productId, index)
}

// Get category-specific demo asset
export function getCategoryAsset(categorySlug: string, index: number = 0): string {
  return getDemoAssetImage(categorySlug, undefined, index)
}

// Get author avatar placeholder
export function getAuthorAvatar(authorName: string): string {
  return getPlaceholderAvatar(authorName, 128)
}

// Sample product descriptions
export const sampleDescriptions = {
  uiKits: [
    'A comprehensive UI kit with modern design components for mobile and web applications. Includes buttons, forms, navigation, and data visualization elements.',
    'Complete design system with carefully crafted components, icons, and layouts. Perfect for creating professional interfaces quickly.',
    'Modern and clean UI kit featuring contemporary design trends. Includes dark and light modes with extensive customization options.'
  ],
  templates: [
    'Fully coded template ready for production use. Built with modern frameworks and best practices for performance and accessibility.',
    'Responsive template with clean code structure and documentation. Easily customizable to match your brand requirements.',
    'Professional template with advanced features and smooth animations. Optimized for fast loading and great user experience.'
  ],
  mockups: [
    'High-quality mockup collection for showcasing your designs professionally. Includes multiple angles and realistic lighting.',
    'Premium mockup set with smart objects for easy customization. Perfect for client presentations and portfolio displays.',
    'Realistic device mockups with customizable backgrounds and environments. Ideal for app and website presentations.'
  ],
  illustrations: [
    'Beautiful illustration set with consistent style and color palette. Perfect for websites, apps, and marketing materials.',
    'Hand-crafted illustrations with attention to detail. Available in multiple formats including SVG and PNG.',
    'Creative illustration collection with modern style. Easily customizable colors and perfect for digital projects.'
  ],
  'ui-kits': [
    'A comprehensive UI kit with modern design components for mobile and web applications. Includes buttons, forms, navigation, and data visualization elements.',
    'Complete design system with carefully crafted components, icons, and layouts. Perfect for creating professional interfaces quickly.',
    'Modern and clean UI kit featuring contemporary design trends. Includes dark and light modes with extensive customization options.'
  ],
  'games': [
    'High-quality game assets perfect for indie developers and studios. Includes sprites, backgrounds, and complete art sets.',
    'Professional game graphics with consistent art style. Optimized for performance and easy integration.',
    'Complete game asset collection with characters, environments, and UI elements. Ready for immediate use in your projects.'
  ],
  'icons': [
    'Comprehensive icon collection with modern design language. Perfect for web and mobile applications.',
    'High-quality vector icons with consistent styling. Available in multiple formats and sizes.',
    'Professional icon set designed for user interfaces. Includes dark and light variants.'
  ]
}

// Get sample description based on category
export function getSampleDescription(category: string, _productTitle?: string): string {
  const categoryDescriptions = sampleDescriptions[category as keyof typeof sampleDescriptions] || sampleDescriptions.uiKits
  // Simple random selection instead of complex hash-based generation
  return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)]
}

// Generate realistic product stats
export function generateProductStats(_productId?: string, category?: string) {
  // Simple random generation with realistic ranges
  const baseViews = Math.floor(Math.random() * 5000) + 1000 // 1000-6000 views
  const baseDownloads = Math.floor(baseViews * (0.1 + Math.random() * 0.1)) // 10-20% conversion
  const baseLikes = Math.floor(baseDownloads * (0.3 + Math.random() * 0.2)) // 30-50% like rate

  // Simple category-based multipliers
  const categoryMultipliers: Record<string, number> = {
    'ui-kits': 1.5,
    'templates': 1.2,
    'mockups': 1.0,
    'illustrations': 0.8,
    'games': 1.3,
    'icons': 1.1
  }

  const multiplier = category ? (categoryMultipliers[category] || 1.0) : 1.0

  const reviewsCount = Math.floor(baseLikes * 0.1) // 10% of likes leave reviews

  return {
    views: Math.floor(baseViews * multiplier),
    downloads: Math.floor(baseDownloads * multiplier),
    likes: Math.floor(baseLikes * multiplier),
    rating: 4.0 + Math.random(), // 4.0 - 5.0 rating
    reviews: reviewsCount,
    reviewsCount: reviewsCount
  }
}

// Generate realistic pricing
export function generatePrice(category: string, featured: boolean = false): number {
  const basePrices = {
    'ui-kits': [29, 39, 49, 59, 69],
    'templates': [19, 29, 39, 49],
    'mockups': [9, 14, 19, 24],
    'illustrations': [15, 25, 35, 45],
    'games': [25, 35, 45, 55],
    'icons': [15, 20, 25, 30]
  }

  const prices = basePrices[category as keyof typeof basePrices] || basePrices['ui-kits']
  const basePrice = prices[Math.floor(Math.random() * prices.length)]

  // Featured products can be slightly more expensive
  return featured ? basePrice + 10 : basePrice
}

// Format placeholders for specific contexts
export const contextualPlaceholders = {
  profile: {
    bio: 'Creative designer passionate about user experience and beautiful interfaces',
    website: 'https://mywebsite.com',
    location: 'San Francisco, CA'
  },
  author: {
    name: 'UI8 Studio',
    email: 'contact@ui8.net',
    portfolio: 'https://myportfolio.com',
    additionalInfo: 'Professional design studio specializing in modern UI/UX'
  },
  newsletter: {
    email: 'designer@example.com',
    placeholder: 'Enter your email to get notified about new UI8 releases'
  }
}
