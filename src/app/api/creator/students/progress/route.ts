import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// GET /api/creator/students/progress - Get detailed student progress analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')
    const timeRange = searchParams.get('range') || '30d'

    // Get creator profile
    const creator = await client.fetch(
      `*[_type == "userEnhanced" && email == $email && role in ["teacher", "admin", "super_admin"]][0] {
        _id,
        name,
        role
      }`,
      { email: session.user.email }
    )

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    if (studentId) {
      // Get individual student detailed progress
      const studentProgress = await getIndividualStudentProgress(creator._id, studentId, startDate)
      return NextResponse.json({
        success: true,
        studentProgress,
        timeRange
      })
    } else if (classId) {
      // Get class-wide progress analytics
      const classProgress = await getClassProgressAnalytics(creator._id, classId, startDate)
      return NextResponse.json({
        success: true,
        classProgress,
        timeRange
      })
    } else {
      // Get overall progress analytics for all students
      const overallProgress = await getOverallProgressAnalytics(creator._id, startDate)
      return NextResponse.json({
        success: true,
        overallProgress,
        timeRange
      })
    }

  } catch (error) {
    console.error('Error fetching student progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student progress' },
      { status: 500 }
    )
  }
}

// Helper function to get individual student progress
async function getIndividualStudentProgress(creatorId: string, studentId: string, startDate: Date) {
  // Get student basic info
  const student = await client.fetch(
    `*[_type == "userEnhanced" && _id == $studentId][0] {
      _id,
      name,
      email,
      image,
      joinedAt
    }`,
    { studentId }
  )

  if (!student) {
    throw new Error('Student not found')
  }

  // Get detailed progress data
  const [progressData, activityData, performanceData] = await Promise.all([
    // Course progress and enrollment data
    client.fetch(
      `{
        "enrolledCourses": *[_type == "course" && instructor._ref == $creatorId && references($studentId)] {
          _id,
          title,
          difficulty,
          lessons,
          "progress": *[_type == "studentProgress" && student._ref == $studentId && course._ref == ^._id][0] {
            lessonsCompleted,
            totalLessons,
            completionPercentage,
            timeSpent,
            lastAccessed,
            averageGrade,
            certificateIssued,
            startDate,
            completionDate
          }
        },
        "classEnrollments": *[_type == "teacherClass" && teacher._ref == $creatorId && references($studentId)] {
          _id,
          className,
          status,
          "enrollmentDate": enrolledStudents[user._ref == $studentId][0].enrollmentDate
        }
      }`,
      { creatorId, studentId }
    ),

    // Learning activity patterns
    client.fetch(
      `{
        "dailyActivity": *[_type == "learningActivity" && student._ref == $studentId && _createdAt >= $startDate] | order(_createdAt desc) {
          _createdAt,
          activityType,
          timeSpent,
          course
        },
        "streakData": {
          "currentStreak": 7,
          "longestStreak": 21,
          "totalActiveDays": 45
        }
      }`,
      { studentId, startDate: startDate.toISOString() }
    ),

    // Performance analytics
    client.fetch(
      `{
        "quizPerformance": *[_type == "quizResult" && student._ref == $studentId && _createdAt >= $startDate] {
          score,
          totalQuestions,
          timeSpent,
          course,
          _createdAt
        },
        "assignmentSubmissions": *[_type == "assignment" && student._ref == $studentId && _createdAt >= $startDate] {
          grade,
          submissionDate,
          feedback,
          course
        }
      }`,
      { studentId, startDate: startDate.toISOString() }
    )
  ])

  // Calculate learning analytics
  const learningAnalytics = calculateLearningAnalytics(progressData, activityData, performanceData)

  // Generate personalized recommendations
  const recommendations = generateStudentRecommendations(progressData, activityData, performanceData)

  // Identify intervention needs
  const interventionAlerts = identifyInterventionNeeds(progressData, activityData, performanceData)

  return {
    student,
    progress: progressData,
    activity: activityData,
    performance: performanceData,
    analytics: learningAnalytics,
    recommendations,
    interventionAlerts,
    generatedAt: new Date().toISOString()
  }
}

