import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/marketing/revenue-optimization - Revenue optimization suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const contentType = searchParams.get('type') // 'asset', 'course', 'bundle'
    const creatorId = searchParams.get('creatorId')

    // Get creator
    const creator = await client.fetch(
      `*[_type == "userEnhanced" && email == $email && role in ["partner", "teacher", "admin", "super_admin"]][0] {
        _id, name, role
      }`,
      { email: session.user.email }
    )

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    let optimizations

    if (contentId && contentType) {
      // Get specific content optimization
      optimizations = await getContentOptimization(contentId, contentType, creator._id)
    } else {
      // Get overall creator revenue optimization
      optimizations = await getCreatorRevenueOptimization(creator._id)
    }

    return NextResponse.json({
      success: true,
      optimizations,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating revenue optimization:', error)
    return NextResponse.json(
      { error: 'Failed to generate revenue optimization' },
      { status: 500 }
    )
  }
}

// Get optimization suggestions for specific content
async function getContentOptimization(contentId: string, contentType: string, creatorId: string) {
  const content = await getContentWithAnalytics(contentId, contentType)
  if (!content) return null

  const marketData = await getMarketAnalysis(content.category, contentType)
  const suggestions = generatePricingSuggestions(content, marketData)
  const bundleOpportunities = await getBundleOpportunities(content, creatorId)

  return {
    content,
    currentPerformance: calculateCurrentPerformance(content),
    pricingSuggestions: suggestions,
    marketAnalysis: marketData,
    bundleOpportunities,
    actionableTasks: generateActionableTasks(content, suggestions, bundleOpportunities)
  }
}

// Get overall creator revenue optimization
async function getCreatorRevenueOptimization(creatorId: string) {
  const [creatorData, marketInsights, portfolioAnalysis] = await Promise.all([
    getCreatorPortfolio(creatorId),
    getCreatorMarketInsights(creatorId),
    analyzeCreatorPortfolio(creatorId)
  ])

  const revenueOptimizations = generateRevenueOptimizations(creatorData, marketInsights, portfolioAnalysis)

  return {
    portfolio: creatorData,
    marketInsights,
    portfolioAnalysis,
    optimizations: revenueOptimizations,
    prioritizedActions: prioritizeRevenueActions(revenueOptimizations)
  }
}

// Get content with performance analytics
async function getContentWithAnalytics(contentId: string, contentType: string) {
  const queries = {
    asset: `*[_type == "product" && _id == $contentId][0] {
      _id, title, category, price, tags,
      stats { views, likes, sales, revenue, conversionRate },
      author, _createdAt, _updatedAt
    }`,
    course: `*[_type == "course" && _id == $contentId][0] {
      _id, title, category, difficulty,
      price { amount, currency },
      enrollmentCount, averageRating,
      instructor, _createdAt, _updatedAt
    }`,
    bundle: `*[_type == "bundle" && _id == $contentId][0] {
      _id, title, category,
      pricing { bundlePrice, individualTotal, discountPercentage },
      performance { views, purchases, revenue, conversionRate },
      _createdAt, _updatedAt
    }`
  }

  return await client.fetch(queries[contentType as keyof typeof queries], { contentId })
}

