// Enhanced Mock Stripe for Professional Local Development
// Simulates real Stripe behavior without external dependencies

// Test card numbers for different scenarios
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  SUCCESS_DEBIT: '4000056655665556',
  DECLINE_GENERIC: '4000000000000002',
  DECLINE_INSUFFICIENT_FUNDS: '4000000000009995',
  DECLINE_LOST_CARD: '4000000000009987',
  DECLINE_STOLEN_CARD: '4000000000009979',
  PROCESSING_ERROR: '4000000000000119',
  REQUIRE_AUTHENTICATION: '4000002760003184'
} as const

// Mock configuration for realistic behavior
interface MockStripeConfig {
  enableRealisticDelays: boolean
  simulateNetworkLatency: boolean
  enableFailureScenarios: boolean
  webhookDelay: number
  processingDelay: number
}

const CONFIG: MockStripeConfig = {
  enableRealisticDelays: true,
  simulateNetworkLatency: true,
  enableFailureScenarios: true,
  webhookDelay: 2000, // 2 seconds
  processingDelay: 1500 // 1.5 seconds
}

// Generate realistic license keys
function generateLicenseKey(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `UI8-${timestamp}-${random}`.toUpperCase()
}

export interface MockPaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled'
  client_secret: string
  customer: string
  metadata: Record<string, string>
  created: number
}

export interface MockSubscription {
  id: string
  customer: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete'
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  metadata: Record<string, string>
  items: {
    data: Array<{
      price: {
        id: string
        unit_amount: number
        currency: string
        recurring?: {
          interval: 'month' | 'year'
        }
      }
    }>
  }
}

export interface MockCustomer {
  id: string
  email: string
  name?: string
  metadata: Record<string, string>
}

class MockStripeService {
  private paymentIntents: Map<string, MockPaymentIntent> = new Map()
  private subscriptions: Map<string, MockSubscription> = new Map()
  private customers: Map<string, MockCustomer> = new Map()
  private webhookQueue: Array<{
    id: string
    type: string
    data: any
    created: number
    processed: boolean
  }> = []
  private eventLog: Array<{
    timestamp: number
    event: string
    details: any
  }> = []

  // Add realistic delay simulation
  private async simulateDelay(operation: string): Promise<void> {
    if (!CONFIG.enableRealisticDelays) return

    let delay = 0
    switch (operation) {
      case 'payment_intent_create':
        delay = 300 + Math.random() * 200 // 300-500ms
        break
      case 'payment_intent_confirm':
        delay = CONFIG.processingDelay + Math.random() * 500 // 1.5-2s
        break
      case 'subscription_create':
        delay = 800 + Math.random() * 400 // 800-1200ms
        break
      case 'webhook_delivery':
        delay = CONFIG.webhookDelay
        break
      default:
        delay = 100 + Math.random() * 100 // 100-200ms
    }

    await new Promise(resolve => setTimeout(resolve, delay))
  }

  // Enhanced logging
  private log(event: string, details: any): void {
    const logEntry = {
      timestamp: Date.now(),
      event,
      details
    }
    this.eventLog.push(logEntry)
    console.log(`🔵 Mock Stripe [${event}]:`, details)

    // Keep only last 100 log entries
    if (this.eventLog.length > 100) {
      this.eventLog.shift()
    }
  }

  // Check if card should fail based on test numbers
  private shouldFailPayment(cardNumber?: string): { fail: boolean; error?: string } {
    if (!cardNumber || !CONFIG.enableFailureScenarios) {
      return { fail: false }
    }

    switch (cardNumber) {
      case TEST_CARDS.DECLINE_GENERIC:
        return { fail: true, error: 'Your card was declined.' }
      case TEST_CARDS.DECLINE_INSUFFICIENT_FUNDS:
        return { fail: true, error: 'Your card has insufficient funds.' }
      case TEST_CARDS.DECLINE_LOST_CARD:
        return { fail: true, error: 'Your card was declined.' }
      case TEST_CARDS.DECLINE_STOLEN_CARD:
        return { fail: true, error: 'Your card was declined.' }
      case TEST_CARDS.PROCESSING_ERROR:
        return { fail: true, error: 'An error occurred while processing your card.' }
      case TEST_CARDS.REQUIRE_AUTHENTICATION:
        return { fail: true, error: 'Your card requires authentication.' }
      default:
        return { fail: false }
    }
  }

