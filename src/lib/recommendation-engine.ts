import { client } from './sanity'

interface UserBehavior {
  userId: string
  viewedProducts: string[]
  purchasedProducts: string[]
  favoriteProducts: string[]
  searchQueries: string[]
  categoryPreferences: Record<string, number>
  recentActivity: Array<{
    type: 'view' | 'purchase' | 'favorite' | 'search'
    productId?: string
    query?: string
    timestamp: string
    weight: number
  }>
}

interface Product {
  _id: string
  title: string
  slug: { current: string }
  price: number
  salePrice?: number
  categories: Array<{ name: string; slug: { current: string } }>
  author: { name: string; slug: { current: string } }
  stats: { likes: number; downloads: number; views: number }
  tags: string[]
  description: string
  featured: boolean
  _createdAt: string
}

interface RecommendationScore {
  productId: string
  score: number
  reasons: string[]
  algorithm: 'collaborative' | 'content' | 'popularity' | 'trending'
}

interface RecommendationOptions {
  limit?: number
  excludeOwned?: boolean
  includeReasons?: boolean
  algorithmWeights?: {
    collaborative: number
    content: number
    popularity: number
    trending: number
  }
}

export class RecommendationEngine {
  private static userBehaviorCache = new Map<string, UserBehavior>()
  private static productCache = new Map<string, Product>()
  private static similarityCache = new Map<string, string[]>()

  // Track user behavior (call this from your app when users interact)
  static async trackUserBehavior(
    userId: string,
    type: 'view' | 'purchase' | 'favorite' | 'search',
    productId?: string,
    query?: string
  ) {
    try {
      // Weight different actions differently
      const weights = {
        view: 1,
        favorite: 3,
        purchase: 5,
        search: 2
      }

      const activity = {
        type,
        productId,
        query,
        timestamp: new Date().toISOString(),
        weight: weights[type]
      }

      // Store in Sanity for persistence
      await client.create({
        _type: 'userBehavior',
        user: { _type: 'reference', _ref: userId },
        type,
        productId: productId ? { _type: 'reference', _ref: productId } : undefined,
        query,
        timestamp: activity.timestamp,
        weight: activity.weight
      })

      // Update cache
      this.userBehaviorCache.delete(userId)

    } catch (error) {
      console.error('Error tracking user behavior:', error)
    }
  }

  // Get personalized recommendations for a user
  static async getRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<Product[]> {
    const {
      limit = 12,
      excludeOwned = true,
      algorithmWeights = {
        collaborative: 0.3,
        content: 0.4,
        popularity: 0.2,
        trending: 0.1
      }
    } = options

    try {
      // Get user behavior and all products in parallel
      const [userBehavior, allProducts, ownedProductIds] = await Promise.all([
        this.getUserBehavior(userId),
        this.getAllProducts(),
        excludeOwned ? this.getOwnedProducts(userId) : []
      ])

      // Filter out owned products if requested
      const availableProducts = excludeOwned
        ? allProducts.filter(p => !ownedProductIds.includes(p._id))
        : allProducts

      // Calculate scores from different algorithms
      const collaborativeScores = await this.calculateCollaborativeScores(userId, availableProducts)
      const contentScores = await this.calculateContentScores(userBehavior, availableProducts)
      const popularityScores = this.calculatePopularityScores(availableProducts)
      const trendingScores = this.calculateTrendingScores(availableProducts)

      // Combine scores with weights
      const finalScores: RecommendationScore[] = availableProducts.map(product => {
        const collaborative = collaborativeScores.find(s => s.productId === product._id)?.score || 0
        const content = contentScores.find(s => s.productId === product._id)?.score || 0
        const popularity = popularityScores.find(s => s.productId === product._id)?.score || 0
        const trending = trendingScores.find(s => s.productId === product._id)?.score || 0

        const finalScore =
          collaborative * algorithmWeights.collaborative +
          content * algorithmWeights.content +
          popularity * algorithmWeights.popularity +
          trending * algorithmWeights.trending

        const reasons: string[] = []
        if (collaborative > 0.5) reasons.push('Similar users also liked this')
        if (content > 0.5) reasons.push('Matches your interests')
        if (popularity > 0.7) reasons.push('Popular choice')
        if (trending > 0.6) reasons.push('Trending now')

        return {
          productId: product._id,
          score: finalScore,
          reasons,
          algorithm: collaborative > content ? 'collaborative' : 'content' as any
        }
      })

      // Sort by score and return top products
      const topRecommendations = finalScores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(rec => availableProducts.find(p => p._id === rec.productId)!)
        .filter(Boolean)

      return topRecommendations

    } catch (error) {
      console.error('Error generating recommendations:', error)
      // Fallback to popular products
      return this.getFallbackRecommendations(limit)
    }
  }

