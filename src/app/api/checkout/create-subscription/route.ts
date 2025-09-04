import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { stripe, createOrRetrieveCustomer, ACCESS_PASS_PRICES } from '@/lib/stripe'
import { client } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { passType } = await request.json()

    if (!passType || !ACCESS_PASS_PRICES[passType as keyof typeof ACCESS_PASS_PRICES]) {
      return NextResponse.json({ error: 'Invalid pass type' }, { status: 400 })
    }

    // Check if user already has an active pass
    const existingPass = await client.fetch(
      `*[_type == "accessPass" && user._ref == $userId && status == "active"][0]`,
      { userId: session.user.id }
    )

    if (existingPass) {
      return NextResponse.json({
        error: 'User already has an active access pass'
      }, { status: 400 })
    }

    const passConfig = ACCESS_PASS_PRICES[passType as keyof typeof ACCESS_PASS_PRICES]

    // Create Stripe customer
    const customer = await createOrRetrieveCustomer(
      session.user.id,
      session.user.email!,
      session.user.name || undefined
    )

    if (passType === 'lifetime') {
      // One-time payment for lifetime access
      let paymentIntent: any

      if (process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true') {
        paymentIntent = await (stripe as any).createPaymentIntent({
          amount: passConfig.price,
          currency: 'usd',
          customer: customer.id,
          metadata: {
            userId: session.user.id,
            orderType: 'access_pass',
            passType: 'lifetime'
          },
          automatic_payment_methods: {
            enabled: true
          }
        })
      } else {
        paymentIntent = await stripe.paymentIntents.create({
          amount: passConfig.price,
          currency: 'usd',
          customer: customer.id,
          metadata: {
            userId: session.user.id,
            orderType: 'access_pass',
            passType: 'lifetime'
          },
          automatic_payment_methods: {
            enabled: true,
          },
        })
      }

      return NextResponse.json({
        type: 'payment_intent',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: passConfig.price / 100,
        passType: 'lifetime',
        mockMode: process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true'
      })
    } else {
      // Recurring subscription for monthly/yearly
      let subscription: any

      if (process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true') {
        // Create mock price ID
        const priceId = `price_mock_${passType}_${Date.now()}`

        subscription = await (stripe as any).createSubscription({
          customer: customer.id,
          items: [{ price: priceId }],
          metadata: {
            userId: session.user.id,
            passType
          },
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' }
        })

        // For mock mode, create a mock payment intent for the subscription
        const mockPaymentIntent = {
          id: `pi_mock_sub_${Date.now()}`,
          client_secret: `pi_mock_sub_${Date.now()}_secret`
        }

        return NextResponse.json({
          type: 'subscription',
          subscriptionId: subscription.id,
          clientSecret: mockPaymentIntent.client_secret,
          paymentIntentId: mockPaymentIntent.id,
          amount: passConfig.price / 100,
          passType,
          interval: passConfig.interval,
          mockMode: true
        })
      } else {
        // Real Stripe implementation
        const price = await stripe.prices.create({
          unit_amount: passConfig.price,
          currency: 'usd',
          recurring: {
            interval: passConfig.interval as 'month' | 'year',
          },
          product_data: {
            name: passConfig.name,
            metadata: {
              type: 'access_pass',
              passType,
              description: passConfig.description
            }
          },
          metadata: {
            passType,
            type: 'access_pass'
          }
        })

        subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: price.id }],
          metadata: {
            userId: session.user.id,
            passType
          },
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        })

        const invoice = subscription.latest_invoice as any
        const paymentIntent = invoice.payment_intent

        return NextResponse.json({
          type: 'subscription',
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: passConfig.price / 100,
          passType,
          interval: passConfig.interval,
          mockMode: false
        })
      }
    }

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
