import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { client } from '@/lib/sanity'
import { EmailService } from '@/lib/email/emailService'
import { getPartnerCommissionRate } from '@/config/platform'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !isAdmin(session.user.role as string)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const application = await client.fetch(
      `*[_type == "partnerApplication" && _id == $id][0] {
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
        personalInfo,
        professional,
        business,
        technical,
        agreement,
        reviewNotes,
        rejectionReason,
        feedback,
        flagged,
        priority,
        user-> {
          _id,
          name,
          email,
          role
        }
      }`,
      { id }
    )

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error) {
    console.error('Error fetching partner application:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partner application' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !isAdmin(session.user.role as string)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, reviewNotes, feedback, rejectionReason } = await request.json()

    if (!['approve', 'reject', 'hold', 'review'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the application first
    const application = await client.fetch(
      `*[_type == "partnerApplication" && _id == $id][0] {
        _id,
        status,
        personalInfo,
        user-> {
          _id,
          name,
          email,
          role
        }
      }`,
      { id }
    )

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const currentTime = new Date().toISOString()
    const adminName = session.user.name || session.user.email || 'Admin'

    let updateData: any = {
      reviewedAt: currentTime,
      reviewedBy: adminName
    }

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes
    }

    if (feedback) {
      updateData.feedback = feedback
    }

    // Handle different actions
    switch (action) {
      case 'approve':
        updateData.status = 'approved'
        updateData.approvedAt = currentTime
        updateData.approvedBy = adminName
        break

      case 'reject':
        updateData.status = 'rejected'
        updateData.rejectedAt = currentTime
        if (rejectionReason) {
          updateData.rejectionReason = rejectionReason
        }
        break

      case 'hold':
        updateData.status = 'on_hold'
        break

      case 'review':
        updateData.status = 'under_review'
        break
    }

    // Update the application
    await client
      .patch(id)
      .set(updateData)
      .commit()

    // If approved, update user role to partner
    if (action === 'approve') {
      await client
        .patch(application.user._id)
        .set({
          role: 'partner',
          partnerInfo: {
            approved: true,
            approvedAt: currentTime,
            commissionRate: getPartnerCommissionRate(),
            totalEarnings: 0,
            productsPublished: 0
          }
        })
        .commit()

      // Send approval email
      try {
        await EmailService.sendPartnerApplicationUpdate(
          application.personalInfo.email,
          application.personalInfo.fullName,
          'approved',
          feedback || 'Congratulations! Your partner application has been approved. You can now start uploading products and earning commissions.'
        )
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
      }

      // Send admin notification
      try {
        await EmailService.sendAdminNotification(
          'Partner Application Approved',
          `${application.personalInfo.fullName} has been approved as a partner by ${adminName}.`,
          {
            applicantName: application.personalInfo.fullName,
            applicantEmail: application.personalInfo.email,
            reviewedBy: adminName,
            reviewNotes
          }
        )
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
      }
    }

    // If rejected, send rejection email
    if (action === 'reject') {
      try {
        await EmailService.sendPartnerApplicationUpdate(
          application.personalInfo.email,
          application.personalInfo.fullName,
          'rejected',
          feedback || rejectionReason || 'Thank you for your interest in becoming a partner. Unfortunately, we cannot approve your application at this time. You are welcome to reapply in the future.'
        )
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError)
      }
    }

    // If put on hold, send notification email
    if (action === 'hold') {
      try {
        await EmailService.sendPartnerApplicationUpdate(
          application.personalInfo.email,
          application.personalInfo.fullName,
          'pending',
          feedback || 'Your partner application is currently on hold for additional review. We will contact you soon with an update.'
        )
      } catch (emailError) {
        console.error('Failed to send hold notification email:', emailError)
      }
    }

    const actionMessages = {
      approve: 'Application approved successfully',
      reject: 'Application rejected',
      hold: 'Application put on hold',
      review: 'Application moved to under review'
    }

    return NextResponse.json({
      success: true,
      message: actionMessages[action as keyof typeof actionMessages],
      application: {
        ...application,
        ...updateData
      }
    })

  } catch (error) {
    console.error('Error updating partner application:', error)
    return NextResponse.json(
      { error: 'Failed to update partner application' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !isAdmin(session.user.role as string)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if application exists and get applicant info
    const application = await client.fetch(
      `*[_type == "partnerApplication" && _id == $id][0] {
        _id,
        personalInfo.fullName,
        status
      }`,
      { id }
    )

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Only allow deletion of rejected or withdrawn applications
    if (!['rejected', 'withdrawn'].includes(application.status)) {
      return NextResponse.json(
        { error: 'Can only delete rejected or withdrawn applications' },
        { status: 400 }
      )
    }

    // Delete the application
    await client.delete(id)

    return NextResponse.json({
      success: true,
      message: `Application for ${application.personalInfo.fullName} has been deleted`
    })

  } catch (error) {
    console.error('Error deleting partner application:', error)
    return NextResponse.json(
      { error: 'Failed to delete partner application' },
      { status: 500 }
    )
  }
}
