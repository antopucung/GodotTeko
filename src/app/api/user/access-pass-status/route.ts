import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has active access pass in Sanity
    const userWithAccessPass = await sanityClient.fetch(`
      *[_type == "user" && _id == $userId][0] {
        _id,
        accessPass {
          isActive,
          activatedAt,
          expiresAt,
          plan
        }
      }
    `, { userId: session.user.id })

    if (!userWithAccessPass) {
      return NextResponse.json({
        hasActivePass: false,
        message: 'User not found'
      })
    }

    const accessPass = userWithAccessPass.accessPass

    // Check if access pass is active and not expired
    const hasActivePass = accessPass?.isActive &&
      (!accessPass.expiresAt || new Date(accessPass.expiresAt) > new Date())

    const response = {
      hasActivePass,
      accessPass: hasActivePass ? {
        plan: accessPass.plan || 'annual',
        activatedAt: accessPass.activatedAt,
        expiresAt: accessPass.expiresAt,
        daysRemaining: accessPass.expiresAt
          ? Math.ceil((new Date(accessPass.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null
      } : null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error checking access pass status:', error)
    return NextResponse.json(
      { error: 'Failed to check access pass status' },
      { status: 500 }
    )
  }
}

// POST endpoint to activate access pass (for after purchase)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan = 'annual', purchaseId } = await request.json()

    // Calculate expiration date (1 year from now for annual plan)
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    // Update user's access pass status in Sanity
    const updatedUser = await sanityClient
      .patch(session.user.id)
      .set({
        accessPass: {
          isActive: true,
          plan,
          activatedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          purchaseId
        }
      })
      .commit()

    return NextResponse.json({
      success: true,
      message: 'Access pass activated successfully',
      accessPass: {
        plan,
        activatedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        daysRemaining: 365
      }
    })

  } catch (error) {
    console.error('Error activating access pass:', error)
    return NextResponse.json(
      { error: 'Failed to activate access pass' },
      { status: 500 }
    )
  }
}
