import { Product, Category, Author, FAQ, SearchFilters } from '@/types'
import { CATEGORIES } from '@/config/constants'
import {
  getAuthorAvatar,
  getProductPlaceholder,
  getCategoryAsset,
  getSampleDescription,
  generateProductStats,
  generatePrice
} from '@/lib/placeholders'

// Mock Authors - Using placeholder avatars
export const mockAuthors: Author[] = [
  {
    id: '1',
    name: 'UI8 Studio',
    avatar: getAuthorAvatar('UI8 Studio'),
    bio: 'Premium UI design resources and templates for modern applications',
    website: 'https://ui8.net',
    stats: {
      totalSales: 5000,
      totalEarnings: 150000,
      averageRating: 4.8,
      followers: 12500
    },
    isVerified: true,
    isFeatured: true,
    productsCount: 45,
    createdAt: '2020-01-01',
    updatedAt: '2024-12-01',
    slug: 'ui8-studio'
  },
  {
    id: '2',
    name: 'Creative Labs',
    avatar: getAuthorAvatar('Creative Labs'),
    bio: 'Mobile UI specialist and design system creator',
    stats: {
      totalSales: 2500,
      totalEarnings: 75000,
      averageRating: 4.7,
      followers: 8500
    },
    isVerified: true,
    isFeatured: false,
    productsCount: 28,
    createdAt: '2021-03-15',
    updatedAt: '2024-11-28',
    slug: 'creative-labs'
  },
  {
    id: '3',
    name: 'Design Masters',
    avatar: getAuthorAvatar('Design Masters'),
    bio: 'Professional design team creating high-quality mockups and illustrations',
    stats: {
      totalSales: 1200,
      totalEarnings: 36000,
      averageRating: 4.5,
      followers: 3200
    },
    isVerified: true,
    isFeatured: false,
    productsCount: 18,
    createdAt: '2022-06-10',
    updatedAt: '2024-11-20',
    slug: 'design-masters'
  },
  {
    id: '4',
    name: 'Game Studio Pro',
    avatar: getAuthorAvatar('Game Studio Pro'),
    bio: 'Professional game asset creators specializing in 2D graphics and animations',
    stats: {
      totalSales: 3200,
      totalEarnings: 96000,
      averageRating: 4.9,
      followers: 15800
    },
    isVerified: true,
    isFeatured: true,
    productsCount: 52,
    createdAt: '2019-08-20',
    updatedAt: '2024-12-01',
    slug: 'game-studio-pro'
  },
  {
    id: '5',
    name: 'Kenney Assets',
    avatar: getAuthorAvatar('Kenney Assets'),
    bio: 'The largest collection of free game assets, sprites, and UI elements',
    stats: {
      totalSales: 8500,
      totalEarnings: 0, // Free assets
      averageRating: 4.8,
      followers: 42000
    },
    isVerified: true,
    isFeatured: true,
    productsCount: 120,
    createdAt: '2018-01-01',
    updatedAt: '2024-12-01',
    slug: 'kenney-assets'
  }
]

// Mock Categories - Generated from constants
export const mockCategories: Category[] = Object.entries(CATEGORIES).map(([slug, config], index) => ({
  id: (index + 1).toString(),
  name: config.name,
  slug,
  description: config.description,
  icon: config.icon,
  color: config.color,
  productCount: config.productCount,
  isActive: true,
  order: index + 1,
  createdAt: '2024-01-01',
  updatedAt: '2024-12-01'
}))

