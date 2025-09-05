import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'
import { EmailService } from '@/lib/email/emailService'
import { PLATFORM_CONFIG, getAutoApprovalThreshold, getPartnerCommissionRate } from '@/config/platform'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applicationData = await request.json()

    // Validate required fields
    const requiredFields = [
      'personalInfo.fullName',
      'personalInfo.email',
      'personalInfo.portfolio',
      'professional.experience',
      'professional.specialties',
      'business.businessType',
      'technical.designTools',
      'agreement.terms',
      'agreement.commission'
    ]

    for (const field of requiredFields) {
      const value = getNestedValue(applicationData, field)
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return NextResponse.json({
          error: 'Missing required fields',
          field: field
        }, { status: 400 })
      }
    }

    // Check if user already has a pending application
    const existingApplication = await client.fetch(
      `*[_type == "partnerApplication" && user._ref == $userId && status in ["pending", "under_review"]][0]`,
      { userId: session.user.id }
    )

    if (existingApplication) {
      return NextResponse.json({
        error: 'You already have a pending partner application',
        applicationId: existingApplication._id,
        status: existingApplication.status
      }, { status: 409 })
    }

    // Calculate application score based on criteria
    const applicationScore = calculateApplicationScore(applicationData)

    // Create partner application
    const application = await client.create({
      _type: 'partnerApplication',
      user: { _type: 'reference', _ref: session.user.id },
      status: 'pending',
      score: applicationScore,
      submittedAt: new Date().toISOString(),

      // Personal Information
      personalInfo: {
        fullName: applicationData.personalInfo.fullName,
        email: applicationData.personalInfo.email,
        phone: applicationData.personalInfo.phone,
        location: applicationData.personalInfo.location,
        website: applicationData.personalInfo.website,
        portfolio: applicationData.personalInfo.portfolio
      },

      // Professional Background
      professional: {
        experience: applicationData.professional.experience,
        specialties: applicationData.professional.specialties,
        previousWork: applicationData.professional.previousWork,
        teamSize: applicationData.professional.teamSize,
        yearsActive: applicationData.professional.yearsActive
      },

      // Business Information
      business: {
        businessType: applicationData.business.businessType,
        expectedRevenue: applicationData.business.expectedRevenue,
        targetAudience: applicationData.business.targetAudience,
        marketingStrategy: applicationData.business.marketingStrategy
      },

      // Technical Requirements
      technical: {
        designTools: applicationData.technical.designTools,
        fileFormats: applicationData.technical.fileFormats,
        qualityStandards: applicationData.technical.qualityStandards,
        originalWork: applicationData.technical.originalWork,
        licensing: applicationData.technical.licensing
      },

      // Agreements
      agreement: {
        terms: applicationData.agreement.terms,
        commission: applicationData.agreement.commission,
        quality: applicationData.agreement.quality,
        exclusivity: applicationData.agreement.exclusivity
      },

      // Auto-approval for high-scoring applications
      autoApproved: applicationScore >= getAutoApprovalThreshold(),
      reviewNotes: applicationScore >= getAutoApprovalThreshold() ? 'Auto-approved based on high application score' : null
    })

    // Auto-approve high-scoring applications based on configuration
    const shouldAutoApprove = PLATFORM_CONFIG.development.autoApprovePartners || applicationScore >= getAutoApprovalThreshold()

    if (shouldAutoApprove) {
      // Update application status to approved
      await client
        .patch(application._id)
        .set({
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: 'system'
        })
        .commit()

      // Update user role to partner
      await client
        .patch(session.user.id)
        .set({
          role: 'partner',
          partnerInfo: {
            approved: true,
            approvedAt: new Date().toISOString(),
            commissionRate: getPartnerCommissionRate(),
            totalEarnings: 0,
            productsPublished: 0
          }
        })
        .commit()

      // Send approval email
      try {
        await EmailService.sendPartnerApplicationUpdate(
          applicationData.personalInfo.email,
          applicationData.personalInfo.fullName,
          'approved',
          'Congratulations! Your application has been automatically approved. You can now start uploading products and earning commissions.'
        )
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
      }

      // Send admin notification for auto-approved applications
      try {
        await EmailService.sendAdminNotification(
          'Partner Application Auto-Approved',
          `${applicationData.personalInfo.fullName} has been automatically approved as a partner.`,
          {
            applicantName: applicationData.personalInfo.fullName,
            applicantEmail: applicationData.personalInfo.email,
            score: applicationScore,
            portfolio: applicationData.personalInfo.portfolio
          }
        )
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
      }

      return NextResponse.json({
        success: true,
        applicationId: application._id,
        status: 'approved',
        message: 'Congratulations! Your partner application has been approved. You can now start uploading products.',
        autoApproved: true
      })
    } else {
      // Send confirmation email for pending applications
      try {
        await EmailService.sendPartnerApplicationUpdate(
          applicationData.personalInfo.email,
          applicationData.personalInfo.fullName,
          'pending',
          `Thank you for applying to become a UI8 partner. We will review your application within ${PLATFORM_CONFIG.partner.reviewTimeframe} and get back to you with a decision.`
        )
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
      }

      // Send admin notification for manual review
      try {
        await EmailService.sendAdminNotification(
          'New Partner Application Received',
          `${applicationData.personalInfo.fullName} has submitted a partner application for manual review.`,
          {
            applicantName: applicationData.personalInfo.fullName,
            applicantEmail: applicationData.personalInfo.email,
            score: applicationScore,
            portfolio: applicationData.personalInfo.portfolio,
            experience: applicationData.professional.experience,
            specialties: applicationData.professional.specialties.join(', ')
          }
        )
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
      }

      return NextResponse.json({
        success: true,
        applicationId: application._id,
        status: 'pending',
        message: `Your partner application has been submitted successfully. We will review it within ${PLATFORM_CONFIG.partner.reviewTimeframe}.`,
        estimatedReviewTime: PLATFORM_CONFIG.partner.reviewTimeframe
      })
    }

  } catch (error) {
    console.error('Error processing partner application:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit partner application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Calculate application score based on configurable criteria
function calculateApplicationScore(applicationData: any): number {
  let score = 0

  // Portfolio quality
  if (applicationData.personalInfo.portfolio) {
    score += PLATFORM_CONFIG.applicationScoring.portfolio.hasPortfolio
    if (applicationData.personalInfo.portfolio.includes('dribbble') ||
        applicationData.personalInfo.portfolio.includes('behance')) {
      score += PLATFORM_CONFIG.applicationScoring.portfolio.premiumPlatform
    }
  }

  // Experience level
  const experienceScores = {
    'expert': PLATFORM_CONFIG.applicationScoring.experience.expert,
    'experienced': PLATFORM_CONFIG.applicationScoring.experience.experienced,
    'intermediate': PLATFORM_CONFIG.applicationScoring.experience.intermediate,
    'beginner': PLATFORM_CONFIG.applicationScoring.experience.beginner
  }
  score += experienceScores[applicationData.professional.experience as keyof typeof experienceScores] || 0

  // Number of specialties
  const specialtyCount = applicationData.professional.specialties?.length || 0
  score += Math.min(specialtyCount * PLATFORM_CONFIG.applicationScoring.specialties.pointsPerSpecialty, PLATFORM_CONFIG.applicationScoring.specialties.maxPoints)

  // Design tools proficiency
  const toolCount = applicationData.technical.designTools?.length || 0
  score += Math.min(toolCount * PLATFORM_CONFIG.applicationScoring.tools.pointsPerTool, PLATFORM_CONFIG.applicationScoring.tools.maxPoints)

  // Business readiness
  if (applicationData.business.businessType) score += PLATFORM_CONFIG.applicationScoring.business.hasBusinessType
  if (applicationData.business.marketingStrategy) score += PLATFORM_CONFIG.applicationScoring.business.hasMarketingStrategy

  // Quality commitments
  if (applicationData.technical.qualityStandards) score += PLATFORM_CONFIG.applicationScoring.quality.qualityStandards
  if (applicationData.technical.originalWork) score += PLATFORM_CONFIG.applicationScoring.quality.originalWork

  return Math.min(score, PLATFORM_CONFIG.applicationScoring.maxScore)
}

// Utility function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}
