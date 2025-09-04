import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { enhancedEmailService } from '@/lib/email/enhancedEmailService'

// GET - List email workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter conditions
    let filter = '_type == "emailWorkflow"'

    if (status) {
      filter += ` && status == "${status}"`
    }

    if (type) {
      filter += ` && type == "${type}"`
    }

    // Get workflows with analytics
    const workflows = await client.fetch(`
      *[${filter}] | order(metadata.createdAt desc) [${offset}...${offset + limit}] {
        _id,
        workflowId,
        name,
        description,
        type,
        status,
        trigger,
        steps,
        analytics,
        metadata,
        "templateCount": count(steps[type == "send_email"]),
        "activeUsers": analytics.activeUsers,
        "completionRate": analytics.completionRate
      }
    `)

    const total = await client.fetch(`count(*[${filter}])`)

    return NextResponse.json({
      workflows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

// POST - Create new email workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      type,
      trigger,
      steps,
      segmentation,
      settings
    } = body

    if (!name || !type || !trigger || !steps) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate workflow structure
    const validationResult = validateWorkflowStructure(steps)
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    // Generate workflow ID
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substring(2)}`

    // Create workflow in Sanity
    const workflow = await client.create({
      _type: 'emailWorkflow',
      workflowId,
      name,
      description,
      type,
      status: 'draft',
      trigger,
      steps,
      segmentation,
      settings: {
        maxExecutions: 1,
        cooldownPeriod: 0,
        timeZone: 'UTC',
        sendingWindow: {
          startHour: 9,
          endHour: 17,
          allowWeekends: false
        },
        ...settings
      },
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
        version: 1
      }
    })

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}

// Helper function to validate workflow structure
function validateWorkflowStructure(steps: any[]): { valid: boolean; error?: string } {
  if (!Array.isArray(steps) || steps.length === 0) {
    return { valid: false, error: 'Workflow must have at least one step' }
  }

  // Check for required fields in each step
  for (const step of steps) {
    if (!step.stepId || !step.name || !step.type) {
      return { valid: false, error: 'Each step must have stepId, name, and type' }
    }

    // Validate email steps have templates
    if (step.type === 'send_email' && !step.emailTemplate) {
      return { valid: false, error: 'Email steps must have an associated template' }
    }

    // Validate delay steps have delay configuration
    if (step.type === 'wait' && (!step.delay || !step.delay.amount || !step.delay.unit)) {
      return { valid: false, error: 'Wait steps must have delay configuration' }
    }

    // Validate condition steps have conditions
    if (step.type === 'condition' && (!step.conditions || step.conditions.length === 0)) {
      return { valid: false, error: 'Condition steps must have at least one condition' }
    }
  }

  // Check for proper step connections
  const stepIds = steps.map(s => s.stepId)
  for (const step of steps) {
    if (step.nextSteps) {
      for (const nextStep of step.nextSteps) {
        if (!stepIds.includes(nextStep.stepId)) {
          return { valid: false, error: `Invalid next step reference: ${nextStep.stepId}` }
        }
      }
    }
  }

  return { valid: true }
}
