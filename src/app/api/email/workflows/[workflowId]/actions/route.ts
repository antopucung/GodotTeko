import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { enhancedEmailService } from '@/lib/email/enhancedEmailService'

// POST - Execute workflow actions
export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const workflowId = params.workflowId
    const { action, ...actionData } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Get workflow
    const workflow = await client.fetch(`
      *[_type == "emailWorkflow" && workflowId == $workflowId][0]
    `, { workflowId })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'activate':
        return await activateWorkflow(workflow)

      case 'pause':
        return await pauseWorkflow(workflow)

      case 'test':
        return await testWorkflow(workflow, actionData)

      case 'trigger':
        return await triggerWorkflow(workflow, actionData)

      case 'duplicate':
        return await duplicateWorkflow(workflow, actionData)

      case 'export':
        return await exportWorkflow(workflow)

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error executing workflow action:', error)
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    )
  }
}

// Activate workflow
async function activateWorkflow(workflow: any) {
  try {
    // Validate workflow before activation
    const validation = await validateWorkflowForActivation(workflow)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Update workflow status to active
    const updatedWorkflow = await client
      .patch(workflow._id)
      .set({
        status: 'active',
        'metadata.lastModifiedAt': new Date().toISOString(),
        'metadata.activatedAt': new Date().toISOString()
      })
      .commit()

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
      message: 'Workflow activated successfully'
    })

  } catch (error) {
    console.error('Error activating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to activate workflow' },
      { status: 500 }
    )
  }
}

// Pause workflow
async function pauseWorkflow(workflow: any) {
  try {
    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active workflows can be paused' },
        { status: 400 }
      )
    }

    // Update workflow status to paused
    const updatedWorkflow = await client
      .patch(workflow._id)
      .set({
        status: 'paused',
        'metadata.lastModifiedAt': new Date().toISOString(),
        'metadata.pausedAt': new Date().toISOString()
      })
      .commit()

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
      message: 'Workflow paused successfully'
    })

  } catch (error) {
    console.error('Error pausing workflow:', error)
    return NextResponse.json(
      { error: 'Failed to pause workflow' },
      { status: 500 }
    )
  }
}

