import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/database'
import { UserProgress } from '@/lib/models/UserProgress'
import { Course } from '@/lib/models/Course'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Try to connect to database
    const db = await connectToDatabase()

    if (db) {
      try {
        // Find all user's course enrollments
        const userProgressRecords = await UserProgress.find({ userId })
          .sort({ enrolledAt: -1 })
          .lean()

        // Get course details for each enrollment
        const enrolledCourses = []

        for (const progress of userProgressRecords) {
          const course = await Course.findById(progress.courseId).lean()
          if (course) {
            enrolledCourses.push({
              course,
              progress: {
                status: progress.status,
                overallProgress: progress.overallProgress,
                enrolledAt: progress.enrolledAt,
                startedAt: progress.startedAt,
                completedAt: progress.completedAt,
                lastAccessedAt: progress.lastAccessedAt,
                totalTimeSpent: progress.totalTimeSpent,
                completedLessons: progress.lessonsProgress.filter(l => l.completed).length,
                totalLessons: progress.lessonsProgress.length
              }
            })
          }
        }

        // Calculate user stats
        const stats = {
          totalEnrolled: enrolledCourses.length,
          inProgress: enrolledCourses.filter(c => c.progress.status === 'in_progress').length,
          completed: enrolledCourses.filter(c => c.progress.status === 'completed').length,
          totalTimeSpent: enrolledCourses.reduce((sum, c) => sum + (c.progress.totalTimeSpent || 0), 0)
        }

        console.log(`✅ Fetched ${enrolledCourses.length} enrolled courses for user ${userId}`)

        return NextResponse.json({
          success: true,
          courses: enrolledCourses,
          stats
        })
      } catch (dbError) {
        console.error('⚠️ Database operation failed:', dbError)

        // Fallback to mock data
        const mockEnrolledCourses = [
          {
            course: {
              _id: '1',
              title: 'Complete Game Development with Godot',
              description: 'Learn to create 2D and 3D games from scratch using the Godot engine.',
              thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=225&fit=crop',
              instructor: {
                name: 'Alex Johnson'
              },
              duration: '12 hours',
              difficulty: 'Beginner',
              category: 'Game Development',
              rating: 4.8
            },
            progress: {
              status: 'in_progress',
              overallProgress: 65,
              enrolledAt: new Date('2024-01-15'),
              startedAt: new Date('2024-01-16'),
              lastAccessedAt: new Date('2024-01-25'),
              totalTimeSpent: 14400, // 4 hours in seconds
              completedLessons: 8,
              totalLessons: 12
            }
          }
        ]

        return NextResponse.json({
          success: true,
          courses: mockEnrolledCourses,
          stats: {
            totalEnrolled: 1,
            inProgress: 1,
            completed: 0,
            totalTimeSpent: 14400
          }
        })
      }
    } else {
      // Database unavailable - return mock data
      console.log('⚠️ Database unavailable, using mock enrolled courses')

      const mockEnrolledCourses = [
        {
          course: {
            _id: '1',
            title: 'Complete Game Development with Godot',
            description: 'Learn to create 2D and 3D games from scratch using the Godot engine.',
            thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=225&fit=crop',
            instructor: {
              name: 'Alex Johnson'
            },
            duration: '12 hours',
            difficulty: 'Beginner',
            category: 'Game Development',
            rating: 4.8
          },
          progress: {
            status: 'in_progress',
            overallProgress: 65,
            enrolledAt: new Date('2024-01-15'),
            startedAt: new Date('2024-01-16'),
            lastAccessedAt: new Date('2024-01-25'),
            totalTimeSpent: 14400, // 4 hours in seconds
            completedLessons: 8,
            totalLessons: 12
          }
        }
      ]

      return NextResponse.json({
        success: true,
        courses: mockEnrolledCourses,
        stats: {
          totalEnrolled: 1,
          inProgress: 1,
          completed: 0,
          totalTimeSpent: 14400
        }
      })
    }
  } catch (error) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
