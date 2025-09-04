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

    // Get teacher profile
    const teacher = await client.fetch(
      `*[_type == "userEnhanced" && email == $email && role == "teacher"][0] {
        _id,
        name,
        email,
        teacherProfile
      }`,
      { email: session.user.email }
    )

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Get teacher's classes
    const classes = await client.fetch(
      `*[_type == "teacherClass" && teacher._ref == $teacherId] {
        _id,
        className,
        status,
        enrolledStudents,
        schedule,
        createdAt,
        "studentCount": count(enrolledStudents)
      }`,
      { teacherId: teacher._id }
    )

    // Get total students across all classes
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0)

    // Get courses created by teacher
    const courses = await client.fetch(
      `*[_type == "course" && instructor._ref == $teacherId] {
        _id,
        title,
        published,
        enrollmentCount,
        createdAt
      }`,
      { teacherId: teacher._id }
    )

    // Get student progress for certificates issued
    const studentProgress = await client.fetch(
      `*[_type == "studentProgress" && teacher._ref == $teacherId] {
        _id,
        certificateIssued,
        certificateDate,
        finalGrade,
        completionDate,
        student,
        course
      }`,
      { teacherId: teacher._id }
    )

    const certificatesIssued = studentProgress.filter(progress => progress.certificateIssued).length

    // Calculate revenue (simplified for now)
    const monthlyRevenue = teacher.teacherProfile?.revenueEarned || 0
    const totalRevenue = teacher.teacherProfile?.revenueEarned || 0

    // Recent activity (last 10 activities)
    const recentActivity = [
      ...studentProgress
        .filter(progress => progress.completionDate)
        .slice(0, 5)
        .map(progress => ({
          title: `Student completed course`,
          time: new Date(progress.completionDate).toLocaleDateString(),
          type: 'completion'
        })),
      ...classes
        .slice(0, 3)
        .map(cls => ({
          title: `Class "${cls.className}" updated`,
          time: new Date(cls.createdAt).toLocaleDateString(),
          type: 'class_update'
        })),
      ...courses
        .filter(course => course.published)
        .slice(0, 2)
        .map(course => ({
          title: `Course "${course.title}" published`,
          time: new Date(course.createdAt).toLocaleDateString(),
          type: 'course_published'
        }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)

    // Upcoming classes (simplified - would need proper scheduling)
    const upcomingClasses = classes
      .filter(cls => cls.status === 'active')
      .slice(0, 5)
      .map(cls => ({
        name: cls.className,
        time: cls.schedule?.meetingTime || 'Schedule TBD',
        students: cls.studentCount || 0,
        id: cls._id
      }))

    const stats = {
      totalStudents,
      totalClasses: classes.length,
      totalCourses: courses.length,
      certificatesIssued,
      monthlyRevenue,
      totalRevenue,
      recentActivity,
      upcomingClasses,
      // Additional stats
      activeClasses: classes.filter(cls => cls.status === 'active').length,
      publishedCourses: courses.filter(course => course.published).length,
      totalEnrollments: courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0),
      averageGrade: studentProgress.length > 0
        ? Math.round(studentProgress.reduce((sum, progress) => sum + (progress.finalGrade || 0), 0) / studentProgress.length)
        : 0
    }

    return NextResponse.json({
      success: true,
      stats,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        institution: teacher.teacherProfile?.institution
      }
    })

  } catch (error) {
    console.error('Teacher dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
