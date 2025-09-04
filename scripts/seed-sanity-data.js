import { createClient } from '@sanity/client'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'f9wm82yi',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token: process.env.SANITY_API_READ_TOKEN || 'skf7ZcyGQOOWFKOc5hRjagnRlFjiVMl8EUzNiUAVT3r2J4u8XlL6guFE6GdDYh2j2ZuxylNVnALtVCCt9DEIwQ9Llbgy0DdhJHiA8QQRpz5FTveEqkfuP31uluv9i0uNiHf5h8abdqA6NpdKVOuhLtkwpfNRug4zYzGw6uZAJVtvBfyynELG',
  useCdn: false
})

// Helper function to create slug
const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Sample data
const categories = [
  {
    name: 'UI Kits',
    description: 'Complete design systems and UI components for web and mobile',
    icon: '🎨',
    color: '#4169E1',
    order: 1
  },
  {
    name: 'Coded Templates',
    description: 'Ready-to-use coded solutions and development frameworks',
    icon: '💻',
    color: '#10B981',
    order: 2
  },
  {
    name: 'Mockups',
    description: 'Device and scene mockups for presenting your designs',
    icon: '📱',
    color: '#F59E0B',
    order: 3
  },
  {
    name: 'Illustrations',
    description: 'Vector and raster illustrations for web and print',
    icon: '🎭',
    color: '#EF4444',
    order: 4
  },
  {
    name: 'Fonts',
    description: 'Premium typography and font families',
    icon: '🔤',
    color: '#8B5CF6',
    order: 5
  },
  {
    name: 'Wireframes',
    description: 'Wireframe kits and templates for rapid prototyping',
    icon: '📐',
    color: '#6B7280',
    order: 6
  },
  {
    name: 'Presentations',
    description: 'Professional presentation templates and slide decks',
    icon: '📊',
    color: '#F97316',
    order: 7
  },
  {
    name: '3D Assets',
    description: '3D models, scenes, and rendered graphics',
    icon: '🎲',
    color: '#06B6D4',
    order: 8
  },
  {
    name: 'Icon Sets',
    description: 'Comprehensive icon collections and libraries',
    icon: '⭐',
    color: '#84CC16',
    order: 9
  },
  {
    name: 'Themes',
    description: 'Complete website themes and templates',
    icon: '🌈',
    color: '#EC4899',
    order: 10
  },
  {
    name: 'Freebies',
    description: 'Free design resources and sample packs',
    icon: '🎁',
    color: '#14B8A6',
    order: 11
  }
]

const authors = [
  {
    name: 'UI8',
    bio: 'Premium UI design resources and comprehensive design systems for modern applications.',
    website: 'https://ui8.net',
    isVerified: true,
    isFeatured: true,
    stats: {
      totalSales: 15000,
      totalEarnings: 450000,
      averageRating: 4.9,
      followers: 25000
    },
    socialLinks: {
      dribbble: 'https://dribbble.com/ui8',
      instagram: 'https://instagram.com/ui8net',
      twitter: 'https://twitter.com/ui8'
    },
    specialties: ['ui-design', 'web-design', 'mobile-design']
  },
  {
    name: 'Design Studio X',
    bio: 'Mobile-first UI specialists creating cutting-edge interfaces for iOS and Android applications.',
    website: 'https://designstudiox.com',
    isVerified: true,
    isFeatured: true,
    stats: {
      totalSales: 8500,
      totalEarnings: 255000,
      averageRating: 4.8,
      followers: 18500
    },
    socialLinks: {
      dribbble: 'https://dribbble.com/designstudiox',
      behance: 'https://behance.net/designstudiox'
    },
    specialties: ['mobile-design', 'ui-design', 'ux-design']
  },
  {
    name: 'Creative Labs',
    bio: 'Illustration and 3D experts crafting beautiful visual content for digital and print media.',
    website: 'https://creativelabs.design',
    isVerified: true,
    isFeatured: false,
    stats: {
      totalSales: 6200,
      totalEarnings: 186000,
      averageRating: 4.7,
      followers: 12400
    },
    socialLinks: {
      behance: 'https://behance.net/creativelabs',
      instagram: 'https://instagram.com/creativelabs'
    },
    specialties: ['illustration', '3d-design', 'branding']
  },
  {
    name: 'Code Masters',
    bio: 'Development template specialists providing high-quality coded solutions and frameworks.',
    website: 'https://codemasters.dev',
    isVerified: true,
    isFeatured: false,
    stats: {
      totalSales: 4800,
      totalEarnings: 144000,
      averageRating: 4.6,
      followers: 9600
    },
    socialLinks: {
      twitter: 'https://twitter.com/codemasters',
      linkedin: 'https://linkedin.com/company/codemasters'
    },
    specialties: ['development', 'web-design', 'ui-design']
  },
  {
    name: 'Brand Works',
    bio: 'Branding and identity specialists creating cohesive brand experiences across all touchpoints.',
    website: 'https://brandworks.studio',
    isVerified: true,
    isFeatured: false,
    stats: {
      totalSales: 3200,
      totalEarnings: 96000,
      averageRating: 4.8,
      followers: 7800
    },
    socialLinks: {
      dribbble: 'https://dribbble.com/brandworks',
      behance: 'https://behance.net/brandworks'
    },
    specialties: ['branding', 'typography', 'illustration']
  },
  {
    name: 'Minimal Co',
    bio: 'Clean, minimal design philosophy focusing on simplicity and elegant user experiences.',
    website: 'https://minimal.co',
    isVerified: false,
    isFeatured: false,
    stats: {
      totalSales: 2100,
      totalEarnings: 63000,
      averageRating: 4.5,
      followers: 5200
    },
    socialLinks: {
      dribbble: 'https://dribbble.com/minimalco',
      instagram: 'https://instagram.com/minimal.co'
    },
    specialties: ['ui-design', 'web-design', 'typography']
  }
]