// Helper function to create a product with proper category-based images
function createProduct(
  id: string,
  title: string,
  categorySlug: string,
  authorId: string,
  price: number,
  options: {
    featured?: boolean,
    freebie?: boolean,
    shortDesc?: string,
    fileTypes?: string[]
  } = {}
): Product {
  const category = mockCategories.find(cat => cat.slug === categorySlug)
  const author = mockAuthors.find(auth => auth.id === authorId)

  return {
    id,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: getSampleDescription(categorySlug as any, title),
    shortDescription: options.shortDesc || `Professional ${title.toLowerCase()} for your creative projects`,
    price: options.freebie ? 0 : price,
    currency: 'USD',
    images: [
      {
        id: `${id}-1`,
        url: getProductPlaceholder(id, 0, categorySlug),
        alt: title,
        width: 800,
        height: 600,
        isPrimary: true
      },
      {
        id: `${id}-2`,
        url: getProductPlaceholder(id, 1, categorySlug),
        alt: `${title} - Alternative view`,
        width: 800,
        height: 600,
        isPrimary: false
      }
    ],
    categories: category ? [category] : [],
    author: author || null,
    tags: [
      { id: `tag-${id}-1`, name: categorySlug, productCount: 100, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
      { id: `tag-${id}-2`, name: 'design', productCount: 500, createdAt: '2024-01-01', updatedAt: '2024-12-01' },
      { id: `tag-${id}-3`, name: 'creative', productCount: 300, createdAt: '2024-01-01', updatedAt: '2024-12-01' }
    ],
    featured: options.featured || false,
    freebie: options.freebie || false,
    status: 'published',
    compatibleWith: options.fileTypes || ['Photoshop', 'Figma', 'Sketch'],
    fileTypes: options.fileTypes || ['PSD', 'AI', 'PNG'],
    license: options.freebie ? 'free' : 'standard',
    fileSize: Math.floor(Math.random() * 100) + 10 + ' MB',
    version: '1.0',
    lastUpdated: '2024-12-01',
    stats: generateProductStats(),
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01'
  }
}

// Mock Products - Using real Kenney asset images with proper category mapping
export const mockProducts: Product[] = [
  // UI Kits & Interface
  createProduct('1', 'Premium UI Kit Collection', 'ui-kits', '1', 89, {
    featured: true,
    shortDesc: 'Complete UI components for modern applications',
    fileTypes: ['Figma', 'Sketch', 'XD']
  }),
  createProduct('2', 'Modern Interface Elements', 'user-interface', '2', 59, {
    shortDesc: 'Clean and modern UI elements for web and mobile'
  }),
  createProduct('3', 'RPG UI Pack', 'ui-kits', '4', 45, {
    shortDesc: 'Fantasy game interface elements and components'
  }),
  createProduct('4', 'Space UI Elements', 'user-interface', '1', 35, {
    shortDesc: 'Futuristic interface design for sci-fi games'
  }),

  // Game Assets
  createProduct('5', 'Platformer Game Assets', 'games', '4', 75, {
    featured: true,
    shortDesc: '2D platformer sprites and backgrounds',
    fileTypes: ['PNG', 'SVG', 'PSD']
  }),
  createProduct('6', 'Pixel Art Redux Pack', '2d-graphics', '5', 0, {
    freebie: true,
    shortDesc: 'Free pixel art collection for indie games'
  }),
  createProduct('7', 'Abstract Platformer Pack', 'games', '4', 55, {
    shortDesc: 'Minimalist game assets with abstract design'
  }),
  createProduct('8', 'Deluxe Platformer Art', '2d-graphics', '5', 0, {
    freebie: true,
    shortDesc: 'High-quality 2D game sprites and tiles'
  }),

  // Icons
  createProduct('9', 'Game Icons Collection', 'icons', '5', 0, {
    freebie: true,
    shortDesc: 'Comprehensive game icon library',
    fileTypes: ['PNG', 'SVG', 'ICO']
  }),
  createProduct('10', 'Board Game Icons', 'icons', '3', 25, {
    shortDesc: 'Professional icons for board games and apps'
  }),
  createProduct('11', 'Input Prompts Pack', 'icons', '5', 0, {
    freebie: true,
    shortDesc: 'Controller and keyboard input icons'
  }),
  createProduct('12', 'UI Icons Extended', 'icons', '1', 39, {
    shortDesc: 'Extended collection of interface icons'
  }),

  // Characters & Vehicles
  createProduct('13', 'Toon Characters Pack', 'characters', '4', 65, {
    shortDesc: 'Cartoon-style character sprites for games'
  }),
  createProduct('14', 'Racing Car Collection', 'vehicles', '4', 49, {
    shortDesc: 'Top-down racing car sprites and assets'
  }),
  createProduct('15', 'Animal Pack Redux', 'characters', '5', 0, {
    freebie: true,
    shortDesc: 'Cute animal characters for all ages'
  }),
  createProduct('16', 'Mini Car Kit', 'vehicles', '2', 29, {
    shortDesc: 'Small vehicle collection for mobile games'
  }),

  // Tools & Utilities
  createProduct('17', 'Design System Pro', 'tools', '1', 120, {
    featured: true,
    shortDesc: 'Complete design system with tokens and guidelines',
    fileTypes: ['Figma', 'Tokens', 'CSS']
  }),
  createProduct('18', 'Asset Generator Tool', 'tools', '2', 79, {
    shortDesc: 'Automated asset generation and optimization'
  }),

  // Weapons & Nature
  createProduct('19', 'Weapon Pack Collection', 'weapons', '4', 55, {
    shortDesc: 'Fantasy and modern weapon sprites'
  }),
  createProduct('20', 'Nature Pack Extended', 'nature', '5', 0, {
    freebie: true,
    shortDesc: 'Trees, rocks, and natural environment assets'
  }),
  createProduct('21', 'Blaster Kit', 'weapons', '4', 35, {
    shortDesc: 'Sci-fi weapon collection with effects'
  }),
  createProduct('22', 'Background Elements', 'nature', '3', 42, {
    shortDesc: 'Environmental elements for game backgrounds'
  }),

  // Buildings & Architecture
  createProduct('23', 'Building Kit Pro', 'buildings', '4', 68, {
    shortDesc: 'Modular building components for city scenes'
  }),
  createProduct('24', 'Tower Defense Kit', 'buildings', '2', 59, {
    shortDesc: 'Towers, paths, and TD game elements'
  }),
  createProduct('25', 'Mini Dungeon Pack', 'buildings', '5', 0, {
    freebie: true,
    shortDesc: 'Dungeon tiles and architectural elements'
  }),
  createProduct('26', 'Tiny Town Collection', 'buildings', '3', 45, {
    shortDesc: 'Small town buildings and structures'
  }),

  // Additional Assets
  createProduct('27', 'Sketch Tiles Pack', 'assets', '5', 0, {
    freebie: true,
    shortDesc: 'Hand-drawn style tiles and elements'
  }),
  createProduct('28', 'Mockup Studio Pro', 'mockups', '1', 149, {
    featured: true,
    shortDesc: 'Professional mockup collection for presentations'
  }),
  createProduct('29', 'Font Bundle Ultimate', 'fonts', '3', 89, {
    shortDesc: 'Premium font collection for designers'
  }),
  createProduct('30', 'Illustration Kit', 'illustrations', '2', 75, {
    shortDesc: 'Vector illustrations for web and mobile'
  })
]

// Mock FAQs
export const mockFAQs: FAQ[] = [
  {
    id: '1',
    question: 'What is the acceptance criteria?',
    answer: 'New product submissions are accepted based on the overall level of quality, polish, usability and value. Please browse some of our featured products to get a better sense of the type of products we typically approved to be released on our platform.',
    category: 'General',
    order: 1,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01'
  },
  {
    id: '2',
    question: 'How much do I earn for sales?',
    answer: 'Your products will be available to customers through two options: by purchasing it individually or with an all-access pass. For individual purchases, you earn 70% on each sale and 2% of the value of your product for each unique download. Typically, individual purchases generate 85-95% of your revenue.',
    category: 'Earnings',
    order: 2,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01'
  },
  {
    id: '3',
    question: 'When and how do I get paid?',
    answer: 'Payments are fully automated via PayPal, taking place at the end of each month as long as you have a minimum balance of $100.00 in your account. Please be sure to update your payment settings with a valid PayPal email address to avoid delays.',
    category: 'Payments',
    order: 3,
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01'
  }
]

// Data access functions (these will be replaced with API calls)
export const getProducts = async (filters?: SearchFilters): Promise<Product[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockProducts
}

export const getProductById = async (id: string): Promise<Product | null> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  // Handle both ID and slug lookups
  return mockProducts.find(p => p.id === id || p.slug === id) || null
}

export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockCategories
}

export const getFAQs = async (): Promise<FAQ[]> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockFAQs
}

export const getAuthors = async (): Promise<Author[]> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockAuthors
}
