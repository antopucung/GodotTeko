import { Resend } from 'resend'
import { client } from '@/lib/sanity'
import { PLATFORM_CONFIG } from '@/config/platform'

// Enhanced email service for automation and templates
export class EnhancedEmailService {
  private resend: Resend

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY!)
  }

  /**
   * Send email using template with personalization
   */
  async sendTemplatedEmail({
    templateId,
    to,
    personalizations = {},
    campaignId,
    workflowId,
    trackingOptions = {}
  }: {
    templateId: string
    to: string | string[]
    personalizations?: Record<string, any>
    campaignId?: string
    workflowId?: string
    trackingOptions?: {
      trackOpens?: boolean
      trackClicks?: boolean
      utmParameters?: Record<string, string>
    }
  }) {
    try {
      // Get template from Sanity
      const template = await this.getTemplate(templateId)
      if (!template) {
        throw new Error(`Template not found: ${templateId}`)
      }

      // Get user data for personalization
      const recipients = Array.isArray(to) ? to : [to]
      const emailPromises = recipients.map(async (email) => {
        const userData = await this.getUserData(email)
        const combinedData = { ...userData, ...personalizations }

        // Render template with personalized data
        const renderedContent = await this.renderTemplate(template, combinedData)

        // Add tracking pixels and UTM parameters
        const trackedContent = this.addTracking(
          renderedContent,
          email,
          campaignId,
          workflowId,
          trackingOptions
        )

        // Send email
        const result = await this.resend.emails.send({
          from: `${template.settings.fromName} <${template.settings.fromEmail}>`,
          to: email,
          subject: this.renderText(template.subject.template, combinedData),
          html: trackedContent.html,
          text: trackedContent.text,
          replyTo: template.settings.replyTo,
          headers: {
            'List-Unsubscribe': this.generateUnsubscribeHeader(email),
            'X-Campaign-ID': campaignId || '',
            'X-Workflow-ID': workflowId || '',
            'X-Template-ID': templateId
          }
        })

        // Record email activity
        await this.recordEmailActivity({
          type: 'sent',
          email,
          messageId: result.data?.id,
          templateId,
          campaignId,
          workflowId,
          subject: this.renderText(template.subject.template, combinedData)
        })

        return result
      })

      const results = await Promise.all(emailPromises)
      return {
        success: true,
        results,
        sentCount: results.length
      }

    } catch (error) {
      console.error('Error sending templated email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }
    }
  }

  /**
   * Send workflow email (triggered by automation)
   */
  async sendWorkflowEmail({
    workflowId,
    stepId,
    userId,
    triggerData = {},
    delay = 0
  }: {
    workflowId: string
    stepId: string
    userId: string
    triggerData?: Record<string, any>
    delay?: number
  }) {
    try {
      // Get workflow and step details
      const workflow = await this.getWorkflow(workflowId)
      if (!workflow || workflow.status !== 'active') {
        throw new Error(`Workflow not found or inactive: ${workflowId}`)
      }

      const step = workflow.steps.find((s: any) => s.stepId === stepId)
      if (!step || step.type !== 'send_email') {
        throw new Error(`Email step not found: ${stepId}`)
      }

      // Get user data
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      // Check if user should receive this email (suppression, frequency caps, etc.)
      const canSend = await this.checkSendPermissions(user.email, workflowId)
      if (!canSend.allowed) {
        console.log(`Email blocked: ${canSend.reason}`)
        return { success: false, reason: canSend.reason }
      }

      // Schedule or send immediately
      if (delay > 0) {
        await this.scheduleEmail({
          workflowId,
          stepId,
          userId,
          templateId: step.emailTemplate._ref,
          sendAt: new Date(Date.now() + delay * 1000),
          personalizations: { ...triggerData, user }
        })
        return { success: true, scheduled: true }
      }

      // Send immediately
      return await this.sendTemplatedEmail({
        templateId: step.emailTemplate._ref,
        to: user.email,
        personalizations: { ...triggerData, user },
        workflowId,
        trackingOptions: {
          trackOpens: true,
          trackClicks: true,
          utmParameters: {
            source: 'email',
            medium: 'automation',
            campaign: workflow.name,
            content: step.name
          }
        }
      })

    } catch (error) {
      console.error('Error sending workflow email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send workflow email'
      }
    }
  }

  /**
   * Send abandoned cart recovery email
   */
  async sendAbandonedCartEmail({
    userId,
    cartData,
    sequenceStep = 1
  }: {
    userId: string
    cartData: any
    sequenceStep?: number
  }) {
    try {
      // Get abandoned cart workflow
      const workflow = await client.fetch(
        `*[_type == "emailWorkflow" && type == "abandoned_cart" && status == "active"][0]`
      )

      if (!workflow) {
        console.log('No active abandoned cart workflow found')
        return { success: false, reason: 'No workflow configured' }
      }

      // Find the appropriate step based on sequence
      const emailSteps = workflow.steps.filter((step: any) => step.type === 'send_email')
      const step = emailSteps[sequenceStep - 1]

      if (!step) {
        console.log(`No email step found for sequence ${sequenceStep}`)
        return { success: false, reason: 'No step configured' }
      }

      // Calculate delay based on sequence
      const delays = [30, 1440, 4320] // 30 minutes, 24 hours, 72 hours
      const delay = delays[sequenceStep - 1] * 60 // Convert to seconds

      // Prepare cart data for personalization
      const cartTotal = cartData.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0
      const personalizations = {
        cart: {
          items: cartData.items || [],
          total: cartTotal,
          itemCount: cartData.items?.length || 0,
          abandonedAt: cartData.abandonedAt,
          sequenceStep
        },
        // Add discount code for later steps
        ...(sequenceStep > 1 && {
          discount: {
            code: 'COMEBACK10',
            percentage: 10,
            expiresIn: '48 hours'
          }
        })
      }

      return await this.sendWorkflowEmail({
        workflowId: workflow.workflowId,
        stepId: step.stepId,
        userId,
        triggerData: personalizations,
        delay
      })

    } catch (error) {
      console.error('Error sending abandoned cart email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send cart recovery email'
      }
    }
  }

  /**
   * Send newsletter with personalized content
   */
  async sendPersonalizedNewsletter({
    newsletterTemplateId,
    userSegments = [],
    contentSections = []
  }: {
    newsletterTemplateId: string
    userSegments?: string[]
    contentSections?: Array<{
      type: string
      content: any
      conditions?: Record<string, any>
    }>
  }) {
    try {
      // Get newsletter template
      const template = await this.getTemplate(newsletterTemplateId)
      if (!template) {
        throw new Error('Newsletter template not found')
      }

      // Get subscribers based on segments
      const subscribers = await this.getNewsletterSubscribers(userSegments)

      // Create campaign
      const campaignId = `newsletter_${Date.now()}_${Math.random().toString(36).substring(2)}`
      await this.createCampaign({
        campaignId,
        name: `Newsletter - ${new Date().toLocaleDateString()}`,
        type: 'newsletter',
        templateId: newsletterTemplateId,
        audienceSize: subscribers.length
      })

      // Send personalized newsletters in batches
      const batchSize = 100
      const results = []

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize)

        const batchPromises = batch.map(async (subscriber: any) => {
          // Generate personalized content sections
          const personalizedSections = await this.generatePersonalizedContent(
            contentSections,
            subscriber
          )

          return await this.sendTemplatedEmail({
            templateId: newsletterTemplateId,
            to: subscriber.email,
            personalizations: {
              user: subscriber,
              newsletter: {
                date: new Date().toLocaleDateString(),
                sections: personalizedSections
              }
            },
            campaignId,
            trackingOptions: {
              trackOpens: true,
              trackClicks: true,
              utmParameters: {
                source: 'newsletter',
                medium: 'email',
                campaign: 'newsletter'
              }
            }
          })
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      return {
        success: true,
        campaignId,
        sentCount: results.filter(r => r.success).length,
        totalSubscribers: subscribers.length
      }

    } catch (error) {
      console.error('Error sending newsletter:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send newsletter'
      }
    }
  }

  /**
   * Get template from Sanity
   */
  private async getTemplate(templateId: string) {
    return await client.fetch(
      `*[_type == "emailTemplate" && templateId == $templateId && status == "active"][0]`,
      { templateId }
    )
  }

  /**
   * Get workflow from Sanity
   */
  private async getWorkflow(workflowId: string) {
    return await client.fetch(
      `*[_type == "emailWorkflow" && workflowId == $workflowId][0]`,
      { workflowId }
    )
  }

  /**
   * Get user data for personalization
   */
  private async getUserData(email: string) {
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0] {
        _id,
        name,
        email,
        role,
        country,
        "preferences": *[_type == "newsletterPreferences" && user._ref == ^._id][0]
      }`,
      { email }
    )

    return user || { email, name: 'there' }
  }

  /**
   * Get user by ID
   */
  private async getUser(userId: string) {
    return await client.fetch(
      `*[_type == "user" && _id == $userId][0]`,
      { userId }
    )
  }

  /**
   * Render template with personalized data
   */
  private async renderTemplate(template: any, data: Record<string, any>) {
    const html = this.renderText(template.content.htmlTemplate, data)
    const text = template.content.textTemplate
      ? this.renderText(template.content.textTemplate, data)
      : this.stripHtml(html)

    return { html, text }
  }

  /**
   * Render text with variable substitution
   */
  private renderText(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key.trim())
      return value !== undefined ? String(value) : match
    })
  }

  /**
   * Get nested object value by dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim()
  }

  /**
   * Add tracking pixels and UTM parameters
   */
  private addTracking(
    content: { html: string; text: string },
    email: string,
    campaignId?: string,
    workflowId?: string,
    options?: any
  ) {
    let html = content.html
    let text = content.text

    if (options?.trackOpens) {
      // Add tracking pixel
      const trackingId = this.generateTrackingId(email, campaignId, workflowId)
      const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/open/${trackingId}`
      html += `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`
    }

    if (options?.trackClicks) {
      // Wrap links with tracking
      html = html.replace(
        /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/g,
        (match, attributes, url) => {
          const trackingUrl = this.generateTrackingUrl(url, email, campaignId, workflowId)
          return match.replace(url, trackingUrl)
        }
      )
    }

    return { html, text }
  }

  /**
   * Generate tracking ID for email opens
   */
  private generateTrackingId(email: string, campaignId?: string, workflowId?: string): string {
    const data = `${email}:${campaignId || ''}:${workflowId || ''}:${Date.now()}`
    return Buffer.from(data).toString('base64url')
  }

  /**
   * Generate tracking URL for link clicks
   */
  private generateTrackingUrl(originalUrl: string, email: string, campaignId?: string, workflowId?: string): string {
    const trackingId = this.generateTrackingId(email, campaignId, workflowId)
    const encodedUrl = encodeURIComponent(originalUrl)
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/click/${trackingId}?url=${encodedUrl}`
  }

  /**
   * Generate unsubscribe header
   */
  private generateUnsubscribeHeader(email: string): string {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}`
    return `<${unsubscribeUrl}>`
  }

  /**
   * Record email activity in Sanity
   */
  private async recordEmailActivity(activity: {
    type: string
    email: string
    messageId?: string
    templateId?: string
    campaignId?: string
    workflowId?: string
    subject?: string
  }) {
    try {
      const user = await this.getUserData(activity.email)

      await client.create({
        _type: 'emailActivity',
        activityId: `${activity.type}_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        type: activity.type,
        user: user._id ? { _type: 'reference', _ref: user._id } : undefined,
        email: {
          messageId: activity.messageId,
          subject: activity.subject,
          toEmail: activity.email
        },
        campaign: activity.campaignId ? { _type: 'reference', _ref: activity.campaignId } : undefined,
        workflow: activity.workflowId ? { _type: 'reference', _ref: activity.workflowId } : undefined,
        template: activity.templateId ? { _type: 'reference', _ref: activity.templateId } : undefined,
        timestamps: {
          activityAt: new Date().toISOString(),
          recordedAt: new Date().toISOString()
        },
        metadata: {
          source: 'api',
          processingStatus: 'processed'
        }
      })
    } catch (error) {
      console.error('Error recording email activity:', error)
    }
  }

  /**
   * Check if user can receive email (suppression, frequency limits, etc.)
   */
  private async checkSendPermissions(email: string, workflowId?: string) {
    try {
      const preferences = await client.fetch(
        `*[_type == "newsletterPreferences" && user->email == $email][0]`,
        { email }
      )

      if (!preferences) {
        return { allowed: true }
      }

      if (preferences.globalStatus !== 'subscribed') {
        return {
          allowed: false,
          reason: `User status: ${preferences.globalStatus}`
        }
      }

      // Check frequency limits
      const today = new Date().toISOString().split('T')[0]
      const emailsToday = await client.fetch(
        `count(*[_type == "emailActivity" &&
          type == "sent" &&
          email.toEmail == $email &&
          timestamps.activityAt >= $today
        ])`,
        { email, today: `${today}T00:00:00Z` }
      )

      const maxPerDay = preferences.deliverySettings?.frequency?.maxEmailsPerDay || 3
      if (emailsToday >= maxPerDay) {
        return {
          allowed: false,
          reason: 'Daily email limit reached'
        }
      }

      return { allowed: true }

    } catch (error) {
      console.error('Error checking send permissions:', error)
      return { allowed: true } // Default to allow if check fails
    }
  }

  /**
   * Schedule email for later delivery
   */
  private async scheduleEmail(emailData: any) {
    // This would integrate with a job queue system like Bull/Agenda
    // For now, we'll store in Sanity and process via cron job
    await client.create({
      _type: 'emailQueue',
      ...emailData,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    })
  }

  /**
   * Create campaign record
   */
  private async createCampaign(campaignData: any) {
    await client.create({
      _type: 'emailCampaign',
      ...campaignData,
      status: 'sending',
      timestamps: {
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Get newsletter subscribers
   */
  private async getNewsletterSubscribers(segments: string[] = []) {
    let filter = `globalStatus == "subscribed" && subscriptions.newsletter.subscribed == true`

    if (segments.length > 0) {
      // Add segment filtering logic here
    }

    return await client.fetch(
      `*[_type == "newsletterPreferences" && ${filter}] {
        "email": user->email,
        "name": user->name,
        "preferences": @,
        "userId": user._id
      }`
    )
  }

  /**
   * Generate personalized content sections
   */
  private async generatePersonalizedContent(sections: any[], subscriber: any) {
    return sections.map(section => {
      // Apply personalization logic based on user data
      // This would include product recommendations, content curation, etc.
      return {
        ...section,
        personalized: true,
        userId: subscriber.userId
      }
    })
  }
}

// Export singleton instance
export const enhancedEmailService = new EnhancedEmailService()
