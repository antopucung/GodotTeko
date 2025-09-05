import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { client } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !isAdmin(session.user.role as string)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build filter conditions
    let statusFilter = ''
    if (status && status !== 'all') {
      statusFilter = ` && status == "${status}"`
    }

    let searchFilter = ''
    if (search) {
      searchFilter = ` && (personalInfo.fullName match "*${search}*" || personalInfo.email match "*${search}*")`
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Fetch applications with all details
    const applications = await client.fetch(
      `*[_type == "partnerApplication"${statusFilter}${searchFilter}] | order(submittedAt desc) [$offset...$end] {
        _id,
        status,
        score,
        autoApproved,
        submittedAt,
        reviewedAt,
        approvedAt,
        rejectedAt,
        reviewedBy,
        approvedBy,
        personalInfo {
          fullName,
          email,
          phone,
          location,
          website,
          portfolio
        },
        professional {
          experience,
          specialties,
          previousWork,
          teamSize,
          yearsActive
        },
        business {
          businessType,
          expectedRevenue,
          targetAudience,
          marketingStrategy
        },
        technical {
          designTools,
          fileFormats,
          qualityStandards,
          originalWork,
          licensing
        },
        agreement {
          terms,
          commission,
          quality,
          exclusivity
        },
        reviewNotes,
        rejectionReason,
        feedback,
        flagged,
        priority
      }`,
      {
        offset,
        end: offset + limit
      }
    )

    // Get total count for pagination
    const totalCount = await client.fetch(
      `count(*[_type == "partnerApplication"${statusFilter}${searchFilter}])`
    )

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Get summary statistics
    const stats = await client.fetch(
      `{
        "total": count(*[_type == "partnerApplication"]),
        "pending": count(*[_type == "partnerApplication" && status == "pending"]),
        "underReview": count(*[_type == "partnerApplication" && status == "under_review"]),
        "approved": count(*[_type == "partnerApplication" && status == "approved"]),
        "rejected": count(*[_type == "partnerApplication" && status == "rejected"]),
        "onHold": count(*[_type == "partnerApplication" && status == "on_hold"]),
        "autoApproved": count(*[_type == "partnerApplication" && autoApproved == true]),
        "highScore": count(*[_type == "partnerApplication" && score >= 80]),
        "flagged": count(*[_type == "partnerApplication" && flagged == true])
      }`
    )

    return NextResponse.json({
      success: true,
      applications,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      },
      stats
    })

  } catch (error) {
    console.error('Error fetching partner applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partner applications' },
      { status: 500 }
    )
  }
}
