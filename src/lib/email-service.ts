// Email service using Resend for production-ready email delivery
// Install with: bun add resend

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface OrderEmailData {
  customerName: string
  customerEmail: string
  orderNumber: string
  total: number
  items: Array<{
    title: string
    price: number
    downloadUrl?: string
  }>
  downloadInstructions: string
}

interface PartnerNotificationData {
  partnerName: string
  partnerEmail: string
  productTitle: string
  customerName: string
  amount: number
  orderNumber: string
}

interface LicenseExpirationData {
  customerName: string
  customerEmail: string
  productTitle: string
  licenseKey: string
  expiresAt: string
  renewUrl: string
}

export class EmailService {
  private static resend: any = null

  // Initialize Resend (only if API key is available)
  private static async getResend() {
    if (!this.resend && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        this.resend = new Resend(process.env.RESEND_API_KEY)
      } catch (error) {
        console.log('Resend not available, using mock email service')
      }
    }
    return this.resend
  }

  // Mock email sending for development
  private static async mockSend(to: string, subject: string, html: string) {
    console.log('📧 Mock Email Sent:')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('HTML Preview:', html.substring(0, 200) + '...')

    // Simulate email delivery delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      mock: true
    }
  }

  // Send email with fallback to mock
  private static async sendEmail(to: string, subject: string, html: string, text?: string) {
    try {
      const resend = await this.getResend()

      if (resend && process.env.NODE_ENV === 'production') {
        const result = await resend.emails.send({
          from: process.env.FROM_EMAIL || 'noreply@ui8clone.com',
          to,
          subject,
          html,
          text
        })

        return { success: true, messageId: result.id }
      } else {
        // Development mode or no Resend API key
        return await this.mockSend(to, subject, html)
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Order confirmation email
  static async sendOrderConfirmation(data: OrderEmailData) {
    const template = this.generateOrderConfirmationTemplate(data)

    return await this.sendEmail(
      data.customerEmail,
      template.subject,
      template.html,
      template.text
    )
  }

  // Partner sale notification
  static async sendPartnerSaleNotification(data: PartnerNotificationData) {
    const template = this.generatePartnerNotificationTemplate(data)

    return await this.sendEmail(
      data.partnerEmail,
      template.subject,
      template.html,
      template.text
    )
  }

  // License expiration warning
  static async sendLicenseExpirationWarning(data: LicenseExpirationData) {
    const template = this.generateLicenseExpirationTemplate(data)

    return await this.sendEmail(
      data.customerEmail,
      template.subject,
      template.html,
      template.text
    )
  }

  // Template generators
  private static generateOrderConfirmationTemplate(data: OrderEmailData): EmailTemplate {
    const subject = `Order Confirmation - ${data.orderNumber}`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 30px; }
            .order-details { background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .item:last-child { border-bottom: none; }
            .total { font-weight: bold; font-size: 18px; color: #059669; }
            .download-button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            @media (max-width: 600px) {
                .container { margin: 0; }
                .header, .content { padding: 20px; }
                .download-button { display: block; margin: 10px 0; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">Thank you for your order!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${data.orderNumber}</p>
            </div>

            <div class="content">
                <p>Hi ${data.customerName},</p>
                <p>Thank you for your purchase! Your digital products are ready for download.</p>

                <div class="order-details">
                    <h3 style="margin-top: 0;">Order Details</h3>
                    ${data.items.map(item => `
                        <div class="item">
                            <span>${item.title}</span>
                            <span>$${item.price.toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="item total">
                        <span>Total</span>
                        <span>$${data.total.toFixed(2)}</span>
                    </div>
                </div>

                <h3>Download Your Files</h3>
                <p>Click the buttons below to download your purchased items:</p>

                <div style="text-align: center; margin: 20px 0;">
                    ${data.items.map(item => `
                        <a href="${item.downloadUrl || '#'}" class="download-button">
                            Download ${item.title}
                        </a>
                    `).join('')}
                </div>

                <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #92400e;">Download Instructions</h4>
                    <p style="margin-bottom: 0; color: #92400e; font-size: 14px;">${data.downloadInstructions}</p>
                </div>

                <p>If you have any questions or need help, please don't hesitate to contact our support team.</p>

                <p>Best regards,<br>The Godot Tekko Team</p>
            </div>

            <div class="footer">
                <p>This email was sent to ${data.customerEmail}</p>
                <p>© 2025 Godot Tekko. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `

    const text = `
Order Confirmation - ${data.orderNumber}

Hi ${data.customerName},

Thank you for your purchase! Your digital products are ready for download.

Order Details:
${data.items.map(item => `- ${item.title}: $${item.price.toFixed(2)}`).join('\n')}
Total: $${data.total.toFixed(2)}

Download Instructions:
${data.downloadInstructions}

Download your files from your dashboard: [Your Dashboard URL]

If you have any questions, please contact our support team.

Best regards,
The Godot Tekko Team
    `

    return { subject, html, text }
  }

  private static generatePartnerNotificationTemplate(data: PartnerNotificationData): EmailTemplate {
    const subject = `🎉 New Sale: ${data.productTitle}`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Sale Notification</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 30px; }
            .sale-details { background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">You made a sale!</p>
            </div>

            <div class="content">
                <p>Hi ${data.partnerName},</p>
                <p>Great news! Someone just purchased your product.</p>

                <div class="sale-details">
                    <h3 style="margin-top: 0; color: #065f46;">Sale Details</h3>
                    <p><strong>Product:</strong> ${data.productTitle}</p>
                    <p><strong>Customer:</strong> ${data.customerName}</p>
                    <p><strong>Order:</strong> #${data.orderNumber}</p>
                    <p><strong>Amount:</strong> <span class="amount">$${data.amount.toFixed(2)}</span></p>
                </div>

                <p>This sale will be included in your next payout. Keep up the great work!</p>

                <div style="text-align: center;">
                    <a href="#" class="button">View Analytics</a>
                    <a href="#" class="button" style="background-color: #059669;">Partner Dashboard</a>
                </div>

                <p>Best regards,<br>The Godot Tekko Team</p>
            </div>

            <div class="footer">
                <p>This email was sent to ${data.partnerEmail}</p>
                <p>© 2025 Godot Tekko. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `

    const text = `
🎉 New Sale: ${data.productTitle}

Hi ${data.partnerName},

Great news! Someone just purchased your product.

Sale Details:
- Product: ${data.productTitle}
- Customer: ${data.customerName}
- Order: #${data.orderNumber}
- Amount: $${data.amount.toFixed(2)}

This sale will be included in your next payout. Keep up the great work!

View your analytics and earnings in your Partner Dashboard.

Best regards,
The Godot Tekko Team
    `

    return { subject, html, text }
  }

  private static generateLicenseExpirationTemplate(data: LicenseExpirationData): EmailTemplate {
    const subject = `License Expiring Soon: ${data.productTitle}`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>License Expiring Soon</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 30px; }
            .warning-box { background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">⚠️ License Expiring Soon</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.productTitle}</p>
            </div>

            <div class="content">
                <p>Hi ${data.customerName},</p>
                <p>Your license for <strong>${data.productTitle}</strong> is expiring soon.</p>

                <div class="warning-box">
                    <h3 style="margin-top: 0; color: #92400e;">License Details</h3>
                    <p><strong>Product:</strong> ${data.productTitle}</p>
                    <p><strong>License Key:</strong> ${data.licenseKey}</p>
                    <p><strong>Expires:</strong> ${new Date(data.expiresAt).toLocaleDateString()}</p>
                </div>

                <p>To continue using this product and receive updates, please renew your license before it expires.</p>

                <div style="text-align: center;">
                    <a href="${data.renewUrl}" class="button">Renew License</a>
                </div>

                <p>If you have any questions, please don't hesitate to contact our support team.</p>

                <p>Best regards,<br>The Godot Tekko Team</p>
            </div>

            <div class="footer">
                <p>This email was sent to ${data.customerEmail}</p>
                <p>© 2025 Godot Tekko. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `

    const text = `
License Expiring Soon: ${data.productTitle}

Hi ${data.customerName},

Your license for ${data.productTitle} is expiring soon.

License Details:
- Product: ${data.productTitle}
- License Key: ${data.licenseKey}
- Expires: ${new Date(data.expiresAt).toLocaleDateString()}

To continue using this product and receive updates, please renew your license before it expires.

Renew your license: ${data.renewUrl}

If you have any questions, please contact our support team.

Best regards,
The Godot Tekko Team
    `

    return { subject, html, text }
  }

  // Bulk email sending for marketing campaigns
  static async sendBulkEmail(
    recipients: string[],
    subject: string,
    htmlTemplate: string,
    personalizations?: Record<string, any>
  ) {
    const results = []

    for (const recipient of recipients) {
      let html = htmlTemplate

      // Replace personalizations
      if (personalizations) {
        Object.entries(personalizations).forEach(([key, value]) => {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), value)
        })
      }

      const result = await this.sendEmail(recipient, subject, html)
      results.push({ recipient, ...result })

      // Add delay to avoid rate limiting
      if (process.env.NODE_ENV === 'production') {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }
}

// Helper function to format download instructions
export function generateDownloadInstructions(hasAccessPass: boolean): string {
  if (hasAccessPass) {
    return `You have an active Access Pass! You can download this product and all future products unlimited times from your dashboard. Your downloads never expire.`
  }

  return `Your download links are valid for 30 days and can be used up to 5 times. Please save your files locally after downloading. You can always re-download from your dashboard within the time limit.`
}
