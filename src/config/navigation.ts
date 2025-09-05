export interface NavItem {
  title: string
  href: string
  description?: string
  count?: number
  disabled?: boolean
  external?: boolean
}

export interface MainNavItem extends NavItem {
  items?: NavItem[]
}

// Dynamic category interface for Sanity integration
export interface CategoryNavItem extends NavItem {
  slug: string
  color?: string
  icon?: string
  isMain?: boolean
  isCollection?: boolean
  parentSlug?: string
  order?: number
}

// Main navigation structure with dynamic categories
export const mainNav: MainNavItem[] = [
  {
    title: "Browse",
    href: "/browse",
    items: [] // Will be populated dynamically from Sanity
  },
  {
    title: "All-Access",
    href: "/all-access",
    description: "Unlimited access to all resources"
  },
  {
    title: "Become a Partner",
    href: "/authors",
    description: "Join our designer community"
  }
]

// Function to get organized categories from API
export async function getDynamicBrowseItems(): Promise<NavItem[]> {
  try {
    const response = await fetch('/api/categories')
    const categories = await response.json()

    console.log('Categories fetched:', categories?.length || 0)

    if (!Array.isArray(categories) || categories.length === 0) {
      console.log('No categories found, using static fallback')
      return getStaticBrowseItems()
    }

    // Organize categories by name/slug patterns since we don't have isMain/isCollection fields yet
    const organizedItems: NavItem[] = []

    // Main content types (based on slug patterns)
    const mainTypeCategories = categories.filter((cat: any) =>
      ['assets', 'games', 'tools', 'starter-kits'].includes(cat.slug)
    ).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

    if (mainTypeCategories.length > 0) {
      organizedItems.push({
        title: "Content Types",
        href: "#",
        description: "Main product categories",
        disabled: true
      })

      mainTypeCategories.forEach((cat: any) => {
        organizedItems.push({
          title: cat.name,
          href: `/category/${cat.slug}`,
          description: cat.description || '',
          count: cat.productCount || 0
        })
      })
    }

    // Asset format categories (based on slug patterns)
    const assetFormatCategories = categories.filter((cat: any) =>
      ['2d-graphics', '3d-models', 'user-interface', 'audio', 'pixel-art', 'textures'].includes(cat.slug)
    ).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

    if (assetFormatCategories.length > 0) {
      organizedItems.push({
        title: "Asset Formats",
        href: "#",
        description: "By content format",
        disabled: true
      })

      assetFormatCategories.forEach((cat: any) => {
        organizedItems.push({
          title: cat.name,
          href: `/category/${cat.slug}`,
          description: cat.description || '',
          count: cat.productCount || 0
        })
      })
    }

    // Collection categories (based on slug patterns)
    const collectionCategories = categories.filter((cat: any) =>
      ['city-collection', 'retro-collection', 'character-collection', 'vehicle-collection'].includes(cat.slug)
    ).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

    if (collectionCategories.length > 0) {
      organizedItems.push({
        title: "Collections",
        href: "#",
        description: "Thematic groupings",
        disabled: true
      })

      collectionCategories.forEach((cat: any) => {
        organizedItems.push({
          title: cat.name,
          href: `/category/${cat.slug}`,
          description: cat.description || '',
          count: cat.productCount || 0
        })
      })
    }

    // If we don't have our organized categories yet, show the first 15 categories
    if (organizedItems.length <= 3) { // Only headers, no actual categories
      console.log('Using all categories fallback')

      organizedItems.push({
        title: "All Categories",
        href: "#",
        description: "Browse all available categories",
        disabled: true
      })

      // Show first 15 categories to avoid overwhelming the dropdown
      categories.slice(0, 15).forEach((cat: any) => {
        organizedItems.push({
          title: cat.name,
          href: `/category/${cat.slug}`,
          description: cat.description || '',
          count: cat.productCount || 0
        })
      })
    }

    console.log('Organized items:', organizedItems.length)
    return organizedItems

  } catch (error) {
    console.error('Error fetching dynamic categories:', error)
    return getStaticBrowseItems()
  }
}

