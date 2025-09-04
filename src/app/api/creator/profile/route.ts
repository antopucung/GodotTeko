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

    // Get enhanced user profile with creator capabilities
    const creator = await client.fetch(
      `*[_type == "userEnhanced" && email == $email && role in ["partner", "teacher", "admin", "super_admin"]][0] {
        _id,
        name,
        email,
        image,
        role,
        subscriptionTier,
        subscriptionStatus,
        permissions,
        teacherProfile,
        creatorProfile,
        lastLogin,
        joinedAt
      }`,
      { email: session.user.email }
    )

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Get comprehensive creator statistics
    const [assetStats, courseStats, studentStats, revenueStats] = await Promise.all([
      // Asset statistics
      client.fetch(
        `{
          "assetsPublished": count(*[_type == "product" && author._ref == $creatorId]),
          "totalAssetSales": count(*[_type == "order" && references($creatorId)]),
          "assetViews": sum(*[_type == "product" && author._ref == $creatorId].stats.views),
          "assetLikes": sum(*[_type == "product" && author._ref == $creatorId].stats.likes)
        }`,
        { creatorId: creator._id }
      ),

      // Course statistics
      client.fetch(
        `{
          "coursesCreated": count(*[_type == "course" && instructor._ref == $creatorId]),
          "coursesPublished": count(*[_type == "course" && instructor._ref == $creatorId && published == true]),
          "totalEnrollments": sum(*[_type == "course" && instructor._ref == $creatorId].enrollmentCount),
          "averageRating": round(avg(*[_type == "course" && instructor._ref == $creatorId].averageRating) * 10) / 10
        }`,
        { creatorId: creator._id }
      ),

      // Student statistics (for teachers)
      client.fetch(
        `{
          "totalStudents": count(*[_type == "teacherClass" && teacher._ref == $creatorId] | [].enrolledStudents[]),
          "activeClasses": count(*[_type == "teacherClass" && teacher._ref == $creatorId && status == "active"]),
          "certificatesIssued": count(*[_type == "studentProgress" && teacher._ref == $creatorId && certificateIssued == true])
        }`,
        { creatorId: creator._id }
      ),

      // Revenue statistics
      client.fetch(
        `{
          "assetRevenue": $creatorId in *[_type == "partnerPayout" && partner._ref == $creatorId].totalAmount,
          "courseRevenue": $creatorId in *[_type == "transaction" && references($creatorId)].amount,
          "totalEarnings": coalesce(creator.teacherProfile.revenueEarned, 0) + coalesce(creator.creatorProfile.revenueTracking.totalEarnings, 0)
        }`,
        { creatorId: creator._id }
      )
    ])

    // Get recent activity
    const recentActivity = await client.fetch(
      `*[
        (_type == "product" && author._ref == $creatorId) ||
        (_type == "course" && instructor._ref == $creatorId) ||
        (_type == "teacherClass" && teacher._ref == $creatorId)
      ] | order(_createdAt desc) [0...10] {
        _id,
        _type,
        title,
        "name": coalesce(title, className),
        _createdAt,
        "status": coalesce(published, status, "active")
      }`,
      { creatorId: creator._id }
    )

    // Combine all statistics
    const combinedStats = {
      // Asset metrics
      assetsPublished: assetStats.assetsPublished || 0,
      totalAssetSales: assetStats.totalAssetSales || 0,
      assetViews: assetStats.assetViews || 0,
      assetLikes: assetStats.assetLikes || 0,

      // Course metrics
      coursesCreated: courseStats.coursesCreated || 0,
      coursesPublished: courseStats.coursesPublished || 0,
      totalEnrollments: courseStats.totalEnrollments || 0,
      averageRating: courseStats.averageRating || 0,

      // Student metrics
      totalStudents: studentStats.totalStudents || 0,
      activeClasses: studentStats.activeClasses || 0,
      certificatesIssued: studentStats.certificatesIssued || 0,

      // Revenue metrics
      assetRevenue: creator.creatorProfile?.revenueTracking?.assetRevenue || 0,
      courseRevenue: creator.creatorProfile?.revenueTracking?.courseRevenue || 0,
      teachingRevenue: creator.teacherProfile?.revenueEarned || 0,
      totalEarnings: (creator.creatorProfile?.revenueTracking?.totalEarnings || 0) +
                     (creator.teacherProfile?.revenueEarned || 0),

      // Performance metrics
      conversionRate: assetStats.totalAssetSales > 0 && assetStats.assetViews > 0
        ? Math.round((assetStats.totalAssetSales / assetStats.assetViews) * 10000) / 100
        : 0,
      studentSatisfaction: courseStats.averageRating > 0 ? courseStats.averageRating : 0
    }

    // Creator capabilities
    const capabilities = {
      canCreateAssets: ['partner', 'admin', 'super_admin'].includes(creator.role) ||
                      creator.creatorProfile?.creatorCapabilities?.canCreateAssets,
      canCreateCourses: ['teacher', 'partner', 'admin', 'super_admin'].includes(creator.role) ||
                       creator.permissions?.includes('create_courses') ||
                       creator.creatorProfile?.creatorCapabilities?.canCreateCourses,
      canCreateProjects: creator.creatorProfile?.creatorCapabilities?.canCreateProjects || false,
      canCreateVipContent: creator.creatorProfile?.creatorCapabilities?.canCreateVipContent || false,
      canManageStudents: ['teacher', 'admin', 'super_admin'].includes(creator.role) ||
                        creator.permissions?.includes('manage_students'),
      canAccessAnalytics: creator.permissions?.includes('access_analytics') ||
                         ['teacher', 'partner', 'admin', 'super_admin'].includes(creator.role)
    }

    return NextResponse.json({
      creator: {
        ...creator,
        stats: combinedStats,
        capabilities,
        recentActivity
      }
    })

  } catch (error) {
    console.error('Creator profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creator profile' },
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
      studioName,
      studioDescription,
      specializations,
      website,
      portfolioUrl,
      institution,
      bio
    } = body

    // Get current creator
    const creator = await client.fetch(
      `*[_type == "userEnhanced" && email == $email && role in ["partner", "teacher", "admin", "super_admin"]][0]`,
      { email: session.user.email }
    )

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Update creator profile
    const updateData: any = {}

    if (name) updateData.name = name

    // Update creator profile data
    if (studioName || studioDescription || specializations || website || portfolioUrl) {
      updateData.creatorProfile = {
        ...creator.creatorProfile,
        ...(studioName && { studioName }),
        ...(studioDescription && { studioDescription }),
        ...(specializations && { specializations }),
        ...(website && { website }),
        ...(portfolioUrl && { portfolioUrl })
      }
    }

    // Update teacher profile data
    if (institution && creator.role === 'teacher') {
      updateData.teacherProfile = {
        ...creator.teacherProfile,
        institution
      }
    }

    const updatedCreator = await client
      .patch(creator._id)
      .set(updateData)
      .commit()

    return NextResponse.json({
      success: true,
      message: 'Creator profile updated successfully',
      creator: updatedCreator
    })

  } catch (error) {
    console.error('Creator profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update creator profile' },
      { status: 500 }
    )
  }
}