const tags = [
  'Mobile', 'Dashboard', 'E-commerce', 'SaaS', 'Landing Page', 'Admin Panel',
  'Dark Mode', 'Light Mode', 'Responsive', 'Modern', 'Minimal', 'Corporate',
  'Creative', 'Portfolio', 'Blog', 'Healthcare', 'Finance', 'Education',
  'Food', 'Travel', 'Real Estate', 'Social Media', 'Music', 'Gaming',
  'Fitness', 'News', 'Photography', 'Fashion', 'Technology', 'Business'
]

const products = [
  // UI Kits
  {
    title: 'Shadow VPN Mobile UI Kit',
    description: 'Complete VPN mobile app UI kit with modern design, smooth animations, and comprehensive screens for iOS and Android.',
    shortDescription: 'Modern VPN mobile app UI kit with 50+ screens',
    price: 69,
    currency: 'USD',
    category: 'UI Kits',
    author: 'Design Studio X',
    featured: true,
    freebie: false,
    compatibleWith: ['Figma', 'Sketch', 'Adobe XD'],
    fileTypes: ['fig', 'sketch', 'xd'],
    license: 'standard',
    stats: {
      views: 8500,
      downloads: 145,
      likes: 289,
      rating: 4.8,
      reviewsCount: 42
    },
    tags: ['Mobile', 'VPN', 'Dark Mode', 'Modern']
  },
  {
    title: 'DashKit Pro - Admin Dashboard UI',
    description: 'Professional admin dashboard UI kit with comprehensive components, charts, and data visualization elements.',
    shortDescription: 'Complete admin dashboard with 80+ components',
    price: 89,
    currency: 'USD',
    category: 'UI Kits',
    author: 'UI8',
    featured: true,
    freebie: false,
    compatibleWith: ['Figma', 'Sketch'],
    fileTypes: ['fig', 'sketch'],
    license: 'standard',
    stats: {
      views: 12400,
      downloads: 234,
      likes: 456,
      rating: 4.9,
      reviewsCount: 67
    },
    tags: ['Dashboard', 'Admin Panel', 'Charts', 'Corporate']
  },
  {
    title: 'E-Shop Mobile Commerce UI',
    description: 'Complete e-commerce mobile app UI kit with shopping cart, product listings, checkout flow, and user profiles.',
    shortDescription: 'Full-featured e-commerce mobile UI kit',
    price: 75,
    currency: 'USD',
    category: 'UI Kits',
    author: 'UI8',
    featured: false,
    freebie: false,
    compatibleWith: ['Figma', 'Adobe XD'],
    fileTypes: ['fig', 'xd'],
    license: 'standard',
    stats: {
      views: 9800,
      downloads: 178,
      likes: 334,
      rating: 4.7,
      reviewsCount: 53
    },
    tags: ['Mobile', 'E-commerce', 'Shopping', 'Modern']
  },
  {
    title: 'FinTech Banking App UI Kit',
    description: 'Modern banking and fintech app UI kit with account management, transactions, and financial dashboard screens.',
    shortDescription: 'Banking app UI with financial dashboard',
    price: 95,
    currency: 'USD',
    category: 'UI Kits',
    author: 'Design Studio X',
    featured: false,
    freebie: false,
    compatibleWith: ['Figma', 'Sketch'],
    fileTypes: ['fig', 'sketch'],
    license: 'standard',
    stats: {
      views: 6700,
      downloads: 98,
      likes: 187,
      rating: 4.6,
      reviewsCount: 29
    },
    tags: ['Mobile', 'Finance', 'Banking', 'Dashboard']
  },

  // Coded Templates
  {
    title: 'NextJS SaaS Starter Template',
    description: 'Complete NextJS SaaS application template with authentication, payments, dashboard, and user management.',
    shortDescription: 'Production-ready NextJS SaaS template',
    price: 149,
    currency: 'USD',
    category: 'Coded Templates',
    author: 'Code Masters',
    featured: true,
    freebie: false,
    compatibleWith: ['React', 'NextJS'],
    fileTypes: ['jsx', 'ts', 'css'],
    license: 'standard',
    stats: {
      views: 15600,
      downloads: 287,
      likes: 512,
      rating: 4.9,
      reviewsCount: 78
    },
    tags: ['SaaS', 'NextJS', 'React', 'Dashboard']
  },
  {
    title: 'Vue.js E-commerce Template',
    description: 'Modern e-commerce template built with Vue.js, including product catalog, shopping cart, and checkout process.',
    shortDescription: 'Vue.js e-commerce with full functionality',
    price: 129,
    currency: 'USD',
    category: 'Coded Templates',
    author: 'Code Masters',
    featured: false,
    freebie: false,
    compatibleWith: ['Vue.js', 'Nuxt.js'],
    fileTypes: ['vue', 'js', 'css'],
    license: 'standard',
    stats: {
      views: 8900,
      downloads: 156,
      likes: 267,
      rating: 4.7,
      reviewsCount: 41
    },
    tags: ['E-commerce', 'Vue.js', 'Shopping', 'Modern']
  },
  {
    title: 'React Admin Dashboard',
    description: 'Comprehensive React admin dashboard with charts, tables, forms, and user management components.',
    shortDescription: 'Full-featured React admin dashboard',
    price: 99,
    currency: 'USD',
    category: 'Coded Templates',
    author: 'Code Masters',
    featured: false,
    freebie: false,
    compatibleWith: ['React', 'TypeScript'],
    fileTypes: ['jsx', 'ts', 'css'],
    license: 'standard',
    stats: {
      views: 11200,
      downloads: 198,
      likes: 356,
      rating: 4.8,
      reviewsCount: 52
    },
    tags: ['Dashboard', 'React', 'Admin Panel', 'Charts']
  },

  // Mockups
  {
    title: '3D iPhone 15 Pro Mockup Collection',
    description: '12 high-quality 3D iPhone 15 Pro mockups in various angles and perspectives for showcasing mobile apps.',
    shortDescription: '12 premium iPhone 15 Pro 3D mockups',
    price: 29,
    currency: 'USD',
    category: 'Mockups',
    author: 'Creative Labs',
    featured: false,
    freebie: false,
    compatibleWith: ['Photoshop', 'After Effects'],
    fileTypes: ['psd', 'aep'],
    license: 'standard',
    stats: {
      views: 7800,
      downloads: 234,
      likes: 445,
      rating: 4.8,
      reviewsCount: 89
    },
    tags: ['iPhone', '3D', 'Mobile', 'Modern']
  },
  {
    title: 'MacBook Pro M3 Workspace Mockups',
    description: 'Professional workspace mockups featuring the new MacBook Pro M3 in realistic office environments.',
    shortDescription: 'MacBook Pro M3 workspace mockups',
    price: 35,
    currency: 'USD',
    category: 'Mockups',
    author: 'Creative Labs',
    featured: false,
    freebie: false,
    compatibleWith: ['Photoshop', 'Sketch'],
    fileTypes: ['psd', 'sketch'],
    license: 'standard',
    stats: {
      views: 5600,
      downloads: 167,
      likes: 289,
      rating: 4.7,
      reviewsCount: 45
    },
    tags: ['MacBook', 'Workspace', 'Professional', 'Modern']
  },
  {
    title: 'Branding Identity Mockup Bundle',
    description: 'Complete branding mockup bundle with business cards, letterheads, packaging, and signage mockups.',
    shortDescription: 'Complete branding mockup collection',
    price: 45,
    currency: 'USD',
    category: 'Mockups',
    author: 'Brand Works',
    featured: false,
    freebie: false,
    compatibleWith: ['Photoshop', 'Illustrator'],
    fileTypes: ['psd', 'ai'],
    license: 'standard',
    stats: {
      views: 4200,
      downloads: 98,
      likes: 178,
      rating: 4.6,
      reviewsCount: 32
    },
    tags: ['Branding', 'Identity', 'Business', 'Professional']
  },

  // Illustrations
  {
    title: '3D Character Illustration Pack',
    description: 'Collection of 24 3D character illustrations in various poses and expressions, perfect for web and mobile apps.',
    shortDescription: '24 3D character illustrations',
    price: 59,
    currency: 'USD',
    category: 'Illustrations',
    author: 'Creative Labs',
    featured: true,
    freebie: false,
    compatibleWith: ['Illustrator', 'After Effects', 'Blender'],
    fileTypes: ['ai', 'aep', 'blend'],
    license: 'standard',
    stats: {
      views: 9400,
      downloads: 189,
      likes: 378,
      rating: 4.8,
      reviewsCount: 67
    },
    tags: ['3D', 'Characters', 'Modern', 'Creative']
  },
  {
    title: 'Isometric Office Illustrations',
    description: 'Modern isometric office and workspace illustrations including furniture, people, and technology elements.',
    shortDescription: 'Isometric office illustration set',
    price: 39,
    currency: 'USD',
    category: 'Illustrations',
    author: 'Creative Labs',
    featured: false,
    freebie: false,
    compatibleWith: ['Illustrator', 'Figma'],
    fileTypes: ['ai', 'fig'],
    license: 'standard',
    stats: {
      views: 6800,
      downloads: 145,
      likes: 256,
      rating: 4.7,
      reviewsCount: 38
    },
    tags: ['Isometric', 'Office', 'Business', 'Modern']
  },

  // Fonts
  {
    title: 'Moderne Sans Font Family',
    description: 'Complete sans-serif font family with 18 weights and styles, perfect for modern branding and web design.',
    shortDescription: 'Modern sans-serif with 18 weights',
    price: 79,
    currency: 'USD',
    category: 'Fonts',
    author: 'Brand Works',
    featured: false,
    freebie: false,
    compatibleWith: ['Web Fonts', 'Desktop'],
    fileTypes: ['otf', 'woff', 'woff2'],
    license: 'standard',
    stats: {
      views: 5200,
      downloads: 89,
      likes: 167,
      rating: 4.9,
      reviewsCount: 23
    },
    tags: ['Sans-serif', 'Modern', 'Branding', 'Typography']
  },
  {
    title: 'Elegant Serif Display Font',
    description: 'Sophisticated serif display font with elegant curves and classic appeal, ideal for luxury branding.',
    shortDescription: 'Elegant serif for luxury branding',
    price: 49,
    currency: 'USD',
    category: 'Fonts',
    author: 'Brand Works',
    featured: false,
    freebie: false,
    compatibleWith: ['Web Fonts', 'Desktop'],
    fileTypes: ['otf', 'woff', 'woff2'],
    license: 'standard',
    stats: {
      views: 3800,
      downloads: 67,
      likes: 134,
      rating: 4.8,
      reviewsCount: 19
    },
    tags: ['Serif', 'Display', 'Luxury', 'Elegant']
  },

  // Wireframes
  {
    title: 'Mobile App Wireframe Kit',
    description: 'Comprehensive mobile app wireframe kit with 100+ screens covering common app patterns and user flows.',
    shortDescription: '100+ mobile wireframe screens',
    price: 35,
    currency: 'USD',
    category: 'Wireframes',
    author: 'Minimal Co',
    featured: false,
    freebie: false,
    compatibleWith: ['Figma', 'Sketch', 'Adobe XD'],
    fileTypes: ['fig', 'sketch', 'xd'],
    license: 'standard',
    stats: {
      views: 4600,
      downloads: 123,
      likes: 234,
      rating: 4.6,
      reviewsCount: 34
    },
    tags: ['Mobile', 'Wireframes', 'UX', 'Prototyping']
  },

  // Presentations
  {
    title: 'Startup Pitch Deck Template',
    description: 'Professional startup pitch deck template with 40 unique slides designed to impress investors.',
    shortDescription: 'Professional startup pitch deck',
    price: 45,
    currency: 'USD',
    category: 'Presentations',
    author: 'Brand Works',
    featured: false,
    freebie: false,
    compatibleWith: ['PowerPoint', 'Keynote', 'Google Slides'],
    fileTypes: ['pptx', 'key', 'gslides'],
    license: 'standard',
    stats: {
      views: 6200,
      downloads: 156,
      likes: 298,
      rating: 4.7,
      reviewsCount: 43
    },
    tags: ['Startup', 'Pitch Deck', 'Business', 'Professional']
  },

  // 3D Assets
  {
    title: '3D Icon Pack - Business & Finance',
    description: 'Collection of 60 3D icons covering business and finance topics with multiple formats and styles.',
    shortDescription: '60 3D business & finance icons',
    price: 55,
    currency: 'USD',
    category: '3D Assets',
    author: 'Creative Labs',
    featured: false,
    freebie: false,
    compatibleWith: ['Blender', 'Cinema 4D', 'After Effects'],
    fileTypes: ['blend', 'c4d', 'aep'],
    license: 'standard',
    stats: {
      views: 5800,
      downloads: 134,
      likes: 267,
      rating: 4.8,
      reviewsCount: 38
    },
    tags: ['3D', 'Icons', 'Business', 'Finance']
  },

  // Icon Sets
  {
    title: 'Outline Icon Library - 500 Icons',
    description: 'Comprehensive outline icon library with 500 carefully crafted icons covering all major categories.',
    shortDescription: '500 outline icons in multiple formats',
    price: 29,
    currency: 'USD',
    category: 'Icon Sets',
    author: 'Minimal Co',
    featured: false,
    freebie: false,
    compatibleWith: ['Figma', 'Sketch', 'Illustrator'],
    fileTypes: ['fig', 'sketch', 'ai', 'svg'],
    license: 'standard',
    stats: {
      views: 8900,
      downloads: 267,
      likes: 445,
      rating: 4.9,
      reviewsCount: 78
    },
    tags: ['Icons', 'Outline', 'UI', 'Interface']
  },

  // Themes
  {
    title: 'Shopify E-commerce Theme - Luxe',
    description: 'Premium Shopify theme designed for luxury brands with elegant design and advanced e-commerce features.',
    shortDescription: 'Luxury Shopify theme with advanced features',
    price: 89,
    currency: 'USD',
    category: 'Themes',
    author: 'Code Masters',
    featured: false,
    freebie: false,
    compatibleWith: ['Shopify'],
    fileTypes: ['liquid', 'css', 'js'],
    license: 'standard',
    stats: {
      views: 7400,
      downloads: 89,
      likes: 178,
      rating: 4.7,
      reviewsCount: 32
    },
    tags: ['Shopify', 'E-commerce', 'Luxury', 'Premium']
  },

  // Freebies
  {
    title: 'Free Mobile UI Kit Sample',
    description: 'Free sample from our premium mobile UI kit collection featuring 10 carefully designed screens.',
    shortDescription: 'Free mobile UI kit with 10 screens',
    price: 0,
    currency: 'USD',
    category: 'Freebies',
    author: 'UI8',
    featured: false,
    freebie: true,
    compatibleWith: ['Figma', 'Sketch'],
    fileTypes: ['fig', 'sketch'],
    license: 'free',
    stats: {
      views: 25600,
      downloads: 1240,
      likes: 2340,
      rating: 4.8,
      reviewsCount: 156
    },
    tags: ['Free', 'Mobile', 'UI Kit', 'Sample']
  },
  {
    title: 'Free Icon Set - Essential 50',
    description: 'Essential collection of 50 outline icons perfect for web and mobile interfaces, completely free.',
    shortDescription: '50 essential outline icons - free',
    price: 0,
    currency: 'USD',
    category: 'Freebies',
    author: 'Minimal Co',
    featured: false,
    freebie: true,
    compatibleWith: ['Figma', 'Sketch', 'Illustrator'],
    fileTypes: ['fig', 'sketch', 'ai', 'svg'],
    license: 'free',
    stats: {
      views: 18900,
      downloads: 890,
      likes: 1560,
      rating: 4.7,
      reviewsCount: 98
    },
    tags: ['Free', 'Icons', 'Outline', 'Essential']
  },
  {
    title: 'Free Wireframe Template Pack',
    description: 'Free wireframe template pack with 20 common screen layouts for rapid prototyping.',
    shortDescription: '20 free wireframe templates',
    price: 0,
    currency: 'USD',
    category: 'Freebies',
    author: 'Minimal Co',
    featured: false,
    freebie: true,
    compatibleWith: ['Figma', 'Sketch', 'Adobe XD'],
    fileTypes: ['fig', 'sketch', 'xd'],
    license: 'free',
    stats: {
      views: 12800,
      downloads: 645,
      likes: 987,
      rating: 4.6,
      reviewsCount: 67
    },
    tags: ['Free', 'Wireframes', 'Templates', 'Prototyping']
  }
]

