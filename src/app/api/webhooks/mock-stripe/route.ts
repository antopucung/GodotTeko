import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { LicenseManager } from '@/lib/license-manager'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    console.log('Mock Stripe webhook received:', type)

    switch (type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(data.object)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data.object)
        break

      default:
        console.log(`Unhandled mock webhook event type: ${type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Mock webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const { metadata, amount, currency, id: paymentIntentId, customer } = paymentIntent
  const userId = metadata.userId
  const orderType = metadata.orderType

  if (!userId) {
    console.error('No userId in payment intent metadata')
    return
  }

  console.log(`Processing payment success for user ${userId}, type: ${orderType}`)

  if (orderType === 'access_pass' && metadata.passType === 'lifetime') {
    // Handle lifetime access pass purchase
    await createLifetimeAccessPass(userId, paymentIntent)
  } else if (orderType === 'individual') {
    // Handle individual product purchase
    await createOrderFromPaymentIntent(userId, paymentIntent)
  }
}

async function handleSubscriptionCreated(subscription: any) {
  const userId = subscription.metadata.userId
  const passType = subscription.metadata.passType

  if (!userId || !passType) return

  console.log(`Creating subscription access pass for user ${userId}, type: ${passType}`)

  const priceData = subscription.items.data[0].price

  await LicenseManager.createAccessPass({
    userId,
    passType,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    pricing: {
      amount: priceData.unit_amount || 0,
      currency: priceData.currency.toUpperCase(),
      interval: priceData.recurring?.interval || 'month'
    },
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
  })
}

async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata.userId

  if (!userId) return

  console.log(`Updating subscription for user ${userId}`)

  const accessPass = await client.fetch(
    `*[_type == "accessPass" && user._ref == $userId && stripeSubscriptionId == $subscriptionId][0]`,
    { userId, subscriptionId: subscription.id }
  )

  if (accessPass) {
    await client
      .patch(accessPass._id)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      })
      .commit()
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata.userId

  if (!userId) return

  console.log(`Cancelling subscription for user ${userId}`)

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

async function createLifetimeAccessPass(userId: string, paymentIntent: any) {
  console.log(`Creating lifetime access pass for user ${userId}`)

  await LicenseManager.createAccessPass({
    userId,
    passType: 'lifetime',
    stripeCustomerId: paymentIntent.customer,
    pricing: {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      interval: undefined
    },
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: undefined // Lifetime doesn't expire
  })
}

async function createOrderFromPaymentIntent(userId: string, paymentIntent: any) {
  console.log(`Creating order from payment intent for user ${userId}`)

  const { metadata, amount, currency, id: paymentIntentId } = paymentIntent

  // Parse order items from metadata if available
  let orderItems = []
  try {
    if (metadata.orderItems) {
      orderItems = JSON.parse(metadata.orderItems)
    }
  } catch (error) {
    console.error('Failed to parse order items from metadata:', error)
    // Fallback: we'll need to recreate the order from the amount
    return
  }

  if (orderItems.length === 0) {
    console.warn('No order items found in payment intent metadata')
    return
  }

  // Create the order
  const orderNumber = `ORD-${Date.now()}`
  const orderData = {
    _type: 'order',
    orderNumber,
    user: {
      _type: 'reference',
      _ref: userId
    },
    items: orderItems.map((item: any) => ({
      product: {
        _type: 'reference',
        _ref: item.productId
      },
      quantity: item.quantity,
      price: item.price,
      discount: 0
    })),
    orderType: 'individual',
    subtotal: amount / 100, // Convert from cents
    tax: 0,
    total: amount / 100,
    currency: currency.toUpperCase(),
    status: 'completed',
    paymentDetails: {
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: paymentIntent.customer,
      paymentMethod: 'card'
    },
    completedAt: new Date().toISOString()
  }

  const order = await client.create(orderData)
  console.log('Created order:', order._id)

  // Generate licenses for each item
  const licenses = await LicenseManager.generateOrderLicenses({
    userId,
    orderId: order._id,
    items: orderItems.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      licenseType: item.licenseType || 'basic'
    })),
    currency: currency.toUpperCase(),
    stripePaymentIntentId: paymentIntentId
  })

  console.log(`Generated ${licenses.length} licenses for order ${order._id}`)

  return order
}