// Fallback static items based on our new structure
function getStaticBrowseItems(): NavItem[] {
  return [
    // Main Content Types
    {
      title: "Content Types",
      href: "#",
      description: "Main product categories",
      disabled: true
    },
    {
      title: "Assets",
      href: "/category/assets",
      description: "Art resources and creative assets",
      count: 0
    },
    {
      title: "Games",
      href: "/category/games",
      description: "Complete playable games and experiences",
      count: 0
    },
    {
      title: "Tools",
      href: "/category/tools",
      description: "Development tools and creative utilities",
      count: 0
    },
    {
      title: "Starter Kits",
      href: "/category/starter-kits",
      description: "Ready-to-use project templates",
      count: 0
    },

    // Asset Formats
    {
      title: "Asset Formats",
      href: "#",
      description: "By content format",
      disabled: true
    },
    {
      title: "2D Graphics",
      href: "/category/2d-graphics",
      description: "Sprites, backgrounds, and 2D elements",
      count: 0
    },
    {
      title: "3D Models",
      href: "/category/3d-models",
      description: "Three-dimensional models and environments",
      count: 0
    },
    {
      title: "User Interface",
      href: "/category/user-interface",
      description: "UI elements and interface components",
      count: 0
    },
    {
      title: "Audio",
      href: "/category/audio",
      description: "Sound effects and music",
      count: 0
    },
    {
      title: "Pixel Art",
      href: "/category/pixel-art",
      description: "Retro pixel art graphics",
      count: 0
    },
    {
      title: "Textures",
      href: "/category/textures",
      description: "Surface materials and texture maps",
      count: 0
    },

    // Collections
    {
      title: "Collections",
      href: "#",
      description: "Thematic groupings",
      disabled: true
    },
    {
      title: "City Collection",
      href: "/category/city-collection",
      description: "Urban environments and buildings",
      count: 0
    },
    {
      title: "Retro Collection",
      href: "/category/retro-collection",
      description: "Vintage and retro-styled assets",
      count: 0
    },
    {
      title: "Character Collection",
      href: "/category/character-collection",
      description: "Characters, people, and creatures",
      count: 0
    },
    {
      title: "Vehicle Collection",
      href: "/category/vehicle-collection",
      description: "Cars, ships, and transportation",
      count: 0
    }
  ]
}

export const userNav: NavItem[] = [
  {
    title: "Sign up",
    href: "/auth/signup"
  },
  {
    title: "Log in",
    href: "/auth/signin"
  }
]

export const footerNav = {
  browse: [
    { title: "Featured products", href: "/category/featured-products" },
    { title: "Assets", href: "/category/assets" },
    { title: "Games", href: "/category/games" },
    { title: "Tools", href: "/category/tools" },
    { title: "Starter Kits", href: "/category/starter-kits" }
  ],
  platform: [
    { title: "All-Access Pass", href: "/all-access" },
    { title: "Godot Tekko Studio", href: "https://studio.godottekko.com", external: true },
    { title: "Become an author", href: "/authors" },
    { title: "Affiliate program", href: "/affiliates" },
    { title: "Terms & Licensing", href: "/terms" }
  ]
}

export const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard" },
  { title: "Products", href: "/admin/products" },
  { title: "Categories", href: "/admin/categories" },
  { title: "Users", href: "/admin/users" },
  { title: "Authors", href: "/admin/authors" },
  { title: "Orders", href: "/admin/orders" },
  { title: "Analytics", href: "/admin/analytics" },
  { title: "Settings", href: "/admin/settings" }
]

export const vendorNav: NavItem[] = [
  { title: "Dashboard", href: "/vendor/dashboard" },
  { title: "My Products", href: "/vendor/products" },
  { title: "Sales", href: "/vendor/sales" },
  { title: "Earnings", href: "/vendor/earnings" },
  { title: "Profile", href: "/vendor/profile" },
  { title: "Settings", href: "/vendor/settings" }
]

export const userDashboardNav: NavItem[] = [
  { title: "Dashboard", href: "/user/dashboard" },
  { title: "Purchases", href: "/user/purchases" },
  { title: "Downloads", href: "/user/downloads" },
  { title: "Favorites", href: "/user/favorites" },
  { title: "Profile", href: "/user/profile" },
  { title: "Billing", href: "/user/billing" }
]
