import { Resend } from 'resend'
import { PLATFORM_CONFIG } from '@/config/platform'

// Email service configuration
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = PLATFORM_CONFIG.email.fromEmail
const SUPPORT_EMAIL = PLATFORM_CONFIG.email.supportEmail

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export class EmailService {
  /**
   * Send an email using the configured service
   */
  static async sendEmail(options: EmailOptions): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      })

      return {
        success: true,
        messageId: result.data?.id
      }
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    verificationUrl?: string
  ): Promise<boolean> {
    const template = EmailTemplates.welcome(userName, verificationUrl)

    const result = await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    return result.success
  }

  /**
   * Send purchase confirmation email
   */
  static async sendPurchaseConfirmation(
    userEmail: string,
    userName: string,
    orderDetails: {
      orderNumber: string
      items: Array<{
        productTitle: string
        price: number
        downloadUrl?: string
      }>
      total: number
      currency: string
    }
  ): Promise<boolean> {
    const template = EmailTemplates.purchaseConfirmation(userName, orderDetails)

    const result = await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    return result.success
  }

  /**
   * Send download ready notification
   */
  static async sendDownloadReady(
    userEmail: string,
    userName: string,
    productTitle: string,
    downloadUrl: string,
    expiresAt: Date
  ): Promise<boolean> {
    const template = EmailTemplates.downloadReady(userName, productTitle, downloadUrl, expiresAt)

    const result = await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    return result.success
  }

  /**
   * Send partner sale notification
   */
  static async sendPartnerSaleNotification(
    partnerEmail: string,
    partnerName: string,
    saleDetails: {
      productTitle: string
      customerName: string
      saleAmount: number
      commission: number
      currency: string
      orderNumber: string
    }
  ): Promise<boolean> {
    const template = EmailTemplates.partnerSale(partnerName, saleDetails)

    const result = await this.sendEmail({
      to: partnerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    return result.success
  }

  /**
   * Send partner application status update
   */
  static async sendPartnerApplicationUpdate(
    applicantEmail: string,
    applicantName: string,
    status: 'approved' | 'rejected' | 'pending',
    message?: string
  ): Promise<boolean> {
    const template = EmailTemplates.partnerApplicationStatus(applicantName, status, message)

    const result = await this.sendEmail({
      to: applicantEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    return result.success
  }

  /**
   * Send admin notification
   */
  static async sendAdminNotification(
    subject: string,
    message: string,
    details?: Record<string, any>
  ): Promise<boolean> {
    const template = EmailTemplates.adminNotification(subject, message, details)

    const result = await this.sendEmail({
      to: SUPPORT_EMAIL,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    return result.success
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    userEmail: string,
    userName: string,
    resetUrl: string
  ): Promise<boolean> {
    const template = EmailTemplates.passwordReset(userName, resetUrl)

    const result = await this.sendEmail({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    return result.success
  }

  /**
   * Send monthly revenue report to partner
   */
  static async sendPartnerMonthlyReport(
    partnerEmail: string,
    partnerName: string,
    reportData: {
      month: string
      totalEarnings: number
      totalSales: number
      topProducts: Array<{
        title: string
        sales: number
        earnings: number
      }>
      currency: string
    }
  ): Promise<boolean> {
    const template = EmailTemplates.partnerMonthlyReport(partnerName, reportData)

    const result = await this.sendEmail({
      to: partnerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    return result.success
  }
}

// Email templates with professional HTML design
export class EmailTemplates {
  private static getBaseTemplate(content: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>UI8 Marketplace</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #dee2e6; }
        .highlight { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .order-item { border-bottom: 1px solid #dee2e6; padding: 15px 0; }
        .order-item:last-child { border-bottom: none; }
        .price { font-weight: 600; color: #28a745; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>UI8 Marketplace</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; 2024 UI8 Marketplace. All rights reserved.</p>
          <p>If you have any questions, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  static welcome(userName: string, verificationUrl?: string): EmailTemplate {
    const content = `
      <h2>Welcome to UI8 Marketplace, ${userName}! 🎉</h2>
      <p>Thank you for joining our community of designers and creators. You now have access to thousands of high-quality design resources.</p>

      ${verificationUrl ? `
        <div class="highlight">
          <h3>Verify Your Email Address</h3>
          <p>To get started, please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>
      ` : ''}

      <h3>What's Next?</h3>
      <ul>
        <li>🎨 Browse our collection of UI kits, icons, and templates</li>
        <li>💎 Consider upgrading to All-Access for unlimited downloads</li>
        <li>🚀 Join our community and follow your favorite creators</li>
      </ul>

      <p>Happy designing!</p>
      <p>The UI8 Team</p>
    `

    return {
      subject: 'Welcome to UI8 Marketplace! 🎨',
      html: this.getBaseTemplate(content),
      text: `Welcome to UI8 Marketplace, ${userName}! Thank you for joining our community.${verificationUrl ? ` Please verify your email: ${verificationUrl}` : ''}`
    }
  }

  static purchaseConfirmation(userName: string, orderDetails: any): EmailTemplate {
    const itemsHtml = orderDetails.items.map((item: any) => `
      <div class="order-item">
        <strong>${item.productTitle}</strong>
        <div class="price">${orderDetails.currency} ${item.price.toFixed(2)}</div>
        ${item.downloadUrl ? `<a href="${item.downloadUrl}" class="button" style="font-size: 12px; padding: 8px 16px;">Download Now</a>` : ''}
      </div>
    `).join('')

    const content = `
      <h2>Purchase Confirmation 📦</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for your purchase! Your order <strong>${orderDetails.orderNumber}</strong> has been confirmed.</p>

      <div class="highlight">
        <h3>Order Details</h3>
        ${itemsHtml}
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #667eea;">
          <strong>Total: <span class="price">${orderDetails.currency} ${orderDetails.total.toFixed(2)}</span></strong>
        </div>
      </div>

      <p>Your downloads are ready! Click the download buttons above or visit your dashboard to access your files.</p>
      <p>Need help? Contact our support team anytime.</p>

      <p>Happy creating!</p>
      <p>The UI8 Team</p>
    `

    return {
      subject: `Order Confirmation - ${orderDetails.orderNumber}`,
      html: this.getBaseTemplate(content),
      text: `Order confirmation for ${orderDetails.orderNumber}. Total: ${orderDetails.currency} ${orderDetails.total.toFixed(2)}`
    }
  }

  static downloadReady(userName: string, productTitle: string, downloadUrl: string, expiresAt: Date): EmailTemplate {
    const content = `
      <h2>Your Download is Ready! 📥</h2>
      <p>Hi ${userName},</p>
      <p>Your purchase of <strong>${productTitle}</strong> is ready for download.</p>

      <div class="highlight">
        <h3>${productTitle}</h3>
        <a href="${downloadUrl}" class="button">Download Now</a>
        <div class="warning">
          <strong>Important:</strong> This download link expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.
        </div>
      </div>

      <p>If you have any issues with your download, please contact our support team.</p>

      <p>Happy designing!</p>
      <p>The UI8 Team</p>
    `

    return {
      subject: `Download Ready: ${productTitle}`,
      html: this.getBaseTemplate(content),
      text: `Your download for ${productTitle} is ready: ${downloadUrl}`
    }
  }

  static partnerSale(partnerName: string, saleDetails: any): EmailTemplate {
    const content = `
      <h2>New Sale Notification! 💰</h2>
      <p>Hi ${partnerName},</p>
      <p>Great news! You just made a sale.</p>

      <div class="highlight">
        <h3>Sale Details</h3>
        <p><strong>Product:</strong> ${saleDetails.productTitle}</p>
        <p><strong>Customer:</strong> ${saleDetails.customerName}</p>
        <p><strong>Sale Amount:</strong> <span class="price">${saleDetails.currency} ${saleDetails.saleAmount.toFixed(2)}</span></p>
        <p><strong>Your Commission:</strong> <span class="price">${saleDetails.currency} ${saleDetails.commission.toFixed(2)}</span></p>
        <p><strong>Order Number:</strong> ${saleDetails.orderNumber}</p>
      </div>

      <p>Your earnings will be processed and added to your account within 24 hours.</p>
      <p>Keep up the great work!</p>

      <p>The UI8 Team</p>
    `

    return {
      subject: '💰 New Sale - Commission Earned!',
      html: this.getBaseTemplate(content),
      text: `New sale: ${saleDetails.productTitle} - Commission: ${saleDetails.currency} ${saleDetails.commission.toFixed(2)}`
    }
  }

  static partnerApplicationStatus(applicantName: string, status: string, message?: string): EmailTemplate {
    const statusConfig = {
      approved: { emoji: '🎉', color: '#28a745', title: 'Application Approved!' },
      rejected: { emoji: '❌', color: '#dc3545', title: 'Application Update' },
      pending: { emoji: '⏳', color: '#ffc107', title: 'Application Under Review' }
    }

    const config = statusConfig[status as keyof typeof statusConfig]

    const content = `
      <h2>${config.emoji} ${config.title}</h2>
      <p>Hi ${applicantName},</p>

      ${status === 'approved' ? `
        <p>Congratulations! Your partner application has been approved. Welcome to the UI8 Marketplace partner program!</p>
        <div class="highlight">
          <h3>Next Steps:</h3>
          <ul>
            <li>Upload your first products</li>
            <li>Set up your partner profile</li>
            <li>Start earning commissions</li>
          </ul>
          <a href="/partner/dashboard" class="button">Go to Partner Dashboard</a>
        </div>
      ` : status === 'rejected' ? `
        <p>Thank you for your interest in becoming a partner. After careful review, we're unable to approve your application at this time.</p>
        ${message ? `<div class="highlight"><p><strong>Feedback:</strong> ${message}</p></div>` : ''}
        <p>You're welcome to reapply in the future as your portfolio develops.</p>
      ` : `
        <p>Thank you for your partner application. We're currently reviewing your submission and will get back to you within 48 hours.</p>
        ${message ? `<div class="highlight"><p><strong>Update:</strong> ${message}</p></div>` : ''}
      `}

      <p>If you have any questions, feel free to contact our team.</p>

      <p>The UI8 Team</p>
    `

    return {
      subject: `Partner Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: this.getBaseTemplate(content),
      text: `Partner application ${status}. ${message || ''}`
    }
  }

  static passwordReset(userName: string, resetUrl: string): EmailTemplate {
    const content = `
      <h2>Password Reset Request 🔐</h2>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password for your UI8 Marketplace account.</p>

      <div class="highlight">
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <div class="warning">
          <strong>Security Note:</strong> This link expires in 1 hour for your security.
        </div>
      </div>

      <p>If you didn't request this password reset, you can safely ignore this email.</p>

      <p>The UI8 Team</p>
    `

    return {
      subject: 'Reset Your Password - UI8 Marketplace',
      html: this.getBaseTemplate(content),
      text: `Password reset request. Use this link: ${resetUrl}`
    }
  }

  static partnerMonthlyReport(partnerName: string, reportData: any): EmailTemplate {
    const topProductsHtml = reportData.topProducts.map((product: any) => `
      <div class="order-item">
        <strong>${product.title}</strong>
        <div>${product.sales} sales • <span class="price">${reportData.currency} ${product.earnings.toFixed(2)}</span></div>
      </div>
    `).join('')

    const content = `
      <h2>📊 Monthly Partner Report - ${reportData.month}</h2>
      <p>Hi ${partnerName},</p>
      <p>Here's your performance summary for ${reportData.month}:</p>

      <div class="highlight">
        <h3>Month Summary</h3>
        <p><strong>Total Earnings:</strong> <span class="price">${reportData.currency} ${reportData.totalEarnings.toFixed(2)}</span></p>
        <p><strong>Total Sales:</strong> ${reportData.totalSales}</p>
        <p><strong>Average per Sale:</strong> <span class="price">${reportData.currency} ${(reportData.totalEarnings / reportData.totalSales).toFixed(2)}</span></p>
      </div>

      ${reportData.topProducts.length > 0 ? `
        <div class="highlight">
          <h3>Top Performing Products</h3>
          ${topProductsHtml}
        </div>
      ` : ''}

      <p>Keep up the excellent work! Your earnings will be processed according to our payment schedule.</p>

      <p>The UI8 Team</p>
    `

    return {
      subject: `📊 Monthly Report - ${reportData.month}`,
      html: this.getBaseTemplate(content),
      text: `Monthly report for ${reportData.month}. Earnings: ${reportData.currency} ${reportData.totalEarnings.toFixed(2)}`
    }
  }

  static adminNotification(subject: string, message: string, details?: Record<string, any>): EmailTemplate {
    const detailsHtml = details ? `
      <div class="highlight">
        <h3>Details</h3>
        ${Object.entries(details).map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`).join('')}
      </div>
    ` : ''

    const content = `
      <h2>🚨 Admin Notification</h2>
      <p><strong>${subject}</strong></p>
      <p>${message}</p>
      ${detailsHtml}
      <p><em>This is an automated notification from the UI8 Marketplace system.</em></p>
    `

    return {
      subject: `[Admin] ${subject}`,
      html: this.getBaseTemplate(content),
      text: `Admin notification: ${subject} - ${message}`
    }
  }
}