  // Enhanced Payment Intents with realistic behavior
  async createPaymentIntent(params: {
    amount: number
    currency: string
    customer?: string
    metadata?: Record<string, string>
    automatic_payment_methods?: { enabled: boolean }
  }): Promise<MockPaymentIntent> {
    await this.simulateDelay('payment_intent_create')

    const id = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const client_secret = `${id}_secret_${Math.random().toString(36).substr(2, 16)}`

    // Ensure customer exists
    let customerId = params.customer
    if (!customerId) {
      const newCustomer = this.createMockCustomer()
      customerId = newCustomer.id
    }

    const paymentIntent: MockPaymentIntent = {
      id,
      amount: params.amount,
      currency: params.currency,
      status: 'requires_payment_method',
      client_secret,
      customer: customerId,
      metadata: params.metadata || {},
      created: Math.floor(Date.now() / 1000)
    }

    this.paymentIntents.set(id, paymentIntent)
    this.log('payment_intent_created', {
      id,
      amount: params.amount,
      currency: params.currency,
      customer: customerId
    })

    return paymentIntent
  }

  // Enhanced payment confirmation with realistic scenarios
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodData?: { card?: { number?: string } }
  ): Promise<MockPaymentIntent> {
    const paymentIntent = this.paymentIntents.get(paymentIntentId)
    if (!paymentIntent) {
      throw new Error('Payment intent not found')
    }

    // Check for test card failures
    const cardNumber = paymentMethodData?.card?.number
    const failureCheck = this.shouldFailPayment(cardNumber)

    if (failureCheck.fail) {
      paymentIntent.status = 'canceled'
      this.paymentIntents.set(paymentIntentId, paymentIntent)
      this.log('payment_intent_failed', { id: paymentIntentId, error: failureCheck.error })
      throw new Error(failureCheck.error)
    }

    // Update to processing
    paymentIntent.status = 'processing'
    this.paymentIntents.set(paymentIntentId, paymentIntent)
    this.log('payment_intent_processing', { id: paymentIntentId })

    // Simulate processing delay
    await this.simulateDelay('payment_intent_confirm')

    // Mark as succeeded
    paymentIntent.status = 'succeeded'
    this.paymentIntents.set(paymentIntentId, paymentIntent)
    this.log('payment_intent_succeeded', { id: paymentIntentId, amount: paymentIntent.amount })

    // Trigger webhook after delay
    setTimeout(() => {
      this.triggerWebhook('payment_intent.succeeded', paymentIntent)
    }, CONFIG.webhookDelay)

    return paymentIntent
  }



  async retrievePaymentIntent(paymentIntentId: string): Promise<MockPaymentIntent | null> {
    return this.paymentIntents.get(paymentIntentId) || null
  }

  // Enhanced Subscriptions with realistic behavior
  async createSubscription(params: {
    customer: string
    items: Array<{ price: string }>
    metadata?: Record<string, string>
    payment_behavior?: string
    payment_settings?: { save_default_payment_method: string }
    expand?: string[]
  }): Promise<MockSubscription> {
    await this.simulateDelay('subscription_create')

    const id = `sub_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Enhanced price data with realistic pricing
    const getPriceData = (priceId: string) => {
      // Extract pass type from price ID or metadata
      let passType = 'monthly'
      if (priceId.includes('yearly') || params.metadata?.passType === 'yearly') {
        passType = 'yearly'
      } else if (priceId.includes('lifetime') || params.metadata?.passType === 'lifetime') {
        passType = 'lifetime'
      }

      const priceMapping = {
        monthly: { amount: 2900, interval: 'month' }, // $29/month
        yearly: { amount: 29000, interval: 'year' },  // $290/year
        lifetime: { amount: 99900, interval: null }   // $999 one-time
      }

      const config = priceMapping[passType as keyof typeof priceMapping]

      return {
        id: priceId,
        unit_amount: config.amount,
        currency: 'usd',
        recurring: config.interval ? { interval: config.interval as 'month' | 'year' } : undefined
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const priceData = getPriceData(params.items[0].price)

    // Calculate period end based on interval
    let periodEnd = now + (30 * 24 * 60 * 60) // Default 30 days
    if (priceData.recurring?.interval === 'year') {
      periodEnd = now + (365 * 24 * 60 * 60) // 1 year
    }

    const subscription: MockSubscription = {
      id,
      customer: params.customer,
      status: 'active',
      current_period_start: now,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      metadata: params.metadata || {},
      items: {
        data: params.items.map(item => ({
          price: getPriceData(item.price)
        }))
      }
    }

    this.subscriptions.set(id, subscription)
    this.log('subscription_created', {
      id,
      customer: params.customer,
      passType: params.metadata?.passType,
      amount: priceData.unit_amount
    })

    // Trigger webhook after delay
    setTimeout(() => {
      this.triggerWebhook('customer.subscription.created', subscription)
    }, CONFIG.webhookDelay)

    return subscription
  }

  async updateSubscription(subscriptionId: string, params: {
    cancel_at_period_end?: boolean
    metadata?: Record<string, string>
  }): Promise<MockSubscription> {
    await this.simulateDelay('subscription_update')

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Update subscription properties
    if (params.cancel_at_period_end !== undefined) {
      subscription.cancel_at_period_end = params.cancel_at_period_end
      if (params.cancel_at_period_end) {
        subscription.status = 'active' // Still active until period end
      }
    }

    if (params.metadata) {
      subscription.metadata = { ...subscription.metadata, ...params.metadata }
    }

    this.subscriptions.set(subscriptionId, subscription)
    this.log('subscription_updated', {
      id: subscriptionId,
      cancel_at_period_end: subscription.cancel_at_period_end
    })

    // Trigger webhook
    setTimeout(() => {
      this.triggerWebhook('customer.subscription.updated', subscription)
    }, CONFIG.webhookDelay)

    return subscription
  }

  async cancelSubscription(subscriptionId: string): Promise<MockSubscription> {
    await this.simulateDelay('subscription_cancel')

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    subscription.status = 'canceled'
    subscription.cancel_at_period_end = true

    this.subscriptions.set(subscriptionId, subscription)
    this.log('subscription_canceled', { id: subscriptionId })

    // Trigger webhook
    setTimeout(() => {
      this.triggerWebhook('customer.subscription.deleted', subscription)
    }, CONFIG.webhookDelay)

    return subscription
  }



  async retrieveSubscription(subscriptionId: string): Promise<MockSubscription | null> {
    return this.subscriptions.get(subscriptionId) || null
  }

  // Enhanced Customer Management
  createMockCustomer(params?: {
    email?: string
    name?: string
    metadata?: Record<string, string>
  }): MockCustomer {
    const id = `cus_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const customer: MockCustomer = {
      id,
      email: params?.email || `user.${Date.now()}@ui8clone.dev`,
      name: params?.name,
      metadata: params?.metadata || {}
    }

    this.customers.set(id, customer)
    this.log('customer_created', { id, email: customer.email, name: customer.name })

    return customer
  }

  async findCustomerByEmail(email: string): Promise<MockCustomer | null> {
    await this.simulateDelay('customer_search')

    for (const customer of this.customers.values()) {
      if (customer.email === email) {
        this.log('customer_found', { id: customer.id, email })
        return customer
      }
    }

    this.log('customer_not_found', { email })
    return null
  }

  async createOrRetrieveCustomer(userId: string, email: string, name?: string): Promise<MockCustomer> {
    // Try to find existing customer by userId in metadata
    for (const customer of this.customers.values()) {
      if (customer.metadata.userId === userId) {
        this.log('customer_retrieved', { id: customer.id, userId })
        return customer
      }
    }

    // Try to find by email
    const existingByEmail = await this.findCustomerByEmail(email)
    if (existingByEmail) {
      // Update with userId
      existingByEmail.metadata.userId = userId
      this.customers.set(existingByEmail.id, existingByEmail)
      this.log('customer_updated', { id: existingByEmail.id, userId })
      return existingByEmail
    }

    // Create new customer
    const newCustomer = this.createMockCustomer({
      email,
      name,
      metadata: { userId }
    })

    return newCustomer
  }

  // Development and testing utilities
  getWebhookQueue(): Array<any> {
    return [...this.webhookQueue]
  }

  getEventLog(): Array<any> {
    return [...this.eventLog]
  }

  clearWebhookQueue(): void {
    this.webhookQueue = []
    this.log('webhook_queue_cleared', {})
  }

  clearEventLog(): void {
    this.eventLog = []
    console.log('🔵 Mock Stripe: Event log cleared')
  }

  // Get development status for debugging
  getStatus(): {
    paymentIntents: number
    subscriptions: number
    customers: number
    pendingWebhooks: number
    recentEvents: number
  } {
    return {
      paymentIntents: this.paymentIntents.size,
      subscriptions: this.subscriptions.size,
      customers: this.customers.size,
      pendingWebhooks: this.webhookQueue.filter(w => !w.processed).length,
      recentEvents: this.eventLog.length
    }
  }

  // Enhanced Webhook System with proper queuing and retry logic
  private triggerWebhook(eventType: string, data: any): void {
    const webhookEvent = {
      id: `evt_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      data: { object: data },
      created: Math.floor(Date.now() / 1000),
      processed: false
    }

    this.webhookQueue.push(webhookEvent)
    this.log('webhook_queued', { type: eventType, id: webhookEvent.id })

    // Simulate webhook delivery with realistic delay
    setTimeout(() => {
      this.deliverWebhook(webhookEvent)
    }, CONFIG.webhookDelay)
  }

  private async deliverWebhook(webhook: any): Promise<void> {
    try {
      this.log('webhook_delivering', { type: webhook.type, id: webhook.id })

      // Simulate network request to webhook endpoint
      if (typeof window === 'undefined') {
        // Only on server side - simulate calling our webhook handler
        await this.processWebhookLocally(webhook)
      }

      // Mark as processed
      webhook.processed = true
      this.log('webhook_delivered', { type: webhook.type, id: webhook.id })

    } catch (error) {
      this.log('webhook_failed', {
        type: webhook.type,
        id: webhook.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Simulate retry after 5 seconds
      setTimeout(() => {
        this.log('webhook_retrying', { type: webhook.type, id: webhook.id })
        this.deliverWebhook(webhook)
      }, 5000)
    }
  }

  // Enhanced local webhook processing
  private async processWebhookLocally(webhook: any): Promise<void> {
    const { type, data } = webhook
    const object = data.object

    try {
      switch (type) {
        case 'payment_intent.succeeded':
          this.log('processing_payment_success', {
            payment_intent_id: object.id,
            amount: object.amount,
            customer: object.customer
          })
          break

        case 'customer.subscription.created':
          this.log('processing_subscription_created', {
            subscription_id: object.id,
            customer: object.customer,
            status: object.status
          })
          break

        case 'customer.subscription.updated':
          this.log('processing_subscription_updated', {
            subscription_id: object.id,
            status: object.status,
            cancel_at_period_end: object.cancel_at_period_end
          })
          break

        case 'customer.subscription.deleted':
          this.log('processing_subscription_deleted', {
            subscription_id: object.id,
            customer: object.customer
          })
          break

        default:
          this.log('webhook_ignored', { type, object_id: object.id })
      }
    } catch (error) {
      this.log('webhook_processing_error', {
        type,
        object_id: object.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }



  // Enhanced testing and simulation methods
  simulatePaymentSuccess(paymentIntentId: string): void {
    const paymentIntent = this.paymentIntents.get(paymentIntentId)
    if (paymentIntent) {
      paymentIntent.status = 'succeeded'
      this.paymentIntents.set(paymentIntentId, paymentIntent)
      this.log('manual_payment_success', { id: paymentIntentId })
      this.triggerWebhook('payment_intent.succeeded', paymentIntent)
    } else {
      this.log('payment_intent_not_found', { id: paymentIntentId })
    }
  }

  simulatePaymentFailure(paymentIntentId: string, reason: string = 'generic_decline'): void {
    const paymentIntent = this.paymentIntents.get(paymentIntentId)
    if (paymentIntent) {
      paymentIntent.status = 'canceled'
      this.paymentIntents.set(paymentIntentId, paymentIntent)
      this.log('manual_payment_failure', { id: paymentIntentId, reason })
      this.triggerWebhook('payment_intent.payment_failed', paymentIntent)
    } else {
      this.log('payment_intent_not_found', { id: paymentIntentId })
    }
  }

  // Simulate subscription lifecycle events
  simulateSubscriptionRenewal(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      // Move to next billing period
      const periodLength = subscription.items.data[0].price.recurring?.interval === 'year'
        ? 365 * 24 * 60 * 60
        : 30 * 24 * 60 * 60

      subscription.current_period_start = subscription.current_period_end
      subscription.current_period_end = subscription.current_period_end + periodLength

      this.subscriptions.set(subscriptionId, subscription)
      this.log('subscription_renewed', { id: subscriptionId })
      this.triggerWebhook('customer.subscription.updated', subscription)
    }
  }

  // Test scenario helpers
  createTestScenario(scenario: 'successful_purchase' | 'failed_payment' | 'subscription_flow'): {
    customer: MockCustomer
    paymentIntent?: MockPaymentIntent
    subscription?: MockSubscription
  } {
    const customer = this.createMockCustomer({
      email: `test.${scenario}@ui8clone.dev`,
      name: `Test User ${scenario.replace('_', ' ')}`
    })

    switch (scenario) {
      case 'successful_purchase':
        const paymentIntent = {
          id: `pi_test_${Date.now()}`,
          amount: 4900, // $49
          currency: 'usd',
          status: 'requires_payment_method' as const,
          client_secret: `pi_test_${Date.now()}_secret`,
          customer: customer.id,
          metadata: { scenario: 'test_purchase' },
          created: Math.floor(Date.now() / 1000)
        }
        this.paymentIntents.set(paymentIntent.id, paymentIntent)
        return { customer, paymentIntent }

      case 'subscription_flow':
        const subscription = {
          id: `sub_test_${Date.now()}`,
          customer: customer.id,
          status: 'active' as const,
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
          cancel_at_period_end: false,
          metadata: { scenario: 'test_subscription' },
          items: {
            data: [{
              price: {
                id: 'price_test_monthly',
                unit_amount: 2900,
                currency: 'usd',
                recurring: { interval: 'month' as const }
              }
            }]
          }
        }
        this.subscriptions.set(subscription.id, subscription)
        return { customer, subscription }

      default:
        return { customer }
    }
  }

  // Price management for subscriptions
  async createPrice(params: {
    unit_amount: number
    currency: string
    recurring?: {
      interval: 'month' | 'year'
    }
    product_data?: {
      name: string
      metadata?: Record<string, string>
    }
    metadata?: Record<string, string>
  }) {
    const id = `price_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      id,
      unit_amount: params.unit_amount,
      currency: params.currency,
      recurring: params.recurring,
      metadata: params.metadata || {}
    }
  }
}