  // Get similar products to a specific product
  static async getSimilarProducts(productId: string, limit = 6): Promise<Product[]> {
    try {
      // Check cache first
      const cacheKey = `similar_${productId}_${limit}`
      if (this.similarityCache.has(cacheKey)) {
        const similarIds = this.similarityCache.get(cacheKey)!
        const products = await Promise.all(
          similarIds.map(id => this.getProduct(id))
        )
        return products.filter(Boolean) as Product[]
      }

      const targetProduct = await this.getProduct(productId)
      if (!targetProduct) return []

      const allProducts = await this.getAllProducts()
      const otherProducts = allProducts.filter(p => p._id !== productId)

      // Calculate similarity scores
      const similarities = otherProducts.map(product => ({
        product,
        score: this.calculateProductSimilarity(targetProduct, product)
      }))

      // Sort by similarity and take top results
      const similarProducts = similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.product)

      // Cache results
      this.similarityCache.set(cacheKey, similarProducts.map(p => p._id))

      return similarProducts

    } catch (error) {
      console.error('Error getting similar products:', error)
      return []
    }
  }

  // Get trending products based on recent activity
  static async getTrendingProducts(limit = 12): Promise<Product[]> {
    try {
      // Get products with high recent activity
      const products = await client.fetch(`
        *[_type == "product"] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "categories": categories[]-> { name, slug },
          "author": author-> { name, slug },
          stats,
          featured,
          _createdAt,
          "recentViews": count(*[_type == "userBehavior" && productId._ref == ^._id && _createdAt > dateTime(now()) - 60*60*24*7]),
          "recentPurchases": count(*[_type == "order" && items[].product._ref == ^._id && _createdAt > dateTime(now()) - 60*60*24*7])
        } | order(recentViews desc, recentPurchases desc, stats.downloads desc) [0...${limit}]
      `)

      return products
    } catch (error) {
      console.error('Error getting trending products:', error)
      return this.getFallbackRecommendations(limit)
    }
  }

  // Private helper methods

  private static async getUserBehavior(userId: string): Promise<UserBehavior> {
    if (this.userBehaviorCache.has(userId)) {
      return this.userBehaviorCache.get(userId)!
    }

    try {
      const behaviors = await client.fetch(`
        *[_type == "userBehavior" && user._ref == $userId] | order(_createdAt desc) [0...100] {
          type,
          "productId": productId._ref,
          query,
          timestamp: _createdAt,
          weight
        }
      `, { userId })

      const viewedProducts = behaviors.filter((b: any) => b.type === 'view' && b.productId).map((b: any) => b.productId)
      const purchasedProducts = behaviors.filter((b: any) => b.type === 'purchase' && b.productId).map((b: any) => b.productId)
      const favoriteProducts = behaviors.filter((b: any) => b.type === 'favorite' && b.productId).map((b: any) => b.productId)
      const searchQueries = behaviors.filter((b: any) => b.type === 'search' && b.query).map((b: any) => b.query)

      // Calculate category preferences
      const categoryPreferences: Record<string, number> = {}
      for (const productId of [...viewedProducts, ...purchasedProducts, ...favoriteProducts]) {
        const product = await this.getProduct(productId)
        if (product) {
          product.categories.forEach(cat => {
            categoryPreferences[cat.name] = (categoryPreferences[cat.name] || 0) + 1
          })
        }
      }

      const userBehavior: UserBehavior = {
        userId,
        viewedProducts: [...new Set(viewedProducts as string[])],
        purchasedProducts: [...new Set(purchasedProducts as string[])],
        favoriteProducts: [...new Set(favoriteProducts as string[])],
        searchQueries: [...new Set(searchQueries as string[])],
        categoryPreferences,
        recentActivity: behaviors
      }

      this.userBehaviorCache.set(userId, userBehavior)
      return userBehavior

    } catch (error) {
      console.error('Error getting user behavior:', error)
      return {
        userId,
        viewedProducts: [],
        purchasedProducts: [],
        favoriteProducts: [],
        searchQueries: [],
        categoryPreferences: {},
        recentActivity: []
      }
    }
  }

  private static async getAllProducts(): Promise<Product[]> {
    try {
      const products = await client.fetch(`
        *[_type == "product"] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "categories": categories[]-> { name, slug },
          "author": author-> { name, slug },
          stats,
          "tags": coalesce(tags, []),
          description,
          featured,
          _createdAt
        }
      `)

      return products
    } catch (error) {
      console.error('Error getting all products:', error)
      return []
    }
  }

  private static async getProduct(productId: string): Promise<Product | null> {
    if (this.productCache.has(productId)) {
      return this.productCache.get(productId)!
    }

    try {
      const product = await client.fetch(`
        *[_type == "product" && _id == $productId][0] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "categories": categories[]-> { name, slug },
          "author": author-> { name, slug },
          stats,
          "tags": coalesce(tags, []),
          description,
          featured,
          _createdAt
        }
      `, { productId })

      if (product) {
        this.productCache.set(productId, product)
      }

      return product || null
    } catch (error) {
      console.error('Error getting product:', error)
      return null
    }
  }

  private static async getOwnedProducts(userId: string): Promise<string[]> {
    try {
      const licenses = await client.fetch(`
        *[_type == "license" && user._ref == $userId] {
          "productId": product._ref
        }
      `, { userId })

      return licenses.map((l: any) => l.productId)
    } catch (error) {
      console.error('Error getting owned products:', error)
      return []
    }
  }

  private static async calculateCollaborativeScores(userId: string, products: Product[]): Promise<RecommendationScore[]> {
    // Simple collaborative filtering: find users with similar purchases/views
    try {
      const userBehavior = await this.getUserBehavior(userId)
      const userProductIds = [...userBehavior.purchasedProducts, ...userBehavior.favoriteProducts]

      if (userProductIds.length === 0) {
        return products.map(p => ({ productId: p._id, score: 0, reasons: [], algorithm: 'collaborative' as const }))
      }

      // Find similar users
      const similarUsers = await client.fetch(`
        *[_type == "license" && product._ref in $userProductIds] {
          "userId": user._ref
        }
      `, { userProductIds })

      const similarUserIds = [...new Set(similarUsers.map((u: any) => u.userId))]
        .filter(id => id !== userId)

      if (similarUserIds.length === 0) {
        return products.map(p => ({ productId: p._id, score: 0, reasons: [], algorithm: 'collaborative' as const }))
      }

      // Get what similar users also bought/liked
      const similarUserProducts = await client.fetch(`
        *[_type == "license" && user._ref in $similarUserIds] {
          "productId": product._ref
        }
      `, { similarUserIds })

      const productCounts: Record<string, number> = {}
      similarUserProducts.forEach((p: any) => {
        productCounts[p.productId] = (productCounts[p.productId] || 0) + 1
      })

      return products.map(product => ({
        productId: product._id,
        score: Math.min((productCounts[product._id] || 0) / similarUserIds.length, 1),
        reasons: [],
        algorithm: 'collaborative' as const
      }))

    } catch (error) {
      console.error('Error calculating collaborative scores:', error)
      return products.map(p => ({ productId: p._id, score: 0, reasons: [], algorithm: 'collaborative' as const }))
    }
  }

  private static async calculateContentScores(userBehavior: UserBehavior, products: Product[]): Promise<RecommendationScore[]> {
    return products.map(product => {
      let score = 0

      // Category preference match
      const categoryMatches = product.categories.filter(cat =>
        userBehavior.categoryPreferences[cat.name] > 0
      )
      score += categoryMatches.length * 0.3

      // Search query match
      const titleWords = product.title.toLowerCase().split(' ')
      const descWords = product.description.toLowerCase().split(' ')
      const searchMatches = userBehavior.searchQueries.filter(query =>
        titleWords.some(word => query.toLowerCase().includes(word)) ||
        descWords.some(word => query.toLowerCase().includes(word))
      )
      score += searchMatches.length * 0.2

      // Same author preference
      const authorProducts = userBehavior.purchasedProducts.length + userBehavior.favoriteProducts.length
      if (authorProducts > 0) {
        // This would need author comparison logic
        score += 0.1
      }

      return {
        productId: product._id,
        score: Math.min(score, 1),
        reasons: [],
        algorithm: 'content' as const
      }
    })
  }

  private static calculatePopularityScores(products: Product[]): RecommendationScore[] {
    const maxDownloads = Math.max(...products.map(p => p.stats.downloads))
    const maxLikes = Math.max(...products.map(p => p.stats.likes))

    return products.map(product => ({
      productId: product._id,
      score: ((product.stats.downloads / maxDownloads) * 0.6 + (product.stats.likes / maxLikes) * 0.4),
      reasons: [],
      algorithm: 'popularity' as const
    }))
  }

  private static calculateTrendingScores(products: Product[]): RecommendationScore[] {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return products.map(product => {
      const createdAt = new Date(product._createdAt)
      const isRecent = createdAt > thirtyDaysAgo
      const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)

      // Boost recent products and featured products
      let score = 0
      if (isRecent) {
        score += Math.max(0, (30 - daysSinceCreation) / 30) * 0.7
      }
      if (product.featured) {
        score += 0.3
      }

      return {
        productId: product._id,
        score: Math.min(score, 1),
        reasons: [],
        algorithm: 'trending' as const
      }
    })
  }

  private static calculateProductSimilarity(productA: Product, productB: Product): number {
    let similarity = 0

    // Category similarity
    const categoriesA = productA.categories.map(c => c.name)
    const categoriesB = productB.categories.map(c => c.name)
    const commonCategories = categoriesA.filter(cat => categoriesB.includes(cat))
    similarity += (commonCategories.length / Math.max(categoriesA.length, categoriesB.length)) * 0.4

    // Same author
    if (productA.author.name === productB.author.name) {
      similarity += 0.3
    }

    // Price range similarity
    const priceA = productA.salePrice || productA.price
    const priceB = productB.salePrice || productB.price
    const priceDiff = Math.abs(priceA - priceB)
    const maxPrice = Math.max(priceA, priceB)
    if (maxPrice > 0) {
      similarity += (1 - (priceDiff / maxPrice)) * 0.2
    }

    // Title word similarity (basic)
    const wordsA = productA.title.toLowerCase().split(' ')
    const wordsB = productB.title.toLowerCase().split(' ')
    const commonWords = wordsA.filter(word => wordsB.includes(word) && word.length > 3)
    similarity += (commonWords.length / Math.max(wordsA.length, wordsB.length)) * 0.1

    return Math.min(similarity, 1)
  }

  private static async getFallbackRecommendations(limit: number): Promise<Product[]> {
    try {
      // Return popular and featured products as fallback
      const products = await client.fetch(`
        *[_type == "product"] | order(featured desc, stats.downloads desc, _createdAt desc) [0...${limit}] {
          _id,
          title,
          slug,
          price,
          salePrice,
          "categories": categories[]-> { name, slug },
          "author": author-> { name, slug },
          stats,
          featured,
          _createdAt
        }
      `)

      return products
    } catch (error) {
      console.error('Error getting fallback recommendations:', error)
      return []
    }
  }

  // Clear caches (useful for testing or periodic cleanup)
  static clearCaches() {
    this.userBehaviorCache.clear()
    this.productCache.clear()
    this.similarityCache.clear()
  }
}
