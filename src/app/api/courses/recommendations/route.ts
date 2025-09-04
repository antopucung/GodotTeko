import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')?.split(',') || []
    const limit = parseInt(searchParams.get('limit') || '3')

    // Mock course data that would typically come from Sanity
    const allCourses = [
      {
        id: '1',
        title: 'Complete Game Development with Godot',
        description: 'Learn to create 2D and 3D games from scratch using the Godot engine',
        thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=225&fit=crop',
        instructor: 'Alex Johnson',
        duration: '12 hours',
        difficulty: 'Beginner',
        category: 'Game Development',
        tags: ['godot', 'game-development', '2d', '3d', 'scripting'],
        rating: 4.8,
        enrolled: 1247,
        price: 'Free'
      },
      {
        id: '2',
        title: '3D Character Modeling in Blender',
        description: 'Master the art of creating game-ready characters with professional techniques',
        thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
        instructor: 'Maria Rodriguez',
        duration: '8 hours',
        difficulty: 'Intermediate',
        category: '3D Modeling',
        tags: ['blender', '3d-modeling', 'character-design', 'game-assets'],
        rating: 4.9,
        enrolled: 892,
        price: 'Free'
      },
      {
        id: '3',
        title: 'UI/UX Design for Games',
        description: 'Create intuitive and engaging user interfaces for modern games',
        thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop',
        instructor: 'David Kim',
        duration: '6 hours',
        difficulty: 'Beginner',
        category: 'UI/UX Design',
        tags: ['ui-design', 'ux-design', 'game-ui', 'figma'],
        rating: 4.7,
        enrolled: 634,
        price: 'Free'
      },
      {
        id: '4',
        title: 'Environment Art for Games',
        description: 'Design stunning game environments and landscapes',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=225&fit=crop',
        instructor: 'Emma Wilson',
        duration: '10 hours',
        difficulty: 'Intermediate',
        category: 'Environment Design',
        tags: ['environment-art', 'level-design', '3d-modeling', 'texturing'],
        rating: 4.8,
        enrolled: 567,
        price: 29
      },
      {
        id: '5',
        title: 'Advanced C# Programming for Unity',
        description: 'Take your Unity scripting skills to the next level with advanced techniques',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
        instructor: 'Sarah Chen',
        duration: '15 hours',
        difficulty: 'Advanced',
        category: 'Programming',
        tags: ['csharp', 'unity', 'programming', 'scripting', 'advanced'],
        rating: 4.9,
        enrolled: 1156,
        price: 49
      },
      {
        id: '6',
        title: 'Mobile Game Development',
        description: 'Build and publish games for iOS and Android platforms',
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=225&fit=crop',
        instructor: 'Lisa Wang',
        duration: '9 hours',
        difficulty: 'Intermediate',
        category: 'Mobile Development',
        tags: ['mobile-games', 'ios', 'android', 'cross-platform'],
        rating: 4.8,
        enrolled: 723,
        price: 'Free'
      },
      {
        id: '7',
        title: 'Game Audio Design Fundamentals',
        description: 'Create immersive soundscapes and audio effects for your games',
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
        instructor: 'Mike Thompson',
        duration: '10 hours',
        difficulty: 'Intermediate',
        category: 'Audio Design',
        tags: ['audio-design', 'sound-effects', 'music', 'game-audio'],
        rating: 4.6,
        enrolled: 456,
        price: 29
      }
    ]

    // Category mapping for better recommendations
    const categoryMappings: Record<string, string[]> = {
      'UI Kit': ['UI/UX Design', 'Game Development'],
      'UI': ['UI/UX Design', 'Programming'],
      '3D': ['3D Modeling', 'Environment Design'],
      'Game': ['Game Development', 'Programming'],
      'Mobile': ['Mobile Development', 'Game Development'],
      'Design': ['UI/UX Design', '3D Modeling'],
      'Template': ['Programming', 'UI/UX Design'],
      'Audio': ['Audio Design'],
      'Animation': ['3D Modeling', 'Environment Design']
    }

    // Score courses based on relevance
    const scoredCourses = allCourses.map(course => {
      let score = 0

      // Direct category match
      if (category && course.category.toLowerCase().includes(category.toLowerCase())) {
        score += 10
      }

      // Category mapping match
      if (category) {
        const mappedCategories = categoryMappings[category] || []
        if (mappedCategories.some(cat => course.category.includes(cat))) {
          score += 8
        }
      }

      // Tag matches
      if (tags.length > 0) {
        const tagMatches = tags.filter(tag =>
          course.tags.some(courseTag =>
            courseTag.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(courseTag.toLowerCase())
          )
        )
        score += tagMatches.length * 3
      }

      // Boost free courses
      if (course.price === 'Free') {
        score += 2
      }

      // Boost highly rated courses
      if (course.rating >= 4.8) {
        score += 2
      }

      // Boost popular courses
      if (course.enrolled >= 1000) {
        score += 1
      }

      return { ...course, relevanceScore: score }
    })

    // Sort by relevance score and rating
    const recommendations = scoredCourses
      .sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        return b.rating - a.rating
      })
      .slice(0, limit)
      .map(({ relevanceScore, ...course }) => course) // Remove score from response

    return NextResponse.json({
      success: true,
      recommendations,
      total: recommendations.length,
      metadata: {
        category,
        tags,
        limit
      }
    })

  } catch (error) {
    console.error('Course recommendations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch course recommendations',
        recommendations: []
      },
      { status: 500 }
    )
  }
}