// Market analysis for pricing context
async function getMarketAnalysis(category: string, contentType: string) {
  const marketQueries = {
    asset: `{
      "categoryAverage": {
        "price": round(avg(*[_type == "product" && category == $category].price)),
        "views": round(avg(*[_type == "product" && category == $category].stats.views)),
        "conversionRate": round(avg(*[_type == "product" && category == $category].stats.conversionRate) * 100) / 100
      },
      "topPerformers": *[_type == "product" && category == $category] | order(stats.revenue desc) [0...5] {
        _id, title, price, stats
      },
      "priceDistribution": *[_type == "product" && category == $category] {
        "priceRange": select(
          price < 10 => "under_10",
          price < 25 => "10_to_25",
          price < 50 => "25_to_50",
          price >= 50 => "over_50"
        )
      }
    }`,
    course: `{
      "categoryAverage": {
        "price": round(avg(*[_type == "course" && category == $category].price.amount)),
        "enrollments": round(avg(*[_type == "course" && category == $category].enrollmentCount)),
        "rating": round(avg(*[_type == "course" && category == $category].averageRating) * 10) / 10
      },
      "topPerformers": *[_type == "course" && category == $category] | order(enrollmentCount desc) [0...5] {
        _id, title, price, enrollmentCount, averageRating
      },
      "priceDistribution": *[_type == "course" && category == $category] {
        "priceRange": select(
          price.amount == 0 => "free",
          price.amount < 30 => "under_30",
          price.amount < 80 => "30_to_80",
          price.amount >= 80 => "over_80"
        )
      }
    }`,
    bundle: `{
      "categoryAverage": {
        "price": round(avg(*[_type == "bundle" && category == $category].pricing.bundlePrice)),
        "discount": round(avg(*[_type == "bundle" && category == $category].pricing.discountPercentage)),
        "conversionRate": round(avg(*[_type == "bundle" && category == $category].performance.conversionRate) * 100) / 100
      },
      "topPerformers": *[_type == "bundle" && category == $category] | order(performance.revenue desc) [0...3] {
        _id, title, pricing, performance
      }
    }`
  }

  const marketData = await client.fetch(marketQueries[contentType as keyof typeof marketQueries], { category })

  // Add market trends (simplified)
  marketData.trends = {
    demandLevel: 'moderate', // Could be calculated from recent activity
    competitionLevel: 'medium',
    growthRate: 15.2, // Mock data - in production, calculate from historical data
    seasonality: getSeasonalityInsights(category)
  }

  return marketData
}

// Generate pricing suggestions
function generatePricingSuggestions(content: any, marketData: any) {
  const suggestions = []
  const currentPrice = content.price?.amount || content.price || content.pricing?.bundlePrice

  // Price comparison with market average
  const marketAverage = marketData.categoryAverage.price
  const priceVsMarket = ((currentPrice - marketAverage) / marketAverage) * 100

  if (priceVsMarket > 20) {
    suggestions.push({
      type: 'price_reduction',
      priority: 'high',
      title: 'Consider Price Reduction',
      description: `Your price (${currentPrice}) is ${priceVsMarket.toFixed(1)}% above market average (${marketAverage})`,
      suggestedPrice: Math.round(marketAverage * 1.1), // 10% above average
      expectedImpact: 'Could increase sales by 25-40%',
      reasoning: 'Price is significantly above market rate, potentially limiting conversions'
    })
  } else if (priceVsMarket < -15) {
    suggestions.push({
      type: 'price_increase',
      priority: 'medium',
      title: 'Price Increase Opportunity',
      description: `Your price is ${Math.abs(priceVsMarket).toFixed(1)}% below market average`,
      suggestedPrice: Math.round(marketAverage * 0.9), // 10% below average
      expectedImpact: 'Could increase revenue by 15-25% with minimal impact on sales',
      reasoning: 'Room to increase price while remaining competitive'
    })
  }

  // Performance-based suggestions
  if (content.stats?.conversionRate < marketData.categoryAverage.conversionRate * 0.7) {
    suggestions.push({
      type: 'conversion_optimization',
      priority: 'high',
      title: 'Improve Conversion Rate',
      description: 'Your conversion rate is below market average',
      actionItems: [
        'Improve content description and preview',
        'Add more compelling thumbnails',
        'Consider temporary promotional pricing',
        'Add customer testimonials or reviews'
      ],
      expectedImpact: 'Could double your conversion rate',
      reasoning: 'Low conversion suggests presentation or pricing issues'
    })
  }

  // Seasonal suggestions
  const seasonalSuggestion = getSeasonalPricingSuggestion(content.category)
  if (seasonalSuggestion) {
    suggestions.push(seasonalSuggestion)
  }

  return suggestions
}

