import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/marketing/recommendations - Smart content recommendation engine
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const contentType = searchParams.get('type') // 'asset', 'course', 'bundle'
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '6')

    if (!contentId || !contentType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get the base content to find similar items
    const baseContent = await getBaseContent(contentId, contentType)
    if (!baseContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Get user preferences if available
    const userPreferences = userId ? await getUserPreferences(userId) : null

    // Generate smart recommendations using multiple strategies
    const recommendations = await generateSmartRecommendations(
      baseContent,
      contentType,
      userPreferences,
      limit
    )

    return NextResponse.json({
      success: true,
      recommendations: {
        primary: recommendations.primary, // Same type recommendations
        crossSell: recommendations.crossSell, // Different type recommendations
        trending: recommendations.trending, // Popular content
        personalized: recommendations.personalized // User-specific
      },
      strategies: recommendations.strategies,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

// Helper function to get base content details
async function getBaseContent(contentId: string, contentType: string) {
  const queries = {
    asset: `*[_type == "product" && _id == $contentId][0] {
      _id, title, category, tags, price, author, stats
    }`,
    course: `*[_type == "course" && _id == $contentId][0] {
      _id, title, category, skills, difficulty, instructor, price, stats
    }`,
    bundle: `*[_type == "bundle" && _id == $contentId][0] {
      _id, title, category, assets, courses, price
    }`
  }

  return await client.fetch(queries[contentType as keyof typeof queries] || queries.asset, { contentId })
}

// Helper function to get user preferences and behavior
async function getUserPreferences(userId: string) {
  return await client.fetch(
    `{
      "user": *[_type == "userEnhanced" && _id == $userId][0] {
        _id, preferences, subscriptionTier
      },
      "recentViews": *[_type == "userActivity" && user._ref == $userId && type == "view"] | order(_createdAt desc) [0...10] {
        content, contentType, _createdAt
      },
      "purchases": *[_type == "order" && user._ref == $userId] {
        items[]{content, contentType}
      },
      "enrollments": *[_type == "course" && references($userId)] {
        _id, category, difficulty, skills
      }
    }`,
    { userId }
  )
}

// Main recommendation generation logic
async function generateSmartRecommendations(baseContent: any, contentType: string, userPreferences: any, limit: number) {
  const strategies = []

  // Strategy 1: Content-based similarity (primary recommendations)
  const primaryRecs = await generateContentBasedRecommendations(baseContent, contentType, Math.ceil(limit * 0.4))
  strategies.push('content_similarity')

  // Strategy 2: Cross-selling opportunities
  const crossSellRecs = await generateCrossSellRecommendations(baseContent, contentType, Math.ceil(limit * 0.3))
  strategies.push('cross_sell')

  // Strategy 3: Trending/Popular content
  const trendingRecs = await generateTrendingRecommendations(baseContent.category, Math.ceil(limit * 0.2))
  strategies.push('trending')

  // Strategy 4: Personalized recommendations (if user data available)
  const personalizedRecs = userPreferences
    ? await generatePersonalizedRecommendations(userPreferences, baseContent, Math.ceil(limit * 0.1))
    : []
  if (personalizedRecs.length > 0) strategies.push('personalized')

  return {
    primary: primaryRecs,
    crossSell: crossSellRecs,
    trending: trendingRecs,
    personalized: personalizedRecs,
    strategies
  }
}

// Content-based similarity recommendations
async function generateContentBasedRecommendations(baseContent: any, contentType: string, limit: number) {
  const similarityQueries = {
    asset: `*[_type == "product" && _id != $contentId && (
      category == $category ||
      tags[]->slug.current in $tags ||
      author._ref == $authorId
    )] | order(stats.views desc, _createdAt desc) [0...${limit}] {
      _id, title, category, price, thumbnail, author, stats,
      "similarity": "category_match"
    }`,

    course: `*[_type == "course" && _id != $contentId && (
      category == $category ||
      difficulty == $difficulty ||
      skills[] in $skills ||
      instructor._ref == $instructorId
    )] | order(enrollmentCount desc, averageRating desc) [0...${limit}] {
      _id, title, category, difficulty, price, thumbnail, instructor,
      enrollmentCount, averageRating, "similarity": "skill_match"
    }`,

    bundle: `*[_type == "bundle" && _id != $contentId &&
      category == $category
    ] | order(performance.purchases desc) [0...${limit}] {
      _id, title, category, pricing, thumbnail, "similarity": "category_match"
    }`
  }

  const params = {
    contentId: baseContent._id,
    category: baseContent.category,
    tags: baseContent.tags || [],
    skills: baseContent.skills || [],
    difficulty: baseContent.difficulty,
    authorId: baseContent.author?._ref,
    instructorId: baseContent.instructor?._ref
  }

  return await client.fetch(similarityQueries[contentType as keyof typeof similarityQueries], params)
}

// Cross-selling recommendations (different content types)
async function generateCrossSellRecommendations(baseContent: any, contentType: string, limit: number) {
  const crossSellStrategies = {
    asset: {
      // For assets, recommend related courses and bundles
      courses: `*[_type == "course" && (
        category == $category ||
        skills[] in $relatedSkills
      )] | order(enrollmentCount desc) [0...${Math.ceil(limit * 0.7)}] {
        _id, title, category, price, thumbnail, instructor, enrollmentCount,
        "crossSellType": "asset_to_course", "reason": "Learn to create similar assets"
      }`,
      bundles: `*[_type == "bundle" && (
        category == $category ||
        assets[].content._ref == $contentId
      )] [0...${Math.floor(limit * 0.3)}] {
        _id, title, pricing, thumbnail, "crossSellType": "asset_to_bundle"
      }`
    },

    course: {
      // For courses, recommend related assets and bundles
      assets: `*[_type == "product" && (
        category == $category ||
        tags[]->slug.current in $relatedTags
      )] | order(stats.views desc) [0...${Math.ceil(limit * 0.6)}] {
        _id, title, category, price, thumbnail, author, stats,
        "crossSellType": "course_to_asset", "reason": "Practice with real assets"
      }`,
      bundles: `*[_type == "bundle" && (
        courses[].content._ref == $contentId ||
        category == $category
      )] [0...${Math.floor(limit * 0.4)}] {
        _id, title, pricing, thumbnail, "crossSellType": "course_to_bundle"
      }`
    },

    bundle: {
      // For bundles, recommend individual assets and courses
      assets: `*[_type == "product" && category == $category] | order(stats.sales desc) [0...${Math.ceil(limit * 0.5)}] {
        _id, title, category, price, thumbnail, "crossSellType": "bundle_to_asset"
      }`,
      courses: `*[_type == "course" && category == $category] | order(enrollmentCount desc) [0...${Math.floor(limit * 0.5)}] {
        _id, title, category, price, thumbnail, "crossSellType": "bundle_to_course"
      }`
    }
  }

  const strategy = crossSellStrategies[contentType as keyof typeof crossSellStrategies]
  if (!strategy) return []

  const params = {
    contentId: baseContent._id,
    category: baseContent.category,
    relatedSkills: baseContent.skills || [],
    relatedTags: getRelatedTags(baseContent.category)
  }

  const results = await Promise.all(
    Object.entries(strategy).map(([type, query]) =>
      client.fetch(query, params)
    )
  )

  return results.flat()
}

// Trending content recommendations
async function generateTrendingRecommendations(category: string, limit: number) {
  return await client.fetch(
    `{
      "trendingAssets": *[_type == "product" && category == $category] | order(stats.views desc, stats.sales desc) [0...${Math.ceil(limit * 0.4)}] {
        _id, title, category, price, thumbnail, stats, "trendingType": "trending_asset"
      },
      "trendingCourses": *[_type == "course" && category == $category] | order(enrollmentCount desc, averageRating desc) [0...${Math.ceil(limit * 0.4)}] {
        _id, title, category, price, thumbnail, enrollmentCount, "trendingType": "trending_course"
      },
      "featuredBundles": *[_type == "bundle" && category == $category && settings.featured == true] [0...${Math.floor(limit * 0.2)}] {
        _id, title, pricing, thumbnail, "trendingType": "featured_bundle"
      }
    }`,
    { category }
  ).then(result => [
    ...result.trendingAssets,
    ...result.trendingCourses,
    ...result.featuredBundles
  ])
}

// Personalized recommendations based on user behavior
async function generatePersonalizedRecommendations(userPreferences: any, baseContent: any, limit: number) {
  if (!userPreferences?.user) return []

  // Analyze user's content preferences
  const viewedCategories = userPreferences.recentViews?.map((v: any) => v.content?.category).filter(Boolean) || []
  const purchasedCategories = userPreferences.purchases?.flatMap((p: any) =>
    p.items?.map((i: any) => i.content?.category)
  ).filter(Boolean) || []
  const enrolledSkills = userPreferences.enrollments?.flatMap((e: any) => e.skills || []) || []

  // Create preference score for different categories
  const categoryPreferences = [...viewedCategories, ...purchasedCategories].reduce((acc: any, cat: string) => {
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const preferredCategories = Object.keys(categoryPreferences)
    .sort((a, b) => categoryPreferences[b] - categoryPreferences[a])
    .slice(0, 3)

  if (preferredCategories.length === 0) return []

  return await client.fetch(
    `*[_type in ["product", "course", "bundle"] && category in $preferredCategories && _id != $contentId] | order(_createdAt desc) [0...${limit}] {
      _id, title, category, price, thumbnail, _type,
      "personalizedReason": "Based on your interests in " + category
    }`,
    {
      preferredCategories,
      contentId: baseContent._id
    }
  )
}

// Helper function to get related tags based on category
function getRelatedTags(category: string): string[] {
  const tagMappings: { [key: string]: string[] } = {
    'Game Development': ['unity', 'unreal', 'godot', 'programming', 'scripting'],
    '3D Modeling': ['blender', 'maya', 'modeling', 'texturing', 'animation'],
    'UI/UX Design': ['interface', 'user-experience', 'wireframe', 'prototype'],
    'Digital Art': ['painting', 'illustration', 'concept-art', 'digital-painting'],
    'Programming': ['coding', 'scripting', 'algorithms', 'development'],
    'Animation': ['motion', 'keyframe', 'rigging', 'character-animation']
  }

  return tagMappings[category] || []
}
