import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// POST /api/courses/[id]/publish - Publish/unpublish course
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courseId = params.id
    const { published } = await request.json()

    // Get user
    const user = await client.fetch(
      `*[_type == "userEnhanced" && email == $email][0] {
        _id,
        role,
        permissions,
        creatorProfile
      }`,
      { email: session.user.email }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get course and verify ownership
    const course = await client.fetch(
      `*[_type == "course" && _id == $courseId][0] {
        _id,
        title,
        instructor,
        published,
        lessons,
        description,
        thumbnail
      }`,
      { courseId }
    )

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check permissions (course owner or admin)
    const isOwner = course.instructor._ref === user._id
    const isAdmin = ['admin', 'super_admin'].includes(user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only publish your own courses' },
        { status: 403 }
      )
    }

    // Validate course is ready for publishing
    if (published && !course.published) {
      const validationErrors = []

      if (!course.title || course.title.trim().length < 5) {
        validationErrors.push('Course title must be at least 5 characters long')
      }

      if (!course.description || course.description.trim().length < 50) {
        validationErrors.push('Course description must be at least 50 characters long')
      }

      if (!course.thumbnail) {
        validationErrors.push('Course must have a thumbnail image')
      }

      if (!course.lessons || course.lessons.length === 0) {
        validationErrors.push('Course must have at least one lesson')
      }

      // Check if lessons have required content
      if (course.lessons?.length > 0) {
        const incompleteLessons = course.lessons.filter((lesson: any) =>
          !lesson.title || (!lesson.videoUrl && !lesson.content)
        )

        if (incompleteLessons.length > 0) {
          validationErrors.push('All lessons must have a title and either video or text content')
        }
      }

      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            error: 'Course is not ready for publishing',
            validationErrors,
            canPublish: false
          },
          { status: 400 }
        )
      }
    }

    // Update course publication status
    const updatedCourse = await client
      .patch(courseId)
      .set({
        published: published,
        updatedAt: new Date().toISOString(),
        ...(published && !course.published ? { publishedAt: new Date().toISOString() } : {})
      })
      .commit()

    // Update creator stats if publishing for first time
    if (published && !course.published && user.creatorProfile) {
      // This would be the first time this course is published
      await client
        .patch(user._id)
        .inc({
          'creatorProfile.contentStats.coursesCreated': 0 // Don't double count, already counted on creation
        })
        .commit()
    }

    const action = published ? 'published' : 'unpublished'

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: `Course "${course.title}" ${action} successfully`,
      published,
      publishedAt: published ? updatedCourse.publishedAt : null
    })

  } catch (error) {
    console.error('Error publishing course:', error)
    return NextResponse.json(
      { error: 'Failed to update course publication status' },
      { status: 500 }
    )
  }
}

// GET /api/courses/[id]/publish - Check if course can be published
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courseId = params.id

    // Get course
    const course = await client.fetch(
      `*[_type == "course" && _id == $courseId][0] {
        _id,
        title,
        description,
        thumbnail,
        lessons,
        published,
        instructor
      }`,
      { courseId }
    )

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check readiness for publishing
    const checks = {
      hasTitle: course.title && course.title.trim().length >= 5,
      hasDescription: course.description && course.description.trim().length >= 50,
      hasThumbnail: !!course.thumbnail,
      hasLessons: course.lessons && course.lessons.length > 0,
      lessonsComplete: course.lessons?.every((lesson: any) =>
        lesson.title && (lesson.videoUrl || lesson.content)
      ) || false
    }

    const canPublish = Object.values(checks).every(check => check)
    const completionPercentage = Math.round(
      (Object.values(checks).filter(check => check).length / Object.keys(checks).length) * 100
    )

    return NextResponse.json({
      success: true,
      canPublish,
      currentlyPublished: course.published,
      completionPercentage,
      checks,
      recommendations: {
        ...(!checks.hasTitle && { title: 'Add a descriptive title (min 5 characters)' }),
        ...(!checks.hasDescription && { description: 'Write a detailed description (min 50 characters)' }),
        ...(!checks.hasThumbnail && { thumbnail: 'Upload an attractive thumbnail image' }),
        ...(!checks.hasLessons && { lessons: 'Create at least one lesson' }),
        ...(!checks.lessonsComplete && { lessonsContent: 'Complete all lesson content' })
      }
    })

  } catch (error) {
    console.error('Error checking course publication readiness:', error)
    return NextResponse.json(
      { error: 'Failed to check course status' },
      { status: 500 }
    )
  }
}
