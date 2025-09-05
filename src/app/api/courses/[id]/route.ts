import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Mock course data - in production, this would come from database
const mockCourses = [
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
        videoUrl: 'https://example.com/video1',
        content: 'Learn how to install and configure Godot for game development',
        order: 1,
        free: true
      },
      {
        id: '1-2',
        title: 'Creating Your First Scene',
        description: 'Understanding nodes and scenes in Godot',
        duration: '25 minutes',
        videoUrl: 'https://example.com/video2',
        content: 'Master the fundamental building blocks of Godot projects',
        order: 2,
        free: true
      },
      {
        id: '1-3',
        title: 'GDScript Basics',
        description: 'Learn the fundamentals of GDScript programming',
        duration: '35 minutes',
        videoUrl: 'https://example.com/video3',
        content: 'Variables, functions, and basic programming concepts in GDScript',
        order: 3,
        free: false
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  }
  // Add more courses as needed
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const courseId = id

    // Find course by ID
    const course = mockCourses.find(c => c.id === courseId)

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled (for premium content access)
    const session = await getServerSession(authOptions)
    let userProgress = null

    if (session?.user?.id) {
      // In production, check user enrollment and progress from database
      userProgress = {
        enrolled: false, // Mock data
        completedLessons: [],
        lastAccessedLesson: null,
        progress: 0
      }
    }

    return NextResponse.json({
      success: true,
      course,
      userProgress
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const courseId = id
    const updates = await request.json()

    // Find course
    const courseIndex = mockCourses.findIndex(c => c.id === courseId)

    if (courseIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    const course = mockCourses[courseIndex]

    // Check if user owns this course
    if (course.instructor.id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to edit this course' },
        { status: 403 }
      )
    }

    // Update course
    mockCourses[courseIndex] = {
      ...course,
      ...updates,
      updatedAt: new Date()
    }

    return NextResponse.json({
      success: true,
      course: mockCourses[courseIndex],
      message: 'Course updated successfully'
    })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const courseId = id
    const courseIndex = mockCourses.findIndex(c => c.id === courseId)

    if (courseIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    const course = mockCourses[courseIndex]

    // Check if user owns this course or is admin
    const userRole = session.user.role || 'user'
    if (course.instructor.id !== session.user.id && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this course' },
        { status: 403 }
      )
    }

    // Remove course
    mockCourses.splice(courseIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
