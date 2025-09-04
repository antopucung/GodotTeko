import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

interface SubscriptionEventData {
  eventType: 'subscription_started' | 'subscription_renewed' | 'subscription_expiring' | 'subscription_expired' | 'subscription_cancelled' | 'subscription_upgrade' | 'subscription_downgrade'
  userId: string
  subscriptionId: string
  planId: string
  planName: string
  price: number
  downloads: number
  expiryDate: string
  renewalDate?: string
  previousPlanId?: string
  metadata?: any
}

// POST - Handle subscription events and trigger email workflows
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // For webhook events, we might not have a session
    // In production, verify webhook signatures instead
    const body = await request.json()
    const {
      eventType,
      userId,
      subscriptionId,
      planId,
      planName,
      price,
      downloads,
      expiryDate,
      renewalDate,
      previousPlanId,
      metadata = {}
    }: SubscriptionEventData = body

    // Validate required fields
    if (!eventType || !userId || !subscriptionId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user data for email personalization
    const userData = await sanityClient.fetch(`
      *[_type == "user" && _id == $userId][0] {
        _id,
        name,
        email,
        country,
        preferences,
        role
      }
    `, { userId })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get subscription plan details
    const planData = await sanityClient.fetch(`
      *[_type == "subscriptionPlan" && planId == $planId][0] {
        _id,
        planId,
        name,
        price,
        downloads,
        duration,
        features
      }
    `, { planId })

    // Calculate days remaining until expiry
    const daysRemaining = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    // Prepare email variables for personalization
    const emailVariables = {
      user: {
        name: userData.name || 'there',
        email: userData.email,
        country: userData.country || ''
      },
      subscription: {
        planName: planName,
        price: price,
        downloads: downloads,
        expiryDate: new Date(expiryDate).toLocaleDateString(),
        renewalDate: renewalDate ? new Date(renewalDate).toLocaleDateString() : '',
        daysRemaining: Math.max(0, daysRemaining),
        status: 'active',
        cancelUrl: `${process.env.NEXTAUTH_URL}/user/subscription/cancel?id=${subscriptionId}`,
        manageUrl: `${process.env.NEXTAUTH_URL}/user/subscription/manage?id=${subscriptionId}`,
        planFeatures: planData?.features?.filter((f: any) => f.enabled)?.map((f: any) => f.feature) || []
      },
      previousPlan: previousPlanId ? {
        planId: previousPlanId
      } : null
    }

    // Find and trigger appropriate email workflows
    const workflows = await sanityClient.fetch(`
      *[_type == "emailWorkflow" && status == "active" && trigger.type == $eventType] {
        _id,
        workflowId,
        name,
        trigger,
        steps,
        segmentation,
        settings
      }
    `, { eventType })

    const triggeredWorkflows = []

    for (const workflow of workflows) {
      try {
        // Check if user matches workflow segmentation criteria
        const matchesSegmentation = await checkUserSegmentation(userData, workflow.segmentation)

        if (!matchesSegmentation) {
          continue
        }

        // Check workflow execution limits
        const canExecute = await checkWorkflowExecutionLimits(userId, workflow._id, workflow.settings)

        if (!canExecute) {
          continue
        }

        // Trigger the workflow
        const execution = await triggerEmailWorkflow(workflow, userData, emailVariables)

        if (execution.success) {
          triggeredWorkflows.push({
            workflowId: workflow.workflowId,
            executionId: execution.executionId
          })
        }
      } catch (error) {
        console.error(`Error triggering workflow ${workflow.workflowId}:`, error)
      }
    }

    // Log the subscription event
    await sanityClient.create({
      _type: 'emailActivity',
      eventType: 'subscription_event',
      userId: userData._id,
      subscriptionId,
      planId,
      eventData: {
        eventType,
        planName,
        price,
        metadata
      },
      triggeredWorkflows,
      timestamp: new Date().toISOString(),
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    })

    return NextResponse.json({
      success: true,
      eventType,
      userId,
      triggeredWorkflows,
      message: `Processed ${eventType} event and triggered ${triggeredWorkflows.length} workflows`
    })

  } catch (error) {
    console.error('Error processing subscription event:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription event' },
      { status: 500 }
    )
  }
}