// Get bundle opportunities
async function getBundleOpportunities(content: any, creatorId: string) {
  const creatorContent = await client.fetch(
    `{
      "assets": *[_type == "product" && author._ref == $creatorId && category == $category] {
        _id, title, price, category
      },
      "courses": *[_type == "course" && instructor._ref == $creatorId && category == $category] {
        _id, title, price, category
      }
    }`,
    { creatorId, category: content.category }
  )

  const opportunities = []

  // Asset + Course bundle opportunity
  if (content._type === 'product' && creatorContent.courses.length > 0) {
    opportunities.push({
      type: 'asset_course_bundle',
      title: 'Create Asset + Course Bundle',
      description: 'Combine this asset with related courses for higher value',
      suggestedItems: creatorContent.courses.slice(0, 2),
      estimatedValue: (content.price + creatorContent.courses[0]?.price?.amount || 0) * 0.8,
      expectedLift: '35-50% increase in average order value'
    })
  }

  // Course + Asset bundle opportunity
  if (content._type === 'course' && creatorContent.assets.length > 0) {
    opportunities.push({
      type: 'course_asset_bundle',
      title: 'Create Course + Asset Bundle',
      description: 'Bundle course with practice assets',
      suggestedItems: creatorContent.assets.slice(0, 3),
      estimatedValue: (content.price.amount + creatorContent.assets.reduce((sum: number, a: any) => sum + a.price, 0)) * 0.75,
      expectedLift: '40-60% increase in average order value'
    })
  }

  return opportunities
}

// Calculate current performance metrics
function calculateCurrentPerformance(content: any) {
  return {
    revenuePerDay: content.stats?.revenue / Math.max(1, daysSinceCreation(content._createdAt)),
    conversionRate: content.stats?.conversionRate || (content.enrollmentCount / (content.stats?.views || 1)) * 100,
    engagementScore: calculateEngagementScore(content),
    marketPosition: getMarketPosition(content),
    growthTrend: 'stable' // Simplified - would calculate from historical data
  }
}

// Generate actionable tasks
function generateActionableTasks(content: any, suggestions: any[], bundleOpportunities: any[]) {
  const tasks = []

  // High priority tasks from suggestions
  suggestions.filter(s => s.priority === 'high').forEach(suggestion => {
    if (suggestion.type === 'price_reduction') {
      tasks.push({
        priority: 'high',
        task: `Update price to $${suggestion.suggestedPrice}`,
        category: 'pricing',
        estimatedTime: '5 minutes',
        expectedImpact: suggestion.expectedImpact
      })
    }
    if (suggestion.type === 'conversion_optimization') {
      tasks.push({
        priority: 'high',
        task: 'Improve content description and thumbnails',
        category: 'optimization',
        estimatedTime: '2-3 hours',
        expectedImpact: suggestion.expectedImpact
      })
    }
  })

  // Bundle creation tasks
  bundleOpportunities.forEach(opportunity => {
    tasks.push({
      priority: 'medium',
      task: `Create ${opportunity.title.toLowerCase()}`,
      category: 'bundling',
      estimatedTime: '30 minutes',
      expectedImpact: opportunity.expectedLift
    })
  })

  return tasks.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
  })
}

// Creator portfolio analysis functions
async function getCreatorPortfolio(creatorId: string) {
  return await client.fetch(
    `{
      "creator": *[_type == "userEnhanced" && _id == $creatorId][0] {
        _id, name, role, creatorProfile
      },
      "assets": *[_type == "product" && author._ref == $creatorId] {
        _id, title, category, price, stats, _createdAt
      },
      "courses": *[_type == "course" && instructor._ref == $creatorId] {
        _id, title, category, price, enrollmentCount, averageRating, _createdAt
      },
      "bundles": *[_type == "bundle" && creator._ref == $creatorId] {
        _id, title, pricing, performance, _createdAt
      }
    }`,
    { creatorId }
  )
}

async function getCreatorMarketInsights(creatorId: string) {
  // Get insights about the creator's market position
  return {
    topCategories: await getCreatorTopCategories(creatorId),
    competitivePosition: 'moderate', // Simplified
    marketOpportunities: await getMarketOpportunities(creatorId),
    revenueGrowthPotential: 'high'
  }
}

