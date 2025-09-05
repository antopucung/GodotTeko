import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/database'
import { Course } from '@/lib/models/Course'

// Course data structure for the learning platform
interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: {
    id: string
    name: string
    avatar?: string
    bio?: string
  }
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  rating: number
  enrolled: number
  price: 'Free' | number
  featured: boolean
  lessons: Lesson[]
  createdAt: Date
  updatedAt: Date
}

interface Lesson {
  id: string
  title: string
  description: string
  duration: string
  videoUrl?: string
  content: string
  order: number
  free: boolean
}

// Mock course database - in production, replace with real database
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Complete Game Development with Godot',
    description: 'Learn to create 2D and 3D games from scratch using the Godot engine. This comprehensive course covers everything from basic scripting to advanced game mechanics.',
    thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=225&fit=crop',
    instructor: {
      id: 'alex-johnson',
      name: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Game developer with 8+ years of experience using Godot engine. Published 5 successful indie games.'
    },
    duration: '12 hours',
    difficulty: 'Beginner',
    category: 'Game Development',
    rating: 4.8,
    enrolled: 1247,
    price: 'Free',
    featured: true,
    lessons: [
      {
        id: '1-1',
        title: 'Introduction to Godot',
        description: 'Setting up your development environment',
        duration: '15 minutes',
        content: 'Learn how to install and configure Godot for game development',
        order: 1,
        free: true
      },
      {
        id: '1-2',
        title: 'Creating Your First Scene',
        description: 'Understanding nodes and scenes in Godot',
        duration: '25 minutes',
        content: 'Master the fundamental building blocks of Godot projects',
        order: 2,
        free: true
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    title: '3D Character Modeling in Blender',
    description: 'Master the art of creating game-ready characters with professional techniques. Learn sculpting, retopology, and texturing workflows.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
    instructor: {
      id: 'maria-rodriguez',
      name: 'Maria Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b587?w=150&h=150&fit=crop&crop=face',
      bio: '3D artist specializing in character design for AAA games. Worked at major studios including Ubisoft and CD Projekt.'
    },
    duration: '8 hours',
    difficulty: 'Intermediate',
    category: '3D Modeling',
    rating: 4.9,
    enrolled: 892,
    price: 49,
    featured: false,
    lessons: [
      {
        id: '2-1',
        title: 'Blender Interface for Character Modeling',
        description: 'Navigate Blender efficiently for character work',
        duration: '20 minutes',
        content: 'Set up your workspace and learn essential shortcuts',
        order: 1,
        free: true
      }
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: '3',
    title: 'UI/UX Design for Games',
    description: 'Create intuitive and engaging user interfaces for modern games. Learn design principles, prototyping, and implementation.',
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop',
    instructor: {
      id: 'david-kim',
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'UI/UX designer with focus on game interfaces. Designed UI for mobile games with 10M+ downloads.'
    },
    duration: '6 hours',
    difficulty: 'Beginner',
    category: 'UI/UX Design',
    rating: 4.7,
    enrolled: 634,
    price: 'Free',
    featured: true,
    lessons: [
      {
        id: '3-1',
        title: 'Game UI Design Principles',
        description: 'Understanding player psychology and interface design',
        duration: '30 minutes',
        content: 'Learn what makes game interfaces engaging and intuitive',
        order: 1,
        free: true
      }
    ],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19')
  },
  {
    id: '4',
    title: 'Advanced C# Programming for Unity',
    description: 'Take your Unity scripting skills to the next level with advanced programming techniques, design patterns, and optimization strategies.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    instructor: {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Senior software engineer and Unity certified instructor. 12 years of experience in game development.'
    },
    duration: '15 hours',
    difficulty: 'Advanced',
    category: 'Programming',
    rating: 4.9,
    enrolled: 1156,
    price: 89,
    featured: true,
    lessons: [
      {
        id: '4-1',
        title: 'Advanced C# Concepts',
        description: 'Delegates, events, and lambda expressions',
        duration: '45 minutes',
        content: 'Master advanced C# features for game development',
        order: 1,
        free: true
      }
    ],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-22')
  },
  {
    id: '5',
    title: 'Game Audio Design Fundamentals',
    description: 'Create immersive soundscapes and audio effects for your games. Learn sound design, music composition, and audio implementation.',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
    instructor: {
      id: 'mike-thompson',
      name: 'Mike Thompson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: 'Audio engineer and composer for indie games. Created soundtracks for award-winning titles.'
    },
    duration: '10 hours',
    difficulty: 'Intermediate',
    category: 'Audio Design',
    rating: 4.6,
    enrolled: 456,
    price: 59,
    featured: false,
    lessons: [
      {
        id: '5-1',
        title: 'Introduction to Game Audio',
        description: 'Understanding audio in interactive media',
        duration: '25 minutes',
        content: 'Learn the unique challenges of game audio design',
        order: 1,
        free: true
      }
    ],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: '6',
    title: 'Mobile Game Development',
    description: 'Build and publish games for iOS and Android platforms. Learn mobile-specific development patterns and monetization strategies.',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=225&fit=crop',
    instructor: {
      id: 'lisa-wang',
      name: 'Lisa Wang',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      bio: 'Mobile game developer with 3 published titles on app stores. Expert in Unity mobile optimization.'
    },
    duration: '9 hours',
    difficulty: 'Intermediate',
    category: 'Mobile Development',
    rating: 4.8,
    enrolled: 723,
    price: 'Free',
    featured: false,
    lessons: [
      {
        id: '6-1',
        title: 'Mobile Game Architecture',
        description: 'Designing for mobile platforms',
        duration: '35 minutes',
        content: 'Learn mobile-specific development considerations',
        order: 1,
        free: true
      }
    ],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-23')
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'
    const free = searchParams.get('free') === 'true'
    const sortBy = searchParams.get('sortBy') || 'newest' // newest, popular, rating

    // Try to connect to database and fetch courses
    let allCourses = []
    const db = await connectToDatabase()

    if (db) {
      try {
        // Fetch from database
        allCourses = await Course.find({ published: true }).lean()
        console.log(`✅ Fetched ${allCourses.length} courses from database`)
      } catch (dbError) {
        console.error('⚠️ Database query failed, falling back to mock data:', dbError)
        allCourses = [...mockCourses]
      }
    } else {
      console.log('⚠️ Database unavailable, using mock data')
      allCourses = [...mockCourses]
    }

    let filteredCourses = [...allCourses]

    // Apply filters
    if (category && category !== 'All Categories') {
      filteredCourses = filteredCourses.filter(course => course.category === category)
    }

    if (difficulty && difficulty !== 'All Levels') {
      filteredCourses = filteredCourses.filter(course => course.difficulty === difficulty)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredCourses = filteredCourses.filter(course =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower) ||
        course.instructor.name.toLowerCase().includes(searchLower)
      )
    }

    if (featured) {
      filteredCourses = filteredCourses.filter(course => course.featured)
    }

    if (free) {
      filteredCourses = filteredCourses.filter(course => course.price === 'Free')
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filteredCourses.sort((a, b) => b.enrolled - a.enrolled)
        break
      case 'rating':
        filteredCourses.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
      default:
        filteredCourses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    // Calculate pagination
    const totalCourses = filteredCourses.length
    const totalPages = Math.ceil(totalCourses / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

    // Calculate stats for response
    const stats = {
      totalCourses: allCourses.length,
      activeCourses: filteredCourses.length,
      totalInstructors: [...new Set(allCourses.map(c => c.instructor.id))].length,
      totalEnrollments: allCourses.reduce((sum, course) => sum + course.enrolled, 0)
    }

    return NextResponse.json({
      success: true,
      courses: paginatedCourses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats,
      filters: {
        categories: [...new Set(allCourses.map(c => c.category))],
        difficulties: ['Beginner', 'Intermediate', 'Advanced']
      }
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has instructor or admin role
    // In production, implement proper role checking
    const userRole = session.user.role || 'user'
    if (!['admin', 'instructor'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create courses' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, thumbnail, duration, difficulty, category, price, lessons } = body

    // Validate required fields
    if (!title || !description || !duration || !difficulty || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new course data
    const courseData = {
      title,
      description,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=225&fit=crop',
      instructor: {
        id: session.user.id,
        name: session.user.name || 'Unknown Instructor',
        avatar: session.user.image
      },
      duration,
      difficulty,
      category,
      rating: 0,
      enrolled: 0,
      price: price || 'Free',
      featured: false,
      lessons: lessons || [],
      published: false // New courses start as drafts
    }

    let newCourse
    const db = await connectToDatabase()

    if (db) {
      try {
        // Save to database
        newCourse = new Course(courseData)
        await newCourse.save()
        console.log('✅ Course saved to database')
      } catch (dbError) {
        console.error('⚠️ Failed to save to database:', dbError)
        // Fallback: add to mock data
        const mockCourse = {
          id: Date.now().toString(),
          ...courseData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        mockCourses.push(mockCourse)
        newCourse = mockCourse
      }
    } else {
      // Fallback: add to mock data
      const mockCourse = {
        id: Date.now().toString(),
        ...courseData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockCourses.push(mockCourse)
      newCourse = mockCourse
    }

    return NextResponse.json({
      success: true,
      course: newCourse,
      message: 'Course created successfully'
    })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
