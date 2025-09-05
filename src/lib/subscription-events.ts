interface SubscriptionEventParams {
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

type SubscriptionEventType =
  | 'subscription_started'
  | 'subscription_renewed'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'subscription_cancelled'
  | 'subscription_upgrade'
  | 'subscription_downgrade'

/**
 * Trigger subscription-related email automations
 */
export async function triggerSubscriptionEvent(
  eventType: SubscriptionEventType,
  params: SubscriptionEventParams
): Promise<{ success: boolean; triggeredWorkflows?: number; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/subscription-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        ...params
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to trigger subscription event')
    }

    return {
      success: true,
      triggeredWorkflows: result.triggeredWorkflows?.length || 0
    }

  } catch (error) {
    console.error(`Error triggering ${eventType}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Handle subscription confirmation when user first subscribes
 */
export async function handleSubscriptionStarted(params: SubscriptionEventParams) {
  return triggerSubscriptionEvent('subscription_started', params)
}

/**
 * Handle subscription renewal confirmation
 */
export async function handleSubscriptionRenewed(params: SubscriptionEventParams) {
  return triggerSubscriptionEvent('subscription_renewed', params)
}

/**
 * Handle subscription expiring warning (typically sent 7, 3, and 1 days before expiry)
 */
export async function handleSubscriptionExpiring(params: SubscriptionEventParams) {
  return triggerSubscriptionEvent('subscription_expiring', params)
}

/**
 * Handle subscription expired notification
 */
export async function handleSubscriptionExpired(params: SubscriptionEventParams) {
  return triggerSubscriptionEvent('subscription_expired', params)
}

/**
 * Handle subscription cancellation confirmation
 */
export async function handleSubscriptionCancelled(params: SubscriptionEventParams) {
  return triggerSubscriptionEvent('subscription_cancelled', params)
}

/**
 * Handle subscription upgrade notification
 */
export async function handleSubscriptionUpgrade(params: SubscriptionEventParams) {
  return triggerSubscriptionEvent('subscription_upgrade', params)
}

/**
 * Handle subscription downgrade notification
 */
export async function handleSubscriptionDowngrade(params: SubscriptionEventParams) {
  return triggerSubscriptionEvent('subscription_downgrade', params)
}

/**
 * Schedule expiry warnings for active subscriptions
 * This would typically be called by a cron job
 */
export async function scheduleExpiryWarnings(): Promise<void> {
  try {
    // This would typically be called by a background job/cron
    // For now, just log the intention
    console.log('Scheduling expiry warnings for active subscriptions...')

    // In production, you would:
    // 1. Query all active subscriptions
    // 2. Check which ones are expiring in 7, 3, or 1 days
    // 3. Trigger appropriate warning emails
    // 4. Use a job queue for reliability

  } catch (error) {
    console.error('Error scheduling expiry warnings:', error)
  }
}

/**
 * Utility function to calculate days until expiry
 */
export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Check if subscription needs expiry warning
 */
export function shouldSendExpiryWarning(expiryDate: string, warningDays: number[] = [7, 3, 1]): boolean {
  const daysUntil = getDaysUntilExpiry(expiryDate)
  return warningDays.includes(daysUntil)
}

/**
 * Generate subscription management URLs
 */
export function generateSubscriptionUrls(subscriptionId: string) {
  const baseUrl = process.env.NEXTAUTH_URL

  return {
    manageUrl: `${baseUrl}/user/subscription/manage?id=${subscriptionId}`,
    cancelUrl: `${baseUrl}/user/subscription/cancel?id=${subscriptionId}`,
    upgradeUrl: `${baseUrl}/all-access?upgrade=${subscriptionId}`,
    renewUrl: `${baseUrl}/user/subscription/renew?id=${subscriptionId}`
  }
}

/**
 * Example usage in subscription purchase flow
 */
export async function onSubscriptionPurchaseComplete(purchaseData: {
  userId: string
  planId: string
  planName: string
  price: number
  downloads: number
  duration: string
  paymentId: string
}) {
  try {
    // Calculate expiry date based on plan duration
    const expiryDate = calculateExpiryDate(purchaseData.duration)
    const renewalDate = calculateRenewalDate(purchaseData.duration)

    // Generate a subscription ID (this would come from your subscription system)
    const subscriptionId = `sub_${purchaseData.paymentId}_${Date.now()}`

    // Trigger subscription started email
    const result = await handleSubscriptionStarted({
      userId: purchaseData.userId,
      subscriptionId,
      planId: purchaseData.planId,
      planName: purchaseData.planName,
      price: purchaseData.price,
      downloads: purchaseData.downloads,
      expiryDate,
      renewalDate,
      metadata: {
        paymentId: purchaseData.paymentId,
        purchaseDate: new Date().toISOString()
      }
    })

    console.log('Subscription confirmation email triggered:', result)

  } catch (error) {
    console.error('Error handling subscription purchase:', error)
  }
}

/**
 * Helper function to calculate expiry date based on plan duration
 */
function calculateExpiryDate(duration: string): string {
  const now = new Date()

  if (duration.includes('month')) {
    const months = parseInt(duration.match(/\d+/)?.[0] || '3')
    now.setMonth(now.getMonth() + months)
  } else if (duration.includes('year')) {
    const years = parseInt(duration.match(/\d+/)?.[0] || '1')
    now.setFullYear(now.getFullYear() + years)
  } else if (duration.toLowerCase().includes('lifetime')) {
    // Set expiry to 100 years from now for lifetime plans
    now.setFullYear(now.getFullYear() + 100)
  }

  return now.toISOString()
}

/**
 * Helper function to calculate renewal date
 */
function calculateRenewalDate(duration: string): string | undefined {
  // Only recurring plans have renewal dates
  if (duration.toLowerCase().includes('lifetime')) {
    return undefined
  }

  return calculateExpiryDate(duration)
}

/**
 * Integration with payment webhooks
 * Call this from your payment provider webhooks (Stripe, PayPal, etc.)
 */
export async function handlePaymentWebhook(
  eventType: string,
  paymentData: any
): Promise<void> {
  try {
    switch (eventType) {
      case 'payment.completed':
      case 'invoice.payment_succeeded':
        // Handle successful payment/renewal
        await handleSubscriptionRenewed({
          userId: paymentData.userId,
          subscriptionId: paymentData.subscriptionId,
          planId: paymentData.planId,
          planName: paymentData.planName,
          price: paymentData.amount,
          downloads: paymentData.downloads,
          expiryDate: paymentData.newExpiryDate,
          renewalDate: paymentData.nextRenewalDate
        })
        break

      case 'subscription.cancelled':
        // Handle subscription cancellation
        await handleSubscriptionCancelled({
          userId: paymentData.userId,
          subscriptionId: paymentData.subscriptionId,
          planId: paymentData.planId,
          planName: paymentData.planName,
          price: paymentData.amount,
          downloads: paymentData.downloads,
          expiryDate: paymentData.expiryDate
        })
        break

      case 'subscription.updated':
        // Handle plan changes
        if (paymentData.isUpgrade) {
          await handleSubscriptionUpgrade({
            userId: paymentData.userId,
            subscriptionId: paymentData.subscriptionId,
            planId: paymentData.newPlanId,
            planName: paymentData.newPlanName,
            price: paymentData.newAmount,
            downloads: paymentData.newDownloads,
            expiryDate: paymentData.expiryDate,
            previousPlanId: paymentData.previousPlanId
          })
        } else {
          await handleSubscriptionDowngrade({
            userId: paymentData.userId,
            subscriptionId: paymentData.subscriptionId,
            planId: paymentData.newPlanId,
            planName: paymentData.newPlanName,
            price: paymentData.newAmount,
            downloads: paymentData.newDownloads,
            expiryDate: paymentData.expiryDate,
            previousPlanId: paymentData.previousPlanId
          })
        }
        break
    }

  } catch (error) {
    console.error('Error handling payment webhook:', error)
  }
}