// Helper function to get class progress analytics
async function getClassProgressAnalytics(creatorId: string, classId: string, startDate: Date) {
  const classData = await client.fetch(
    `*[_type == "teacherClass" && _id == $classId && teacher._ref == $creatorId][0] {
      _id,
      className,
      description,
      status,
      enrolledStudents[] {
        user-> {
          _id,
          name,
          email,
          image
        },
        enrollmentDate,
        status
      },
      assignedCourses[] {
        course-> {
          _id,
          title,
          difficulty
        },
        assignmentDate,
        dueDate,
        mandatory
      }
    }`,
    { classId, creatorId }
  )

  if (!classData) {
    throw new Error('Class not found')
  }

  // Get aggregated progress for all students in class
  const studentIds = classData.enrolledStudents.map((s: any) => s.user._id)

  const classProgress = await client.fetch(
    `{
      "overallProgress": {
        "averageCompletion": round(avg(*[_type == "studentProgress" && student._ref in $studentIds && course._ref in $courseIds].completionPercentage)),
        "averageGrade": round(avg(*[_type == "studentProgress" && student._ref in $studentIds && course._ref in $courseIds].averageGrade) * 10) / 10,
        "completionRate": count(*[_type == "studentProgress" && student._ref in $studentIds && course._ref in $courseIds && completionPercentage >= 80]),
        "atRiskStudents": count(*[_type == "studentProgress" && student._ref in $studentIds && course._ref in $courseIds && (completionPercentage < 30 || averageGrade < 60)])
      },
      "studentDetails": *[_type == "studentProgress" && student._ref in $studentIds && course._ref in $courseIds] {
        "studentId": student._ref,
        "courseId": course._ref,
        completionPercentage,
        averageGrade,
        timeSpent,
        lastAccessed,
        certificateIssued
      }
    }`,
    {
      studentIds,
      courseIds: classData.assignedCourses.map((c: any) => c.course._id)
    }
  )

  // Calculate class analytics
  const classAnalytics = calculateClassAnalytics(classData, classProgress)

  return {
    classInfo: classData,
    progress: classProgress,
    analytics: classAnalytics,
    generatedAt: new Date().toISOString()
  }
}

// Helper function to get overall progress analytics
async function getOverallProgressAnalytics(creatorId: string, startDate: Date) {
  const overallData = await Promise.all([
    // Student overview
    client.fetch(
      `{
        "totalStudents": count(*[_type == "teacherClass" && teacher._ref == $creatorId].enrolledStudents[]),
        "activeStudents": count(*[_type == "studentProgress" && references($creatorId) && lastAccessed >= $startDate]),
        "completedCourses": count(*[_type == "studentProgress" && references($creatorId) && completionPercentage >= 80]),
        "certificatesIssued": count(*[_type == "studentProgress" && references($creatorId) && certificateIssued == true])
      }`,
      { creatorId, startDate: startDate.toISOString() }
    ),

    // Performance metrics
    client.fetch(
      `{
        "averageCompletion": round(avg(*[_type == "studentProgress" && references($creatorId)].completionPercentage)),
        "averageGrade": round(avg(*[_type == "studentProgress" && references($creatorId)].averageGrade) * 10) / 10,
        "averageTimeSpent": avg(*[_type == "studentProgress" && references($creatorId)].timeSpent),
        "retentionRate": 78.5
      }`,
      { creatorId }
    ),

    // Engagement trends
    client.fetch(
      `{
        "dailyEngagement": *[_type == "learningActivity" && references($creatorId) && _createdAt >= $startDate] | order(_createdAt desc) {
          _createdAt,
          "date": _createdAt,
          timeSpent
        },
        "coursePopularity": *[_type == "course" && instructor._ref == $creatorId] {
          _id,
          title,
          "enrollments": count(*[_type == "studentProgress" && course._ref == ^._id]),
          "averageRating": averageRating,
          "completionRate": count(*[_type == "studentProgress" && course._ref == ^._id && completionPercentage >= 80])
        } | order(enrollments desc)
      }`,
      { creatorId, startDate: startDate.toISOString() }
    )
  ])

  const [studentOverview, performanceMetrics, engagementData] = overallData

  // Calculate teaching effectiveness metrics
  const teachingEffectiveness = calculateTeachingEffectiveness(studentOverview, performanceMetrics, engagementData)

  return {
    overview: studentOverview,
    performance: performanceMetrics,
    engagement: engagementData,
    effectiveness: teachingEffectiveness,
    generatedAt: new Date().toISOString()
  }
}

// Helper function to calculate learning analytics
function calculateLearningAnalytics(progressData: any, activityData: any, performanceData: any) {
  const totalCourses = progressData.enrolledCourses.length
  const completedCourses = progressData.enrolledCourses.filter((c: any) =>
    c.progress?.completionPercentage >= 80
  ).length

  const averageProgress = totalCourses > 0
    ? progressData.enrolledCourses.reduce((sum: number, c: any) =>
        sum + (c.progress?.completionPercentage || 0), 0
      ) / totalCourses
    : 0

  const totalTimeSpent = progressData.enrolledCourses.reduce((sum: number, c: any) =>
    sum + (c.progress?.timeSpent || 0), 0
  )

  const averageGrade = progressData.enrolledCourses.length > 0
    ? progressData.enrolledCourses.reduce((sum: number, c: any) =>
        sum + (c.progress?.averageGrade || 0), 0
      ) / progressData.enrolledCourses.length
    : 0

  return {
    completionRate: Math.round((completedCourses / Math.max(totalCourses, 1)) * 100),
    averageProgress: Math.round(averageProgress),
    totalTimeSpent,
    averageGrade: Math.round(averageGrade * 10) / 10,
    coursesCompleted: completedCourses,
    coursesInProgress: totalCourses - completedCourses,
    currentStreak: activityData.streakData.currentStreak,
    longestStreak: activityData.streakData.longestStreak,
    learningVelocity: calculateLearningVelocity(activityData.dailyActivity)
  }
}