// Export singleton instance
export const mockStripe = new MockStripeService()

// Enhanced helper functions for better development experience
export const mockStripeHelpers = {
  // Formatting utilities
  formatPrice: (cents: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(cents / 100)
  },

  formatSubscriptionPrice: (amount: number, interval: string, currency: string = 'USD'): string => {
    const price = mockStripeHelpers.formatPrice(amount, currency)
    return `${price}${interval ? `/${interval}` : ''}`
  },

  // License key generation
  generateLicenseKey,

  // Test card helpers
  getTestCards: () => TEST_CARDS,

  isTestCard: (cardNumber: string): boolean => {
    return Object.values(TEST_CARDS).includes(cardNumber as any)
  },

  getCardScenario: (cardNumber: string): string => {
    const entry = Object.entries(TEST_CARDS).find(([, number]) => number === cardNumber)
    return entry ? entry[0].toLowerCase().replace(/_/g, ' ') : 'unknown'
  },

  // Enhanced simulation methods
  simulateSuccessfulPurchase: async (params: {
    userId: string
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
    licenseType?: 'basic' | 'extended'
    cardNumber?: string
  }) => {
    const totalAmount = params.items.reduce((sum, item) => sum + (item.price * item.quantity * 100), 0)

    const paymentIntent = await mockStripe.createPaymentIntent({
      amount: totalAmount,
      currency: 'usd',
      metadata: {
        userId: params.userId,
        orderType: 'individual',
        licenseType: params.licenseType || 'basic',
        itemCount: params.items.length.toString(),
        orderItems: JSON.stringify(params.items)
      }
    })

    // Simulate payment confirmation with test card
    setTimeout(async () => {
      try {
        await mockStripe.confirmPaymentIntent(paymentIntent.id, {
          card: { number: params.cardNumber || TEST_CARDS.SUCCESS }
        })
      } catch (error) {
        console.log(`Payment simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }, 1500)

    return paymentIntent
  },

  // Enhanced access pass subscription simulation
  simulateAccessPassSubscription: async (params: {
    userId: string
    passType: 'monthly' | 'yearly' | 'lifetime'
    email: string
    name?: string
    cardNumber?: string
  }) => {
    const customer = await mockStripe.createOrRetrieveCustomer(params.userId, params.email, params.name)

    if (params.passType === 'lifetime') {
      // Lifetime is a one-time payment
      const paymentIntent = await mockStripe.createPaymentIntent({
        amount: 99900, // $999
        currency: 'usd',
        customer: customer.id,
        metadata: {
          userId: params.userId,
          orderType: 'access_pass',
          passType: 'lifetime'
        }
      })

      // Simulate payment confirmation
      setTimeout(async () => {
        try {
          await mockStripe.confirmPaymentIntent(paymentIntent.id, {
            card: { number: params.cardNumber || TEST_CARDS.SUCCESS }
          })
        } catch (error) {
          console.log(`Access pass payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }, 2000)

      return { type: 'payment_intent', paymentIntent, customer }
    } else {
      // Monthly/Yearly subscription
      const subscription = await mockStripe.createSubscription({
        customer: customer.id,
        items: [{ price: `price_${params.passType}_access_pass` }],
        metadata: {
          userId: params.userId,
          passType: params.passType
        },
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' }
      })

      return { type: 'subscription', subscription, customer }
    }
  },

  // Development utilities
  getDevStatus: () => mockStripe.getStatus(),

  getRecentEvents: (limit: number = 10) => mockStripe.getEventLog().slice(-limit),

  clearAllData: () => {
    mockStripe.clearWebhookQueue()
    mockStripe.clearEventLog()
  },

  // Price configuration helpers
  getAccessPassPrices: () => ({
    monthly: { amount: 2900, interval: 'month', display: '$29/month' },
    yearly: { amount: 29000, interval: 'year', display: '$290/year' },
    lifetime: { amount: 99900, interval: null, display: '$999 one-time' }
  })
}