// Test workflow with sample data
async function testWorkflow(workflow: any, testData: any) {
  try {
    const { testUserId, sampleData = {} } = testData

    if (!testUserId) {
      return NextResponse.json(
        { error: 'Test user ID is required' },
        { status: 400 }
      )
    }

    // Get test user
    const testUser = await client.fetch(`
      *[_type == "user" && _id == $testUserId][0]
    `, { testUserId })

    if (!testUser) {
      return NextResponse.json(
        { error: 'Test user not found' },
        { status: 404 }
      )
    }

    // Find first email step
    const emailStep = workflow.steps.find((step: any) => step.type === 'send_email')
    if (!emailStep) {
      return NextResponse.json(
        { error: 'No email step found in workflow' },
        { status: 400 }
      )
    }

    // Send test email
    const result = await enhancedEmailService.sendWorkflowEmail({
      workflowId: workflow.workflowId,
      stepId: emailStep.stepId,
      userId: testUser._id,
      triggerData: {
        ...sampleData,
        isTest: true,
        testSentAt: new Date().toISOString()
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'error' in result ? result.error : 'Failed to send test email' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testUser.email}`,
      result
    })

  } catch (error) {
    console.error('Error testing workflow:', error)
    return NextResponse.json(
      { error: 'Failed to test workflow' },
      { status: 500 }
    )
  }
}

// Manually trigger workflow for specific user
async function triggerWorkflow(workflow: any, triggerData: any) {
  try {
    const { userId, triggerEventData = {} } = triggerData

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: 'Workflow must be active to trigger' },
        { status: 400 }
      )
    }

    // Check if user already in this workflow
    const existingExecution = await client.fetch(`
      *[_type == "workflowExecution" &&
        workflow._ref == $workflowId &&
        user._ref == $userId &&
        status in ["active", "paused"]
      ][0]
    `, { workflowId: workflow._id, userId })

    if (existingExecution) {
      return NextResponse.json(
        { error: 'User is already in this workflow' },
        { status: 400 }
      )
    }

    // Start workflow execution
    const execution = await startWorkflowExecution(workflow, userId, triggerEventData)

    return NextResponse.json({
      success: true,
      execution,
      message: 'Workflow triggered successfully'
    })

  } catch (error) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json(
      { error: 'Failed to trigger workflow' },
      { status: 500 }
    )
  }
}

// Duplicate workflow
async function duplicateWorkflow(workflow: any, duplicateData: any) {
  try {
    const { name, description } = duplicateData

    // Create new workflow with copied data
    const newWorkflowId = `workflow_${Date.now()}_${Math.random().toString(36).substring(2)}`

    const duplicatedWorkflow = await client.create({
      _type: 'emailWorkflow',
      workflowId: newWorkflowId,
      name: name || `${workflow.name} (Copy)`,
      description: description || workflow.description,
      type: workflow.type,
      status: 'draft',
      trigger: workflow.trigger,
      steps: workflow.steps,
      segmentation: workflow.segmentation,
      settings: workflow.settings,
      analytics: {
        totalExecutions: 0,
        activeUsers: 0,
        completionRate: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        revenueGenerated: 0
      },
      metadata: {
        createdAt: new Date().toISOString(),
        version: 1,
        duplicatedFrom: workflow._id
      }
    })

    return NextResponse.json({
      success: true,
      workflow: duplicatedWorkflow,
      message: 'Workflow duplicated successfully'
    })

  } catch (error) {
    console.error('Error duplicating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate workflow' },
      { status: 500 }
    )
  }
}

// Export workflow configuration
async function exportWorkflow(workflow: any) {
  try {
    // Create exportable workflow data
    const exportData = {
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      trigger: workflow.trigger,
      steps: workflow.steps,
      segmentation: workflow.segmentation,
      settings: workflow.settings,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: workflow.metadata?.version || 1
      }
    }

    return NextResponse.json({
      success: true,
      exportData,
      filename: `workflow_${workflow.workflowId}_${new Date().toISOString().split('T')[0]}.json`
    })

  } catch (error) {
    console.error('Error exporting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to export workflow' },
      { status: 500 }
    )
  }
}

// Helper function to validate workflow for activation
async function validateWorkflowForActivation(workflow: any) {
  // Check if workflow has at least one email step
  const hasEmailStep = workflow.steps.some((step: any) => step.type === 'send_email')
  if (!hasEmailStep) {
    return { valid: false, error: 'Workflow must have at least one email step' }
  }

  // Validate all email templates exist and are active
  for (const step of workflow.steps) {
    if (step.type === 'send_email') {
      const template = await client.fetch(`
        *[_type == "emailTemplate" && _id == $templateId && status == "active"][0]
      `, { templateId: step.emailTemplate._ref })

      if (!template) {
        return {
          valid: false,
          error: `Email template not found or inactive: ${step.name}`
        }
      }
    }
  }

  // Check trigger configuration
  if (!workflow.trigger || !workflow.trigger.type) {
    return { valid: false, error: 'Workflow must have a valid trigger' }
  }

  return { valid: true }
}

// Helper function to start workflow execution
async function startWorkflowExecution(workflow: any, userId: string, triggerData: any) {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2)}`

  const execution = await client.create({
    _type: 'workflowExecution',
    executionId,
    workflow: { _type: 'reference', _ref: workflow._id },
    user: { _type: 'reference', _ref: userId },
    status: 'active',
    currentStep: workflow.steps[0]?.stepId,
    triggerData,
    startedAt: new Date().toISOString(),
    metadata: {
      workflowVersion: workflow.metadata?.version || 1
    }
  })

  // Process first step
  await processWorkflowStep(execution, workflow.steps[0], triggerData)

  return execution
}

// Helper function to process workflow step
async function processWorkflowStep(execution: any, step: any, data: any) {
  // This would handle step processing logic
  // For now, just handle email steps
  if (step.type === 'send_email') {
    await enhancedEmailService.sendWorkflowEmail({
      workflowId: execution.workflow._ref,
      stepId: step.stepId,
      userId: execution.user._ref,
      triggerData: data
    })
  }
}
