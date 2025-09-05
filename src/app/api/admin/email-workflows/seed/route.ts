import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

// POST - Seed default subscription email workflows
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if workflows already exist
    const existingWorkflows = await sanityClient.fetch('*[_type == "emailWorkflow" && type == "subscription"]')

    if (existingWorkflows.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Subscription email workflows already exist',
        existing: existingWorkflows.length
      })
    }

    // Get the email templates we need to reference
    const templates = await sanityClient.fetch(`
      *[_type == "emailTemplate" && category match "subscription_*"] {
        _id,
        templateId,
        category
      }
    `)

    const templateMap = templates.reduce((acc: any, template: any) => {
      acc[template.category] = template._id
      return acc
    }, {})

    // Default subscription email workflows
    const workflows = [
      {
        _type: 'emailWorkflow',
        workflowId: 'subscription_welcome_series',
        name: 'Subscription Welcome Series',
        description: 'Welcome workflow triggered when user subscribes to All-Access',
        type: 'subscription',
        status: 'active',
        trigger: {
          type: 'subscription_started',
          conditions: [],
          delay: {
            amount: 0,
            unit: 'minutes'
          }
        },
        steps: [
          {
            stepId: 'welcome_email',
            name: 'Send Welcome Email',
            type: 'send_email',
            position: { x: 100, y: 100 },
            emailTemplate: {
              _type: 'reference',
              _ref: templateMap['subscription_confirmation']
            },
            nextSteps: [
              {
                stepId: 'end_workflow',
                condition: 'always'
              }
            ]
          },
          {
            stepId: 'end_workflow',
            name: 'End Workflow',
            type: 'end',
            position: { x: 100, y: 200 }
          }
        ],
        segmentation: {
          targetAudience: 'all',
          filters: [],
          excludeFilters: []
        },
        settings: {
          maxExecutions: 1,
          cooldownPeriod: 0,
          timeZone: 'UTC',
          sendingWindow: {
            startHour: 9,
            endHour: 17,
            allowWeekends: true
          }
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
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'welcome', 'onboarding']
        }
      },
      {
        _type: 'emailWorkflow',
        workflowId: 'subscription_renewal_confirmation',
        name: 'Subscription Renewal Confirmation',
        description: 'Confirmation workflow triggered when subscription is renewed',
        type: 'subscription',
        status: 'active',
        trigger: {
          type: 'subscription_renewed',
          conditions: [],
          delay: {
            amount: 0,
            unit: 'minutes'
          }
        },
        steps: [
          {
            stepId: 'renewal_email',
            name: 'Send Renewal Confirmation',
            type: 'send_email',
            position: { x: 100, y: 100 },
            emailTemplate: {
              _type: 'reference',
              _ref: templateMap['subscription_renewal']
            },
            nextSteps: [
              {
                stepId: 'end_workflow',
                condition: 'always'
              }
            ]
          },
          {
            stepId: 'end_workflow',
            name: 'End Workflow',
            type: 'end',
            position: { x: 100, y: 200 }
          }
        ],
        segmentation: {
          targetAudience: 'existing_customers',
          filters: [],
          excludeFilters: []
        },
        settings: {
          maxExecutions: 0, // No limit for renewals
          cooldownPeriod: 0,
          timeZone: 'UTC',
          sendingWindow: {
            startHour: 9,
            endHour: 17,
            allowWeekends: true
          }
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
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'renewal', 'confirmation']
        }
      },
      {
        _type: 'emailWorkflow',
        workflowId: 'subscription_expiry_warnings',
        name: 'Subscription Expiry Warning Series',
        description: 'Warning emails sent as subscription approaches expiry',
        type: 'subscription',
        status: 'active',
        trigger: {
          type: 'subscription_expiring',
          conditions: [
            {
              field: 'subscription.daysUntilExpiry',
              operator: 'in',
              value: '7,3,1'
            }
          ],
          delay: {
            amount: 0,
            unit: 'minutes'
          }
        },
        steps: [
          {
            stepId: 'expiry_warning',
            name: 'Send Expiry Warning',
            type: 'send_email',
            position: { x: 100, y: 100 },
            emailTemplate: {
              _type: 'reference',
              _ref: templateMap['subscription_expiring']
            },
            nextSteps: [
              {
                stepId: 'end_workflow',
                condition: 'always'
              }
            ]
          },
          {
            stepId: 'end_workflow',
            name: 'End Workflow',
            type: 'end',
            position: { x: 100, y: 200 }
          }
        ],
        segmentation: {
          targetAudience: 'existing_customers',
          filters: [
            {
              field: 'subscription.status',
              operator: 'equals',
              value: 'active'
            }
          ],
          excludeFilters: []
        },
        settings: {
          maxExecutions: 3, // Max 3 warnings (7, 3, 1 days)
          cooldownPeriod: 1,
          timeZone: 'UTC',
          sendingWindow: {
            startHour: 9,
            endHour: 17,
            allowWeekends: false
          }
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
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'expiring', 'warning', 'retention']
        }
      },
      {
        _type: 'emailWorkflow',
        workflowId: 'subscription_cancellation_confirmation',
        name: 'Subscription Cancellation Confirmation',
        description: 'Confirmation workflow triggered when subscription is cancelled',
        type: 'subscription',
        status: 'active',
        trigger: {
          type: 'subscription_cancelled',
          conditions: [],
          delay: {
            amount: 0,
            unit: 'minutes'
          }
        },
        steps: [
          {
            stepId: 'cancellation_email',
            name: 'Send Cancellation Confirmation',
            type: 'send_email',
            position: { x: 100, y: 100 },
            emailTemplate: {
              _type: 'reference',
              _ref: templateMap['subscription_cancelled']
            },
            nextSteps: [
              {
                stepId: 'wait_7_days',
                condition: 'always'
              }
            ]
          },
          {
            stepId: 'wait_7_days',
            name: 'Wait 7 Days',
            type: 'wait',
            position: { x: 100, y: 200 },
            delay: {
              amount: 7,
              unit: 'days'
            },
            nextSteps: [
              {
                stepId: 'feedback_request',
                condition: 'always'
              }
            ]
          },
          {
            stepId: 'feedback_request',
            name: 'Request Feedback',
            type: 'send_email',
            position: { x: 100, y: 300 },
            // Note: You would create a feedback request template
            nextSteps: [
              {
                stepId: 'end_workflow',
                condition: 'always'
              }
            ]
          },
          {
            stepId: 'end_workflow',
            name: 'End Workflow',
            type: 'end',
            position: { x: 100, y: 400 }
          }
        ],
        segmentation: {
          targetAudience: 'existing_customers',
          filters: [],
          excludeFilters: []
        },
        settings: {
          maxExecutions: 1,
          cooldownPeriod: 30, // 30 days before another cancellation workflow
          timeZone: 'UTC',
          sendingWindow: {
            startHour: 9,
            endHour: 17,
            allowWeekends: true
          }
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
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'cancellation', 'feedback']
        }
      },
      {
        _type: 'emailWorkflow',
        workflowId: 'subscription_upgrade_celebration',
        name: 'Subscription Upgrade Celebration',
        description: 'Celebration workflow triggered when user upgrades subscription',
        type: 'subscription',
        status: 'active',
        trigger: {
          type: 'subscription_upgrade',
          conditions: [],
          delay: {
            amount: 5,
            unit: 'minutes'
          }
        },
        steps: [
          {
            stepId: 'upgrade_celebration',
            name: 'Send Upgrade Celebration',
            type: 'send_email',
            position: { x: 100, y: 100 },
            // Note: You would create an upgrade celebration template
            nextSteps: [
              {
                stepId: 'end_workflow',
                condition: 'always'
              }
            ]
          },
          {
            stepId: 'end_workflow',
            name: 'End Workflow',
            type: 'end',
            position: { x: 100, y: 200 }
          }
        ],
        segmentation: {
          targetAudience: 'existing_customers',
          filters: [],
          excludeFilters: []
        },
        settings: {
          maxExecutions: 0, // No limit for upgrades
          cooldownPeriod: 0,
          timeZone: 'UTC',
          sendingWindow: {
            startHour: 9,
            endHour: 17,
            allowWeekends: true
          }
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
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'upgrade', 'celebration']
        }
      }
    ]

    // Filter out workflows that reference missing templates
    const validWorkflows = workflows.filter(workflow => {
      const hasValidTemplate = workflow.steps.some(step =>
        step.type === 'send_email' && step.emailTemplate?._ref
      )
      return hasValidTemplate || workflow.steps.every(step => step.type !== 'send_email')
    })

    // Create the workflows in Sanity
    const createdWorkflows = []
    for (const workflow of validWorkflows) {
      try {
        const created = await sanityClient.create(workflow as any)
        createdWorkflows.push(created)
      } catch (error) {
        console.error(`Error creating workflow ${workflow.workflowId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Default subscription email workflows created successfully',
      created: createdWorkflows.length,
      skipped: workflows.length - validWorkflows.length,
      workflows: createdWorkflows.map(workflow => ({
        id: workflow._id,
        workflowId: workflow.workflowId,
        name: workflow.name,
        trigger: workflow.trigger.type
      }))
    })

  } catch (error) {
    console.error('Error seeding subscription email workflows:', error)
    return NextResponse.json(
      { error: 'Failed to seed subscription email workflows' },
      { status: 500 }
    )
  }
}
