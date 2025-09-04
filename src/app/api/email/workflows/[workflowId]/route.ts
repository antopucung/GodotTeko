import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { enhancedEmailService } from '@/lib/email/enhancedEmailService'

// GET - Get specific workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const workflowId = params.workflowId

    const workflow = await client.fetch(`
      *[_type == "emailWorkflow" && workflowId == $workflowId][0] {
        _id,
        workflowId,
        name,
        description,
        type,
        status,
        trigger,
        steps[] {
          ...,
          emailTemplate-> {
            _id,
            templateId,
            name,
            category,
            subject
          }
        },
        segmentation,
        settings,
        analytics,
        metadata
      }
    `, { workflowId })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ workflow })

  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

// PUT - Update workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const workflowId = params.workflowId
    const updates = await request.json()

    // Check if workflow exists
    const existingWorkflow = await client.fetch(`
      *[_type == "emailWorkflow" && workflowId == $workflowId][0]
    `, { workflowId })

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Prevent updating active workflows without proper status change
    if (existingWorkflow.status === 'active' && updates.status !== 'paused' && updates.status !== 'archived') {
      if (updates.steps || updates.trigger || updates.segmentation) {
        return NextResponse.json(
          { error: 'Cannot modify active workflow structure. Pause workflow first.' },
          { status: 400 }
        )
      }
    }

    // Update workflow
    const updatedWorkflow = await client
      .patch(existingWorkflow._id)
      .set({
        ...updates,
        'metadata.lastModifiedAt': new Date().toISOString(),
        'metadata.version': (existingWorkflow.metadata?.version || 1) + 1
      })
      .commit()

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
      message: 'Workflow updated successfully'
    })

  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

// DELETE - Delete workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const workflowId = params.workflowId

    // Check if workflow exists and is not active
    const workflow = await client.fetch(`
      *[_type == "emailWorkflow" && workflowId == $workflowId][0]
    `, { workflowId })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    if (workflow.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active workflow. Pause or archive first.' },
        { status: 400 }
      )
    }

    // Check if workflow has any active users
    if (workflow.analytics?.activeUsers > 0) {
      return NextResponse.json(
        { error: 'Cannot delete workflow with active users. Wait for completion or archive instead.' },
        { status: 400 }
      )
    }

    // Delete workflow
    await client.delete(workflow._id)

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}
