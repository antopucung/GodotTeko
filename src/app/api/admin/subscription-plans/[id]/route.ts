import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

// GET - Fetch single subscription plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planId = params.id

    const plan = await sanityClient.fetch(`
      *[_type == "subscriptionPlan" && _id == $planId][0] {
        _id,
        _createdAt,
        _updatedAt,
        planId,
        name,
        description,
        price,
        originalPrice,
        period,
        downloads,
        duration,
        features,
        highlighted,
        badge,
        enabled,
        sortOrder,
        metadata
      }
    `, { planId })

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      plan
    })

  } catch (error) {
    console.error('Error fetching subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plan' },
      { status: 500 }
    )
  }
}

// PUT - Update subscription plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planId = params.id
    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    const { _id, _createdAt, _updatedAt, ...updateData } = body

    // Validate if plan exists
    const existingPlan = await sanityClient.fetch(
      '*[_type == "subscriptionPlan" && _id == $planId][0]',
      { planId }
    )

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    // If planId is being changed, check for conflicts
    if (updateData.planId && updateData.planId !== existingPlan.planId) {
      const conflictingPlan = await sanityClient.fetch(
        '*[_type == "subscriptionPlan" && planId == $newPlanId && _id != $planId][0]',
        { newPlanId: updateData.planId, planId }
      )

      if (conflictingPlan) {
        return NextResponse.json(
          { error: 'Plan ID already exists' },
          { status: 400 }
        )
      }
    }

    // Process features if provided
    if (updateData.features) {
      updateData.features = updateData.features.map((feature: any) => ({
        feature: feature.feature || feature,
        enabled: feature.enabled !== false
      }))
    }

    // Convert numeric fields
    if (updateData.price) updateData.price = Number(updateData.price)
    if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice)
    if (updateData.downloads) updateData.downloads = Number(updateData.downloads)
    if (updateData.sortOrder) updateData.sortOrder = Number(updateData.sortOrder)

    // Update the plan
    const updatedPlan = await sanityClient
      .patch(planId)
      .set({
        ...updateData,
        'metadata.lastModifiedBy': session.user.id,
        'metadata.lastModifiedAt': new Date().toISOString()
      })
      .commit()

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'Subscription plan updated successfully'
    })

  } catch (error) {
    console.error('Error updating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    )
  }
}

// DELETE - Delete subscription plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planId = params.id

    // Check if plan exists
    const existingPlan = await sanityClient.fetch(
      '*[_type == "subscriptionPlan" && _id == $planId][0]',
      { planId }
    )

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    // Check if plan is currently being used by active subscriptions
    const activeSubscriptions = await sanityClient.fetch(
      '*[_type == "accessPass" && plan == $planId && isActive == true]',
      { planId: existingPlan.planId }
    )

    if (activeSubscriptions.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete plan with active subscriptions',
        details: `${activeSubscriptions.length} users are currently subscribed to this plan`
      }, { status: 400 })
    }

    // Soft delete by disabling instead of hard delete (recommended)
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'

    if (forceDelete) {
      // Hard delete
      await sanityClient.delete(planId)

      return NextResponse.json({
        success: true,
        message: 'Subscription plan permanently deleted'
      })
    } else {
      // Soft delete - just disable the plan
      const disabledPlan = await sanityClient
        .patch(planId)
        .set({
          enabled: false,
          'metadata.disabledBy': session.user.id,
          'metadata.disabledAt': new Date().toISOString()
        })
        .commit()

      return NextResponse.json({
        success: true,
        plan: disabledPlan,
        message: 'Subscription plan disabled successfully'
      })
    }

  } catch (error) {
    console.error('Error deleting subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription plan' },
      { status: 500 }
    )
  }
}