const faqs = [
  {
    question: 'What is the acceptance criteria for new products?',
    answer: 'New product submissions are accepted based on the overall level of quality, polish, usability and value. Please browse some of our featured products to get a better sense of the type of products we typically approve to be released on our platform.',
    category: 'general',
    order: 1
  },
  {
    question: 'How much do I earn for sales?',
    answer: 'Your products will be available to customers through two options: by purchasing it individually or with an all-access pass. For individual purchases, you earn 70% on each sale and 2% of the value of your product for each unique download. Typically, individual purchases generate 85-95% of your revenue.',
    category: 'earnings',
    order: 2
  },
  {
    question: 'When and how do I get paid?',
    answer: 'Payments are fully automated via PayPal, taking place at the end of each month as long as you have a minimum balance of $100.00 in your account. Please be sure to update your payment settings with a valid PayPal email address to avoid delays.',
    category: 'payments',
    order: 3
  },
  {
    question: 'How long will it take to review my application?',
    answer: 'Our review process could take 1-2 business days upon submission. After the review process we will reach out to you via email with our decision and subsequent steps to open your author account.',
    category: 'general',
    order: 4
  },
  {
    question: 'How long does it take to review new product submissions?',
    answer: 'New product submission reviews are typically done within 24 hours. You will receive a notification in case the product is approved or denied. The same applies to existing product updates.',
    category: 'general',
    order: 5
  },
  {
    question: 'Can my product be excluded from the All-Access Pass?',
    answer: 'All products on our platform are accessible with the All-Access Pass and cannot be excluded. If you wish to permanently remove your products please contact support.',
    category: 'general',
    order: 6
  },
  {
    question: 'Can I sell on other marketplaces?',
    answer: 'We do not require products to be exclusively available on our platform. You\'re welcome and encouraged to release products across multiple marketplaces to maximize your exposure and earning potential.',
    category: 'general',
    order: 7
  },
  {
    question: 'How do I get my product featured?',
    answer: 'Featured products are hand-picked by our internal design team. Our selection is based on the general level of quality, polish, usability and value. You may not submit requests to get your product featured.',
    category: 'general',
    order: 8
  }
]

