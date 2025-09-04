import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SimplifiedLicenseManager } from '@/lib/simplified-license-manager'

// Import real or mock Stripe based on environment
let stripe: any

if (process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true') {
  const mockStripe = await import('@/lib/mock-stripe')
  stripe = mockStripe.mockStripe
} else {
  const realStripe = await import('@/lib/stripe')
  stripe = realStripe.stripe
}

// GET - Check access pass status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get access pass using Simplified License Manager
    const accessPassResult = await SimplifiedLicenseManager.manageAccessPass('get', { userId: session.user.id })
    const accessCheck = await SimplifiedLicenseManager.checkAccess(session.user.id)

    if (!accessPassResult || typeof accessPassResult === 'boolean') {
      return NextResponse.json({
        hasAccessPass: false,
        isActive: false,
        message: 'No access pass found'
      })
    }

    const accessPass = accessPassResult

    // Check if access pass is currently active (simplified logic)
    const isActive = accessCheck.hasAccess && accessCheck.method === 'access_pass'

    // Calculate days remaining for non-lifetime passes
    let daysRemaining = null
    if (accessPass.passType !== 'lifetime' && accessPass.currentPeriodEnd) {
      const endDate = new Date(accessPass.currentPeriodEnd)
      const now = new Date()
      daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Get license statistics using simplified manager
    const licenseResult = await SimplifiedLicenseManager.getUserLicenses({
      userId: session.user.id,
      limit: 1 // Just for stats
    })

    const downloadStats = {
      totalDownloads: licenseResult.stats.totalDownloads + (accessPass.usage?.totalDownloads || 0),
      totalLicenses: licenseResult.stats.totalLicenses,
      activeAccessPass: isActive,
      recentDownloads: [] // Could be expanded if needed
    }

    return NextResponse.json({
      hasAccessPass: true,
      isActive,
      accessPass: {
        ...accessPass,
        daysRemaining,
        isExpiringSoon: daysRemaining !== null && daysRemaining <= 7
      },
      downloadStats,
      // Simplified benefits - all access passes get the same features
      benefits: {
        unlimitedDownloads: true,
        allProducts: true,
        commercialLicense: true, // Simplified: all passes get commercial license
        prioritySupport: true,
        earlyAccess: true // Simplified: all passes get early access
      }
    })

  } catch (error) {
    console.error('Error fetching access pass:', error)
    return NextResponse.json(
      { error: 'Failed to fetch access pass status' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessPassResult = await SimplifiedLicenseManager.manageAccessPass('get', { userId: session.user.id })

    if (!accessPassResult || typeof accessPassResult === 'boolean') {
      return NextResponse.json({ error: 'No active access pass found' }, { status: 404 })
    }

    const accessPass = accessPassResult

    if (accessPass.passType === 'lifetime') {
      return NextResponse.json({ error: 'Cannot cancel lifetime access pass' }, { status: 400 })
    }

    if (!accessPass.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No subscription found to cancel' }, { status: 400 })
    }

    // Cancel subscription at period end
    if (process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true') {
      await stripe.updateSubscription(accessPass.stripeSubscriptionId, {
        cancel_at_period_end: true
      })
    } else {
      await stripe.subscriptions.update(accessPass.stripeSubscriptionId, {
        cancel_at_period_end: true
      })
    }

    // Update access pass status using simplified manager
    await SimplifiedLicenseManager.manageAccessPass('update', {
      userId: session.user.id,
      updates: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
      endsAt: accessPass.currentPeriodEnd
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

// PATCH - Reactivate subscription or update settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    const accessPassResult = await SimplifiedLicenseManager.manageAccessPass('get', { userId: session.user.id })

    if (!accessPassResult || typeof accessPassResult === 'boolean') {
      return NextResponse.json({ error: 'No access pass found' }, { status: 404 })
    }

    const accessPass = accessPassResult

    if (action === 'reactivate') {
      if (accessPass.passType === 'lifetime') {
        return NextResponse.json({ error: 'Lifetime pass cannot be reactivated' }, { status: 400 })
      }

      if (!accessPass.stripeSubscriptionId) {
        return NextResponse.json({ error: 'No subscription found to reactivate' }, { status: 400 })
      }

      // Reactivate subscription
      if (process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true') {
        await stripe.updateSubscription(accessPass.stripeSubscriptionId, {
          cancel_at_period_end: false
        })
      } else {
        await stripe.subscriptions.update(accessPass.stripeSubscriptionId, {
          cancel_at_period_end: false
        })
      }

      // Update access pass status using simplified manager
      await SimplifiedLicenseManager.manageAccessPass('update', {
        userId: session.user.id,
        updates: {
          cancelAtPeriodEnd: false,
          status: 'active',
          reactivatedAt: new Date().toISOString()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription has been reactivated'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error updating access pass:', error)
    return NextResponse.json(
      { error: 'Failed to update access pass' },
      { status: 500 }
    )
  }
}