async function analyzeCreatorPortfolio(creatorId: string) {
  const portfolio = await getCreatorPortfolio(creatorId)

  return {
    revenueDistribution: calculateRevenueDistribution(portfolio),
    contentGaps: identifyContentGaps(portfolio),
    underperformingContent: identifyUnderperformingContent(portfolio),
    topPerformers: identifyTopPerformers(portfolio)
  }
}

// Helper functions
function daysSinceCreation(createdAt: string): number {
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
}

function calculateEngagementScore(content: any): number {
  // Simplified engagement calculation
  const views = content.stats?.views || 0
  const likes = content.stats?.likes || 0
  const sales = content.stats?.sales || content.enrollmentCount || 0

  return Math.min(100, Math.round((likes * 2 + sales * 10) / Math.max(views, 1) * 1000))
}

function getMarketPosition(content: any): string {
  // Simplified market position
  return 'competitive' // Would compare with similar content
}

function getSeasonalityInsights(category: string) {
  const seasonalPatterns: { [key: string]: string } = {
    'Game Development': 'Peak during summer and winter breaks',
    '3D Modeling': 'Steady year-round with slight peak in Q1',
    'Digital Art': 'Higher demand in Q4 for holiday projects',
    'Programming': 'Peak in January (New Year learning) and September (back to school)'
  }

  return seasonalPatterns[category] || 'Steady demand year-round'
}

function getSeasonalPricingSuggestion(category: string) {
  const currentMonth = new Date().getMonth()

  // Example seasonal suggestions (simplified)
  if (category === 'Game Development' && (currentMonth === 5 || currentMonth === 6)) {
    return {
      type: 'seasonal_discount',
      priority: 'medium',
      title: 'Summer Learning Promotion',
      description: 'Consider a summer discount to capture increased learning activity',
      suggestedDiscount: 15,
      duration: '2 months',
      expectedImpact: '20-30% increase in sales volume'
    }
  }

  return null
}

// Placeholder functions for portfolio analysis
function calculateRevenueDistribution(portfolio: any) {
  // Calculate how revenue is distributed across content types
  return {
    assets: 60,
    courses: 35,
    bundles: 5
  }
}

function identifyContentGaps(portfolio: any) {
  // Identify missing content types or categories
  return [
    'No beginner-level courses in top-performing categories',
    'Missing bundle opportunities for related content'
  ]
}

function identifyUnderperformingContent(portfolio: any) {
  // Find content that's not performing well
  return portfolio.assets?.filter((asset: any) => asset.stats?.revenue < 100) || []
}

function identifyTopPerformers(portfolio: any) {
  // Find best-performing content
  return {
    topAsset: portfolio.assets?.[0],
    topCourse: portfolio.courses?.[0]
  }
}

async function getCreatorTopCategories(creatorId: string) {
  return await client.fetch(
    `*[_type in ["product", "course"] && (author._ref == $creatorId || instructor._ref == $creatorId)] {
      category
    } | {
      "category": category,
      "count": count(*)
    } | order(count desc) [0...3]`,
    { creatorId }
  )
}

async function getMarketOpportunities(creatorId: string) {
  // Simplified market opportunity identification
  return [
    'High demand for beginner 3D modeling courses',
    'Growing market for game UI assets',
    'Bundle opportunities in your top categories'
  ]
}

function generateRevenueOptimizations(creatorData: any, marketInsights: any, portfolioAnalysis: any) {
  return {
    pricingOptimizations: [
      'Increase price on top-performing assets by 15%',
      'Create premium course tier with additional content'
    ],
    bundleOpportunities: [
      'Bundle top asset with related course for 25% discount',
      'Create category-specific asset packs'
    ],
    contentStrategy: [
      'Focus on high-demand categories',
      'Create complementary content for existing popular items'
    ]
  }
}

function prioritizeRevenueActions(optimizations: any) {
  return [
    { action: 'Create high-value bundle', impact: 'high', effort: 'medium', timeframe: '1 week' },
    { action: 'Optimize underperforming content', impact: 'medium', effort: 'low', timeframe: '2 days' },
    { action: 'Increase prices on top performers', impact: 'medium', effort: 'low', timeframe: '1 day' }
  ]
}