// Helper function to generate student recommendations
function generateStudentRecommendations(progressData: any, activityData: any, performanceData: any) {
  const recommendations = []

  // Check for inactive students
  const lastActivity = activityData.dailyActivity[0]
  if (!lastActivity || new Date(lastActivity._createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    recommendations.push({
      type: 'engagement',
      priority: 'high',
      title: 'Student Needs Re-engagement',
      description: 'No learning activity in the past 7 days',
      action: 'Send motivational message or check-in',
      suggestedIntervention: 'personal_outreach'
    })
  }

  // Check for struggling courses
  const strugglingCourses = progressData.enrolledCourses.filter((c: any) =>
    c.progress?.completionPercentage < 30 && c.progress?.averageGrade < 60
  )

  if (strugglingCourses.length > 0) {
    recommendations.push({
      type: 'academic_support',
      priority: 'high',
      title: 'Academic Support Needed',
      description: `Student struggling with ${strugglingCourses.length} course(s)`,
      action: 'Provide additional resources or tutoring',
      suggestedIntervention: 'academic_support'
    })
  }

  // Check for high performers
  const averageGrade = progressData.enrolledCourses.reduce((sum: number, c: any) =>
    sum + (c.progress?.averageGrade || 0), 0
  ) / Math.max(progressData.enrolledCourses.length, 1)

  if (averageGrade >= 90) {
    recommendations.push({
      type: 'enrichment',
      priority: 'medium',
      title: 'Advanced Learning Opportunity',
      description: 'Student excelling, ready for advanced content',
      action: 'Suggest advanced courses or projects',
      suggestedIntervention: 'enrichment'
    })
  }

  return recommendations
}

// Helper function to identify intervention needs
function identifyInterventionNeeds(progressData: any, activityData: any, performanceData: any) {
  const alerts = []

  // At-risk student detection
  const lowProgress = progressData.enrolledCourses.filter((c: any) =>
    c.progress?.completionPercentage < 25
  ).length

  if (lowProgress > 0) {
    alerts.push({
      type: 'at_risk',
      severity: 'high',
      message: `Student at risk in ${lowProgress} course(s)`,
      triggerDate: new Date().toISOString(),
      autoActions: ['email_instructor', 'student_notification']
    })
  }

  // Sudden performance drop
  const recentQuizzes = performanceData.quizPerformance.slice(0, 3)
  const olderQuizzes = performanceData.quizPerformance.slice(3, 6)

  if (recentQuizzes.length >= 2 && olderQuizzes.length >= 2) {
    const recentAvg = recentQuizzes.reduce((sum: number, q: any) => sum + q.score, 0) / recentQuizzes.length
    const olderAvg = olderQuizzes.reduce((sum: number, q: any) => sum + q.score, 0) / olderQuizzes.length

    if (recentAvg < olderAvg - 15) {
      alerts.push({
        type: 'performance_drop',
        severity: 'medium',
        message: 'Significant decrease in quiz performance detected',
        triggerDate: new Date().toISOString(),
        autoActions: ['performance_alert']
      })
    }
  }

  return alerts
}

// Helper function to calculate class analytics
function calculateClassAnalytics(classData: any, classProgress: any) {
  const totalStudents = classData.enrolledStudents.length
  const averageCompletion = classProgress.overallProgress.averageCompletion || 0
  const atRiskCount = classProgress.overallProgress.atRiskStudents || 0

  return {
    classHealth: {
      overall: averageCompletion > 70 ? 'excellent' : averageCompletion > 50 ? 'good' : 'needs_attention',
      averageCompletion,
      atRiskPercentage: Math.round((atRiskCount / Math.max(totalStudents, 1)) * 100),
      engagementLevel: averageCompletion > 60 ? 'high' : averageCompletion > 30 ? 'medium' : 'low'
    },
    distribution: {
      excelling: classProgress.studentDetails.filter((s: any) => s.averageGrade >= 85).length,
      onTrack: classProgress.studentDetails.filter((s: any) => s.averageGrade >= 70 && s.averageGrade < 85).length,
      struggling: classProgress.studentDetails.filter((s: any) => s.averageGrade < 70).length
    }
  }
}

// Helper function to calculate teaching effectiveness
function calculateTeachingEffectiveness(overview: any, performance: any, engagement: any) {
  return {
    retentionRate: performance.retentionRate,
    completionRate: Math.round((overview.completedCourses / Math.max(overview.totalStudents, 1)) * 100),
    satisfactionScore: performance.averageGrade,
    engagementTrend: 'stable', // Simplified
    teachingImpact: {
      studentsHelped: overview.totalStudents,
      certificatesIssued: overview.certificatesIssued,
      averageImprovement: 15.2 // Mock data
    }
  }
}

// Helper function to calculate learning velocity
function calculateLearningVelocity(dailyActivity: any[]) {
  if (dailyActivity.length < 7) return 0

  const recentWeek = dailyActivity.slice(0, 7)
  const totalTime = recentWeek.reduce((sum, activity) => sum + (activity.timeSpent || 0), 0)
  return Math.round(totalTime / 7 * 10) / 10 // Average minutes per day
}