const siteSettings = {
  siteName: 'UI8',
  siteDescription: 'The Ultimate Marketplace for Designers',
  heroTitle: '11,475 curated design resources to speed up your creative workflow.',
  heroSubtitle: 'Join a growing family of 948,739 designers and makers from around the world.',
  heroStats: {
    totalProducts: 11475,
    totalUsers: 948739,
    totalSales: 125000
  },
  socialLinks: {
    dribbble: 'https://dribbble.com/ui8',
    instagram: 'https://www.instagram.com/ui8net/',
    twitter: 'https://twitter.com/ui8',
    email: 'mailto:info@ui8.net'
  },
  contactEmail: 'info@ui8.net',
  maintenanceMode: false,
  announcements: [
    {
      title: 'All-Access Pass On Sale',
      description: 'Get unlimited access to all design resources for a limited time',
      type: 'success',
      active: true,
      link: '/all-access'
    }
  ]
}

// Main seeding function
async function seedData() {
  console.log('🌱 Starting to seed Sanity with comprehensive data...')

  try {
    // 1. Create categories
    console.log('📂 Creating categories...')
    const createdCategories = []
    for (const category of categories) {
      const categoryDoc = {
        _type: 'category',
        name: category.name,
        slug: { _type: 'slug', current: createSlug(category.name) },
        description: category.description,
        icon: category.icon,
        color: category.color,
        order: category.order,
        isActive: true
      }
      const result = await client.create(categoryDoc)
      createdCategories.push(result)
      console.log(`✅ Created category: ${category.name}`)
    }

    // 2. Create tags
    console.log('🏷️ Creating tags...')
    const createdTags = []
    for (const tag of tags) {
      const tagDoc = {
        _type: 'tag',
        name: tag,
        slug: { _type: 'slug', current: createSlug(tag) },
        color: '#4169E1'
      }
      const result = await client.create(tagDoc)
      createdTags.push(result)
      console.log(`✅ Created tag: ${tag}`)
    }

    // 3. Create authors
    console.log('👤 Creating authors...')
    const createdAuthors = []
    for (const author of authors) {
      const authorDoc = {
        _type: 'author',
        name: author.name,
        slug: { _type: 'slug', current: createSlug(author.name) },
        bio: author.bio,
        website: author.website,
        socialLinks: author.socialLinks,
        isVerified: author.isVerified,
        isFeatured: author.isFeatured,
        stats: author.stats,
        specialties: author.specialties,
        joinedDate: new Date().toISOString()
      }
      const result = await client.create(authorDoc)
      createdAuthors.push(result)
      console.log(`✅ Created author: ${author.name}`)
    }

    // 4. Create products
    console.log('📦 Creating products...')
    for (const product of products) {
      // Find category and author references
      const categoryRef = createdCategories.find(cat => cat.name === product.category)
      const authorRef = createdAuthors.find(auth => auth.name === product.author)
      const productTags = createdTags.filter(tag => product.tags.includes(tag.name))

      const productDoc = {
        _type: 'product',
        title: product.title,
        slug: { _type: 'slug', current: createSlug(product.title) },
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        currency: product.currency,
        category: { _type: 'reference', _ref: categoryRef._id },
        author: { _type: 'reference', _ref: authorRef._id },
        tags: productTags.map(tag => ({ _type: 'reference', _ref: tag._id })),
        featured: product.featured,
        freebie: product.freebie,
        status: 'published',
        compatibleWith: product.compatibleWith,
        fileTypes: product.fileTypes,
        license: product.license,
        stats: product.stats,
        lastUpdated: new Date().toISOString()
      }

      const result = await client.create(productDoc)
      console.log(`✅ Created product: ${product.title}`)
    }

    // 5. Create FAQs
    console.log('❓ Creating FAQs...')
    for (const faq of faqs) {
      const faqDoc = {
        _type: 'faq',
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order,
        isActive: true
      }
      await client.create(faqDoc)
      console.log(`✅ Created FAQ: ${faq.question}`)
    }

    // 6. Create site settings
    console.log('⚙️ Creating site settings...')
    const siteSettingsDoc = {
      _type: 'siteSettings',
      _id: 'siteSettings',
      ...siteSettings
    }
    await client.createOrReplace(siteSettingsDoc)
    console.log('✅ Created site settings')

    console.log('🎉 Successfully seeded all data!')
    console.log(`📊 Summary:`)
    console.log(`   - ${categories.length} categories`)
    console.log(`   - ${authors.length} authors`)
    console.log(`   - ${products.length} products`)
    console.log(`   - ${tags.length} tags`)
    console.log(`   - ${faqs.length} FAQs`)
    console.log(`   - 1 site settings document`)

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

// Run the seeding function
seedData()

export { seedData }
