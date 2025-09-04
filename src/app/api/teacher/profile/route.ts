import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile from enhanced user schema
    const teacher = await client.fetch(
      `*[_type == "userEnhanced" && email == $email && role == "teacher"][0] {
        _id,
        name,
        email,
        image,
        role,
        subscriptionTier,
        subscriptionStatus,
        permissions,
        teacherProfile,
        lastLogin,
        joinedAt
      }`,
      { email: session.user.email }
    )

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Get teacher's classes count
    const classesCount = await client.fetch(
      `count(*[_type == "teacherClass" && teacher._ref == $teacherId])`,
      { teacherId: teacher._id }
    )

    // Get total students across all classes
    const totalStudents = await client.fetch(
      `*[_type == "teacherClass" && teacher._ref == $teacherId] {
        "studentCount": count(enrolledStudents)
      }`,
      { teacherId: teacher._id }
    )

    const studentCount = totalStudents.reduce((sum: number, cls: any) => sum + (cls.studentCount || 0), 0)

    // Get courses created by teacher
    const coursesCount = await client.fetch(
      `count(*[_type == "course" && instructor._ref == $teacherId])`,
      { teacherId: teacher._id }
    )

    // Get certificates issued
    const certificatesIssued = await client.fetch(
      `count(*[_type == "studentProgress" && teacher._ref == $teacherId && certificateIssued == true])`,
      { teacherId: teacher._id }
    )

    return NextResponse.json({
      teacher: {
        ...teacher,
        stats: {
          classesCount,
          studentCount,
          coursesCount,
          certificatesIssued,
          revenueEarned: teacher.teacherProfile?.revenueEarned || 0
        }
      }
    })

  } catch (error) {
    console.error('Teacher profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teacher profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      institution,
      specialization,
      bio,
      certificationTemplate
    } = body

    // Get current teacher
    const teacher = await client.fetch(
      `*[_type == "userEnhanced" && email == $email && role == "teacher"][0]`,
      { email: session.user.email }
    )

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Update teacher profile
    const updatedTeacher = await client
      .patch(teacher._id)
      .set({
        name: name || teacher.name,
        teacherProfile: {
          ...teacher.teacherProfile,
          institution: institution || teacher.teacherProfile?.institution,
          specialization: Array.isArray(specialization) ? specialization : teacher.teacherProfile?.specialization || [],
          certificationTemplate: certificationTemplate || teacher.teacherProfile?.certificationTemplate
        }
      })
      .commit()

    // Also update the original user schema for backward compatibility
    const originalUser = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: session.user.email }
    )

    if (originalUser) {
      await client
        .patch(originalUser._id)
        .set({
          name: name || originalUser.name,
          bio: bio || originalUser.bio
        })
        .commit()
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher profile updated successfully',
      teacher: updatedTeacher
    })

  } catch (error) {
    console.error('Teacher profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update teacher profile' },
      { status: 500 }
    )
  }
}
