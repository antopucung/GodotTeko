import Stripe from 'stripe'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

// Access Pass pricing configuration
export const ACCESS_PASS_PRICES = {
  monthly: {
    price: parseInt(process.env.ACCESS_PASS_MONTHLY_PRICE || '2900'),
    interval: 'month' as const,
    name: 'Monthly Access Pass',
    description: 'Unlimited downloads for 1 month'
  },
  yearly: {
    price: parseInt(process.env.ACCESS_PASS_YEARLY_PRICE || '29000'),
    interval: 'year' as const,
    name: 'Yearly Access Pass',
    description: 'Unlimited downloads for 1 year (Save 17%)'
  },
  lifetime: {
    price: parseInt(process.env.ACCESS_PASS_LIFETIME_PRICE || '99900'),
    interval: null,
    name: 'Lifetime Access Pass',
    description: 'Unlimited downloads forever'
  }
}

// Helper function to format price
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100)
}

// Helper function to create payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

// Helper function to create subscription
export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })
}

// Helper function to create or retrieve customer
export async function createOrRetrieveCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // Try to find existing customer
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      userId
    }
  })
}

// Helper function to generate license key
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = []

  for (let i = 0; i < 4; i++) {
    let segment = ''
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }

  return segments.join('-')
}

// Product pricing tiers for individual purchases
export const PRODUCT_PRICING_TIERS = {
  basic: {
    name: 'Basic License',
    description: 'Personal and commercial use',
    multiplier: 1,
    features: ['High-quality files', 'Commercial license', 'Lifetime updates']
  },
  extended: {
    name: 'Extended License',
    description: 'Unlimited commercial use',
    multiplier: 3,
    features: ['High-quality files', 'Extended commercial license', 'Lifetime updates', 'Resale rights']
  }
}

// Webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
} as const
