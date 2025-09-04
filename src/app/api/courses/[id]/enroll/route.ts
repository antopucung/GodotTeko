import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/database'
import { UserProgress } from '@/lib/models/UserProgress'
import { Course } from '@/lib/models/Course'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const courseId = params.id
    const userId = session.user.id

    // Try to connect to database
    const db = await connectToDatabase()

    if (db) {
      try {
        // Check if course exists
        const course = await Course.findById(courseId)
        if (!course) {
          return NextResponse.json(
            { success: false, error: 'Course not found' },
            { status: 404 }
          )
        }

        // Check if user is already enrolled
        const existingProgress = await UserProgress.findOne({
          userId,
          courseId
        })

        if (existingProgress) {
          return NextResponse.json(
            { success: false, error: 'Already enrolled in this course' },
            { status: 400 }
          )
        }

        // Create initial progress tracking
        const lessonsProgress = course.lessons.map(lesson => ({
          lessonId: lesson.id,
          completed: false,
          timeSpent: 0
        }))

        const userProgress = new UserProgress({
          userId,
          courseId,
          status: 'enrolled',
          overallProgress: 0,
          lessonsProgress,
          enrolledAt: new Date()
        })

        await userProgress.save()

        // Update course enrollment count
        await Course.findByIdAndUpdate(courseId, {
          $inc: { enrolled: 1 }
        })

        console.log(`✅ User ${userId} enrolled in course ${courseId}`)

        return NextResponse.json({
          success: true,
          progress: userProgress,
          message: 'Successfully enrolled in course'
        })
      } catch (dbError) {
        console.error('⚠️ Database operation failed:', dbError)
        return NextResponse.json(
          { success: false, error: 'Failed to enroll in course' },
          { status: 500 }
        )
      }
    } else {
      // Database unavailable - simulate enrollment for demo
      console.log('⚠️ Database unavailable, simulating enrollment')
      return NextResponse.json({
        success: true,
        message: 'Successfully enrolled in course (demo mode)'
      })
    }
  } catch (error) {
    console.error('Error enrolling in course:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
