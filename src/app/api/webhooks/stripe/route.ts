import { NextRequest, NextResponse } from 'next/server'
import { stripe, generateLicenseKey, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe'
import { client } from '@/lib/sanity'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Stripe webhook event:', event.type)

    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent
  const userId = metadata.userId
  const orderType = metadata.orderType

  if (!userId) {
    console.error('No userId in payment intent metadata')
    return
  }

  if (orderType === 'access_pass' && metadata.passType === 'lifetime') {
    // Handle lifetime access pass purchase
    await createLifetimeAccessPass(userId, paymentIntent)
  } else if (orderType === 'individual') {
    // Handle individual product purchase - this would be created from cart
    await createOrderFromPaymentIntent(userId, paymentIntent)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string

  if (!subscriptionId) return

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata.userId

  if (!userId) return

  // Update or create access pass for subscription renewal
  await updateAccessPassFromSubscription(userId, subscription, invoice)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  const passType = subscription.metadata.passType

  if (!userId || !passType) return

  await createSubscriptionAccessPass(userId, subscription)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId

  if (!userId) return

  await updateAccessPassStatus(userId, subscription)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId

  if (!userId) return

  // Mark access pass as cancelled
  const accessPass = await client.fetch(
    `*[_type == "accessPass" && user._ref == $userId && stripeSubscriptionId == $subscriptionId][0]`,
    { userId, subscriptionId: subscription.id }
  )

  if (accessPass) {
    await client
      .patch(accessPass._id)
      .set({
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      })
      .commit()
  }
}

async function createLifetimeAccessPass(userId: string, paymentIntent: Stripe.PaymentIntent) {
  const accessPassData = {
    _type: 'accessPass',
    user: {
      _type: 'reference',
      _ref: userId
    },
    passType: 'lifetime',
    status: 'active',
    stripeCustomerId: paymentIntent.customer as string,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: null, // Lifetime doesn't expire
    pricing: {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      interval: 'one_time'
    },
    usage: {
      totalDownloads: 0,
      downloadsThisPeriod: 0
    }
  }

  await client.create(accessPassData)
  console.log('Created lifetime access pass for user:', userId)
}

async function createSubscriptionAccessPass(userId: string, subscription: Stripe.Subscription) {
  const passType = subscription.metadata.passType
  const priceData = subscription.items.data[0].price

  const accessPassData = {
    _type: 'accessPass',
    user: {
      _type: 'reference',
      _ref: userId
    },
    passType,
    status: subscription.status,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    pricing: {
      amount: priceData.unit_amount || 0,
      currency: priceData.currency.toUpperCase(),
      interval: priceData.recurring?.interval || 'month'
    },
    usage: {
      totalDownloads: 0,
      downloadsThisPeriod: 0
    }
  }

  await client.create(accessPassData)
  console.log('Created subscription access pass for user:', userId)
}

async function updateAccessPassFromSubscription(userId: string, subscription: Stripe.Subscription, invoice: Stripe.Invoice) {
  const accessPass = await client.fetch(
    `*[_type == "accessPass" && user._ref == $userId && stripeSubscriptionId == $subscriptionId][0]`,
    { userId, subscriptionId: subscription.id }
  )

  if (accessPass) {
    await client
      .patch(accessPass._id)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
      })
      .commit()

    // Add renewal history entry
    if ((invoice as any).paid) {
      const renewalEntry = {
        renewedAt: new Date().toISOString(),
        amount: (invoice as any).amount_paid,
        stripeInvoiceId: invoice.id,
        periodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        periodEnd: new Date((subscription as any).current_period_end * 1000).toISOString()
      }

      await client
        .patch(accessPass._id)
        .setIfMissing({ renewalHistory: [] })
        .append('renewalHistory', [renewalEntry])
        .commit()
    }
  }
}

async function updateAccessPassStatus(userId: string, subscription: Stripe.Subscription) {
  const accessPass = await client.fetch(
    `*[_type == "accessPass" && user._ref == $userId && stripeSubscriptionId == $subscriptionId][0]`,
    { userId, subscriptionId: subscription.id }
  )

  if (accessPass) {
    await client
      .patch(accessPass._id)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
      })
      .commit()
  }
}

async function createOrderFromPaymentIntent(userId: string, paymentIntent: Stripe.PaymentIntent) {
  // Parse order items from metadata
  const { metadata } = paymentIntent
  let orderItems = []

  try {
    if (metadata.orderItems) {
      orderItems = JSON.parse(metadata.orderItems)
    }
  } catch (error) {
    console.error('Failed to parse order items from metadata:', error)
  }

  const orderNumber = `ORD-${Date.now()}`

  const orderData = {
    _type: 'order',
    orderNumber,
    user: {
      _type: 'reference',
      _ref: userId
    },
    items: orderItems.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      licenseType: item.licenseType || 'standard'
    })),
    orderType: 'individual',
    subtotal: paymentIntent.amount / 100,
    tax: 0,
    total: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: 'completed',
    paymentDetails: {
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: paymentIntent.customer as string,
      paymentMethod: 'card'
    },
    completedAt: new Date().toISOString()
  }

  const order = await client.create(orderData)
  console.log('Created order from payment intent:', order._id)

  // Create licenses for purchased products
  if (orderItems.length > 0) {
    const { createLicense } = await import('@/lib/file-delivery')

    for (const item of orderItems) {
      try {
        const licenseType = item.licenseType === 'extended' ? 'extended' : 'standard'

        await createLicense(
          userId,
          item.productId,
          order._id,
          licenseType
        )

        console.log(`Created ${licenseType} license for product ${item.productId}`)
      } catch (licenseError) {
        console.error(`Failed to create license for product ${item.productId}:`, licenseError)
        // Continue with other licenses even if one fails
      }
    }
  }

  return order
}
