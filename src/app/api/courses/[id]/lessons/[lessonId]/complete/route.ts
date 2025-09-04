import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/database'
import { UserProgress } from '@/lib/models/UserProgress'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
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
    const lessonId = params.lessonId
    const userId = session.user.id
    const { timeSpent = 0 } = await request.json()

    // Try to connect to database
    const db = await connectToDatabase()

    if (db) {
      try {
        // Find user's progress for this course
        const userProgress = await UserProgress.findOne({
          userId,
          courseId
        })

        if (!userProgress) {
          return NextResponse.json(
            { success: false, error: 'Not enrolled in this course' },
            { status: 400 }
          )
        }

        // Find the lesson in progress
        const lessonIndex = userProgress.lessonsProgress.findIndex(
          lesson => lesson.lessonId === lessonId
        )

        if (lessonIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Lesson not found in course' },
            { status: 404 }
          )
        }

        // Mark lesson as completed
        userProgress.lessonsProgress[lessonIndex].completed = true
        userProgress.lessonsProgress[lessonIndex].completedAt = new Date()
        userProgress.lessonsProgress[lessonIndex].timeSpent += timeSpent

        // Update total time spent
        userProgress.totalTimeSpent += timeSpent

        // Recalculate overall progress
        userProgress.updateOverallProgress()

        await userProgress.save()

        console.log(`✅ User ${userId} completed lesson ${lessonId} in course ${courseId}`)

        return NextResponse.json({
          success: true,
          progress: userProgress,
          message: 'Lesson completed successfully'
        })
      } catch (dbError) {
        console.error('⚠️ Database operation failed:', dbError)
        return NextResponse.json(
          { success: false, error: 'Failed to complete lesson' },
          { status: 500 }
        )
      }
    } else {
      // Database unavailable - simulate completion for demo
      console.log('⚠️ Database unavailable, simulating lesson completion')
      return NextResponse.json({
        success: true,
        message: 'Lesson completed successfully (demo mode)'
      })
    }
  } catch (error) {
    console.error('Error completing lesson:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