// Helper function to check user segmentation criteria
async function checkUserSegmentation(userData: any, segmentation: any): Promise<boolean> {
  if (!segmentation || segmentation.targetAudience === 'all') {
    return true
  }

  // Check target audience
  if (segmentation.targetAudience === 'new_users') {
    const daysSinceSignup = Math.ceil((new Date().getTime() - new Date(userData._createdAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceSignup > 30) return false
  }

  // Check filters
  if (segmentation.filters && segmentation.filters.length > 0) {
    for (const filter of segmentation.filters) {
      const userValue = getUserFieldValue(userData, filter.field)
      if (!matchesFilter(userValue, filter.operator, filter.value)) {
        return false
      }
    }
  }

  // Check exclude filters
  if (segmentation.excludeFilters && segmentation.excludeFilters.length > 0) {
    for (const filter of segmentation.excludeFilters) {
      const userValue = getUserFieldValue(userData, filter.field)
      if (userValue === filter.value) {
        return false
      }
    }
  }

  return true
}

// Helper function to get user field value by path
function getUserFieldValue(userData: any, fieldPath: string): any {
  const path = fieldPath.split('.')
  let value = userData

  for (const key of path) {
    value = value?.[key]
    if (value === undefined) break
  }

  return value
}

// Helper function to check if value matches filter criteria
function matchesFilter(userValue: any, operator: string, filterValue: string): boolean {
  switch (operator) {
    case 'equals':
      return String(userValue) === filterValue
    case 'greater_than':
      return Number(userValue) > Number(filterValue)
    case 'less_than':
      return Number(userValue) < Number(filterValue)
    case 'in':
      return filterValue.split(',').map(v => v.trim()).includes(String(userValue))
    default:
      return false
  }
}

// Helper function to check workflow execution limits
async function checkWorkflowExecutionLimits(userId: string, workflowId: string, settings: any): Promise<boolean> {
  if (!settings?.maxExecutions || settings.maxExecutions === 0) {
    return true // No limits
  }

  // Check how many times this workflow has been executed for this user
  const executions = await sanityClient.fetch(`
    count(*[_type == "emailActivity" && userId == $userId && references($workflowId) && eventType == "workflow_executed"])
  `, { userId, workflowId })

  if (executions >= settings.maxExecutions) {
    return false
  }

  // Check cooldown period
  if (settings.cooldownPeriod && settings.cooldownPeriod > 0) {
    const lastExecution = await sanityClient.fetch(`
      *[_type == "emailActivity" && userId == $userId && references($workflowId) && eventType == "workflow_executed"] | order(timestamp desc)[0]
    `, { userId, workflowId })

    if (lastExecution) {
      const daysSinceLastExecution = Math.ceil((new Date().getTime() - new Date(lastExecution.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceLastExecution < settings.cooldownPeriod) {
        return false
      }
    }
  }

  return true
}

// Helper function to trigger email workflow
async function triggerEmailWorkflow(workflow: any, userData: any, emailVariables: any): Promise<{ success: boolean; executionId?: string; error?: string }> {
  try {
    // Create workflow execution record
    const execution = await sanityClient.create({
      _type: 'emailActivity',
      eventType: 'workflow_executed',
      userId: userData._id,
      workflowId: workflow._id,
      executionData: {
        workflowName: workflow.name,
        triggerType: workflow.trigger.type,
        startTime: new Date().toISOString(),
        status: 'started',
        currentStep: 0,
        emailVariables
      },
      timestamp: new Date().toISOString()
    })

    // Process workflow steps
    await processWorkflowSteps(workflow, userData, emailVariables, execution._id)

    return {
      success: true,
      executionId: execution._id
    }
  } catch (error) {
    console.error('Error triggering email workflow:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper function to process workflow steps
async function processWorkflowSteps(workflow: any, userData: any, emailVariables: any, executionId: string): Promise<void> {
  // This is a simplified version - in production, you'd want to use a queue system
  // for proper workflow execution with delays, conditions, etc.

  try {
    for (const step of workflow.steps) {
      if (step.type === 'send_email' && step.emailTemplate) {
        await sendWorkflowEmail(step.emailTemplate._ref, userData, emailVariables, executionId)
      }
      // Handle other step types (wait, condition, etc.) as needed
    }

    // Update execution status
    await sanityClient
      .patch(executionId)
      .set({
        'executionData.status': 'completed',
        'executionData.endTime': new Date().toISOString()
      })
      .commit()

  } catch (error) {
    console.error('Error processing workflow steps:', error)

    // Update execution status to failed
    await sanityClient
      .patch(executionId)
      .set({
        'executionData.status': 'failed',
        'executionData.error': error instanceof Error ? error.message : 'Unknown error',
        'executionData.endTime': new Date().toISOString()
      })
      .commit()
  }
}

// Helper function to send workflow email
async function sendWorkflowEmail(templateId: string, userData: any, emailVariables: any, executionId: string): Promise<void> {
  try {
    // Get email template
    const template = await sanityClient.fetch(`
      *[_type == "emailTemplate" && _id == $templateId][0] {
        _id,
        name,
        subject,
        content,
        design,
        settings
      }
    `, { templateId })

    if (!template) {
      throw new Error(`Email template ${templateId} not found`)
    }

    // Replace variables in email content
    const personalizedSubject = replaceEmailVariables(template.subject.template, emailVariables)
    const personalizedContent = replaceEmailVariables(template.content.htmlTemplate, emailVariables)

    // In production, integrate with email service (SendGrid, Mailgun, etc.)
    const emailData = {
      to: userData.email,
      from: template.settings.fromEmail,
      fromName: template.settings.fromName,
      subject: personalizedSubject,
      html: personalizedContent,
      text: template.content.textTemplate ? replaceEmailVariables(template.content.textTemplate, emailVariables) : undefined
    }

    // Log email send attempt
    await sanityClient.create({
      _type: 'emailActivity',
      eventType: 'email_sent',
      userId: userData._id,
      templateId: template._id,
      executionId,
      emailData: {
        subject: personalizedSubject,
        recipient: userData.email,
        templateName: template.name
      },
      timestamp: new Date().toISOString(),
      status: 'sent'
    })

    console.log('Email queued for sending:', {
      to: userData.email,
      subject: personalizedSubject,
      template: template.name
    })

  } catch (error) {
    console.error('Error sending workflow email:', error)
    throw error
  }
}

// Helper function to replace email variables
function replaceEmailVariables(template: string, variables: any): string {
  let result = template

  // Replace user variables
  if (variables.user) {
    Object.keys(variables.user).forEach(key => {
      const regex = new RegExp(`{{user\\.${key}}}`, 'g')
      result = result.replace(regex, String(variables.user[key] || ''))
    })
  }

  // Replace subscription variables
  if (variables.subscription) {
    Object.keys(variables.subscription).forEach(key => {
      const regex = new RegExp(`{{subscription\\.${key}}}`, 'g')
      result = result.replace(regex, String(variables.subscription[key] || ''))
    })
  }

  // Replace list variables (like features)
  if (variables.subscription?.planFeatures) {
    const featuresHtml = variables.subscription.planFeatures
      .map((feature: string) => `<li>${feature}</li>`)
      .join('')
    result = result.replace(/{{subscription\.planFeatures}}/g, `<ul>${featuresHtml}</ul>`)
  }

  return result
}

// GET - Get subscription event logs (for admin monitoring)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const eventType = searchParams.get('eventType')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)

    let query = '*[_type == "emailActivity" && eventType == "subscription_event"]'
    const params: any = {}

    if (userId) {
      query = '*[_type == "emailActivity" && eventType == "subscription_event" && userId == $userId]'
      params.userId = userId
    }

    if (eventType) {
      query += ' && eventData.eventType == $eventType'
      params.eventType = eventType
    }

    query += ` | order(timestamp desc)[0..${limit - 1}]`

    const events = await sanityClient.fetch(`
      ${query} {
        _id,
        userId,
        subscriptionId,
        planId,
        eventData,
        triggeredWorkflows,
        timestamp,
        "userName": *[_type == "user" && _id == ^.userId][0].name
      }
    `, params)

    return NextResponse.json({
      success: true,
      events,
      total: events.length
    })

  } catch (error) {
    console.error('Error fetching subscription events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription events' },
      { status: 500 }
    )
  }
}
