import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

// POST - Seed default subscription email templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if templates already exist
    const existingTemplates = await sanityClient.fetch('*[_type == "emailTemplate" && category match "subscription_*"]')

    if (existingTemplates.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Subscription email templates already exist',
        existing: existingTemplates.length
      })
    }

    // Simple HTML template for subscription confirmation
    const subscriptionConfirmationHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to All-Access! 🎉</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2>Hi {{user.name}}!</h2>
          <p>Welcome to the All-Access family! Your {{subscription.planName}} subscription is now active.</p>
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Plan Details</h3>
            <p><strong>Plan:</strong> {{subscription.planName}}</p>
            <p><strong>Daily Downloads:</strong> {{subscription.downloads}} per day</p>
            <p><strong>Access Until:</strong> {{subscription.expiryDate}}</p>
            <p><strong>Price:</strong> $\{{subscription.price}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/browse" style="display: inline-block; background: #667eea; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px;">Start Downloading Now</a>
          </div>
          <p>Need help? <a href="${process.env.NEXTAUTH_URL}/support">Contact support</a></p>
        </div>
      </div>
    `

    // Simple HTML template for subscription renewal
    const subscriptionRenewalHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Subscription Renewed! ✨</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2>Hi {{user.name}},</h2>
          <p>Your {{subscription.planName}} subscription has been successfully renewed.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Renewal Details</h3>
            <p><strong>Plan:</strong> {{subscription.planName}}</p>
            <p><strong>Amount:</strong> $\{{subscription.price}}</p>
            <p><strong>New Expiry:</strong> {{subscription.expiryDate}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/browse" style="display: inline-block; background: #10b981; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px;">Continue Downloading</a>
          </div>
        </div>
      </div>
    `

    // Simple HTML template for subscription expiring
    const subscriptionExpiringHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Subscription Expiring Soon ⏰</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2>Hi {{user.name}},</h2>
          <p>Your {{subscription.planName}} subscription expires in {{subscription.daysRemaining}} days.</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Don't lose access!</h3>
            <p>Your subscription expires on <strong>{{subscription.expiryDate}}</strong></p>
            <p>Renew now to continue enjoying premium design resources.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{subscription.renewUrl}}" style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px;">Renew Now</a>
          </div>
        </div>
      </div>
    `

    // Simple HTML template for subscription cancelled
    const subscriptionCancelledHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Subscription Cancelled</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2>Hi {{user.name}},</h2>
          <p>We've processed your cancellation for {{subscription.planName}}.</p>
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>You still have access until {{subscription.expiryDate}}</h3>
            <p>Continue downloading up to {{subscription.downloads}} items per day until then.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/all-access" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px;">Reactivate Subscription</a>
          </div>
        </div>
      </div>
    `

    // Default subscription email templates
    const templates = [
      {
        _type: 'emailTemplate',
        templateId: 'subscription_confirmation',
        name: 'Subscription Confirmation',
        description: 'Welcome email sent when user first subscribes to All-Access',
        category: 'subscription_confirmation',
        status: 'active',
        subject: {
          template: 'Welcome to {{subscription.planName}} - Your All-Access Pass is Ready! 🎉',
          preheader: 'Start downloading premium design resources today'
        },
        content: {
          htmlTemplate: subscriptionConfirmationHTML,
          textTemplate: `
Welcome to All-Access!

Hi {{user.name}},

Your {{subscription.planName}} subscription is now active.

Plan Details:
- Plan: {{subscription.planName}}
- Daily Downloads: {{subscription.downloads}} per day
- Access Until: {{subscription.expiryDate}}
- Price: $\{{subscription.price}}

Start downloading: ${process.env.NEXTAUTH_URL}/browse

Thanks for choosing UI8!
`
        },
        design: {
          theme: 'modern',
          colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            background: '#ffffff',
            text: '#1f2937'
          }
        },
        settings: {
          fromName: 'UI8 All-Access',
          fromEmail: 'noreply@ui8marketplace.com',
          replyTo: 'support@ui8marketplace.com'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'welcome', 'confirmation']
        }
      },
      {
        _type: 'emailTemplate',
        templateId: 'subscription_renewal',
        name: 'Subscription Renewal Confirmation',
        description: 'Email sent when subscription is successfully renewed',
        category: 'subscription_renewal',
        status: 'active',
        subject: {
          template: 'Your {{subscription.planName}} subscription has been renewed ✨',
          preheader: 'Continue enjoying unlimited access to premium design resources'
        },
        content: {
          htmlTemplate: subscriptionRenewalHTML,
          textTemplate: `
Subscription Renewed!

Hi {{user.name}},

Your {{subscription.planName}} subscription has been renewed.

Renewal Details:
- Plan: {{subscription.planName}}
- Amount: $\{{subscription.price}}
- New Expiry: {{subscription.expiryDate}}

Continue downloading: ${process.env.NEXTAUTH_URL}/browse

Thanks!
`
        },
        design: {
          theme: 'modern',
          colors: {
            primary: '#10b981',
            secondary: '#047857',
            background: '#ffffff',
            text: '#1f2937'
          }
        },
        settings: {
          fromName: 'UI8 All-Access',
          fromEmail: 'noreply@ui8marketplace.com',
          replyTo: 'support@ui8marketplace.com'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'renewal', 'confirmation']
        }
      },
      {
        _type: 'emailTemplate',
        templateId: 'subscription_expiring',
        name: 'Subscription Expiring Warning',
        description: 'Warning email sent when subscription is about to expire',
        category: 'subscription_expiring',
        status: 'active',
        subject: {
          template: 'Your {{subscription.planName}} expires in {{subscription.daysRemaining}} days ⏰',
          preheader: 'Renew now to continue accessing premium design resources'
        },
        content: {
          htmlTemplate: subscriptionExpiringHTML,
          textTemplate: `
Subscription Expiring Soon

Hi {{user.name}},

Your {{subscription.planName}} expires in {{subscription.daysRemaining}} days on {{subscription.expiryDate}}.

Renew now: {{subscription.renewUrl}}

Don't lose access to premium design resources!
`
        },
        design: {
          theme: 'modern',
          colors: {
            primary: '#f59e0b',
            secondary: '#d97706',
            background: '#ffffff',
            text: '#1f2937'
          }
        },
        settings: {
          fromName: 'UI8 All-Access',
          fromEmail: 'noreply@ui8marketplace.com',
          replyTo: 'support@ui8marketplace.com'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'expiring', 'warning']
        }
      },
      {
        _type: 'emailTemplate',
        templateId: 'subscription_cancelled',
        name: 'Subscription Cancellation Confirmation',
        description: 'Email sent when user cancels their subscription',
        category: 'subscription_cancelled',
        status: 'active',
        subject: {
          template: 'Your {{subscription.planName}} subscription has been cancelled',
          preheader: 'We are sorry to see you go - here is what happens next'
        },
        content: {
          htmlTemplate: subscriptionCancelledHTML,
          textTemplate: `
Subscription Cancelled

Hi {{user.name}},

Your {{subscription.planName}} subscription has been cancelled.

You still have access until {{subscription.expiryDate}}.

Reactivate: ${process.env.NEXTAUTH_URL}/all-access

Thank you!
`
        },
        design: {
          theme: 'modern',
          colors: {
            primary: '#6b7280',
            secondary: '#4b5563',
            background: '#ffffff',
            text: '#1f2937'
          }
        },
        settings: {
          fromName: 'UI8 All-Access',
          fromEmail: 'noreply@ui8marketplace.com',
          replyTo: 'support@ui8marketplace.com'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: session.user.id,
          version: 1,
          tags: ['subscription', 'cancellation', 'confirmation']
        }
      }
    ]

    // Create the templates in Sanity
    const createdTemplates = []
    for (const template of templates) {
      try {
        const created = await sanityClient.create(template)
        createdTemplates.push(created)
      } catch (error) {
        console.error(`Error creating template ${template.templateId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Default subscription email templates created successfully',
      created: createdTemplates.length,
      templates: createdTemplates.map(template => ({
        id: template._id,
        templateId: template.templateId,
        name: template.name,
        category: template.category
      }))
    })

  } catch (error) {
    console.error('Error seeding subscription email templates:', error)
    return NextResponse.json(
      { error: 'Failed to seed subscription email templates' },
      { status: 500 }
    )
  }
}
