import { NextRequest, NextResponse } from 'next/server'

// Only allow in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true'

export async function POST(request: NextRequest) {
  // Security check - only in development
  if (!isDevelopment) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { scenario } = await request.json()

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario required' }, { status: 400 })
    }

    // Import mock Stripe helpers
    const { mockStripe, mockStripeHelpers } = await import('@/lib/mock-stripe')

    let result: any = {}

    switch (scenario) {
      case 'successful_purchase':
        result = await runSuccessfulPurchaseScenario()
        break

      case 'failed_payment':
        result = await runFailedPaymentScenario()
        break

      case 'subscription_flow':
        result = await runSubscriptionScenario()
        break

      case 'access_pass_flow':
        result = await runAccessPassScenario()
        break

      default:
        return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      scenario,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error running test scenario:', error)
    return NextResponse.json(
      { error: 'Failed to run scenario', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function runSuccessfulPurchaseScenario() {
  const { mockStripe, mockStripeHelpers } = await import('@/lib/mock-stripe')

  // Create test scenario
  const testData = mockStripe.createTestScenario('successful_purchase')

  // Simulate payment confirmation with success card
  await mockStripe.confirmPaymentIntent(testData.paymentIntent!.id, {
    card: { number: mockStripeHelpers.getTestCards().SUCCESS }
  })

  return {
    customer: testData.customer,
    paymentIntent: testData.paymentIntent,
    status: 'Payment confirmed successfully'
  }
}

async function runFailedPaymentScenario() {
  const { mockStripe, mockStripeHelpers } = await import('@/lib/mock-stripe')

  // Create test customer and payment intent
  const customer = mockStripe.createMockCustomer({
    email: 'test.fail@ui8clone.dev',
    name: 'Test Fail User'
  })

  const paymentIntent = await mockStripe.createPaymentIntent({
    amount: 2900, // $29
    currency: 'usd',
    customer: customer.id,
    metadata: { scenario: 'test_failure' }
  })

  // Try to confirm with decline card - this should throw an error
  try {
    await mockStripe.confirmPaymentIntent(paymentIntent.id, {
      card: { number: mockStripeHelpers.getTestCards().DECLINE_INSUFFICIENT_FUNDS }
    })
  } catch (error) {
    return {
      customer,
      paymentIntent,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'Payment failed as expected'
    }
  }

  return {
    customer,
    paymentIntent,
    status: 'Payment unexpectedly succeeded'
  }
}

async function runSubscriptionScenario() {
  const { mockStripe } = await import('@/lib/mock-stripe')

  // Create test scenario
  const testData = mockStripe.createTestScenario('subscription_flow')

  // Simulate subscription activation
  mockStripe.simulateSubscriptionRenewal(testData.subscription!.id)

  return {
    customer: testData.customer,
    subscription: testData.subscription,
    status: 'Subscription flow completed'
  }
}

async function runAccessPassScenario() {
  const { mockStripeHelpers } = await import('@/lib/mock-stripe')

  // Test all three access pass types
  const results = []

  const passTypes = ['monthly', 'yearly', 'lifetime'] as const

  for (const passType of passTypes) {
    const result = await mockStripeHelpers.simulateAccessPassSubscription({
      userId: `test_user_${passType}`,
      passType,
      email: `test.${passType}@ui8clone.dev`,
      name: `Test ${passType} User`
    })

    results.push({
      passType,
      result,
      status: `${passType} access pass created`
    })
  }

  return {
    results,
    status: 'All access pass types tested'
  }
}
