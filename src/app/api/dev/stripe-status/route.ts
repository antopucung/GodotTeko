import { NextRequest, NextResponse } from 'next/server'

// Only allow in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true'

export async function GET(request: NextRequest) {
  // Security check - only in development
  if (!isDevelopment) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Import mock Stripe (only available in development)
    const { mockStripe, mockStripeHelpers } = await import('@/lib/mock-stripe')

    // Get current status
    const status = mockStripe.getStatus()
    const recentEvents = mockStripe.getEventLog().slice(-20) // Last 20 events
    const webhookQueue = mockStripe.getWebhookQueue()

    // Get access pass pricing for reference
    const accessPassPrices = mockStripeHelpers.getAccessPassPrices()

    return NextResponse.json({
      status: {
        ...status,
        mockMode: true,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      recentEvents,
      webhookQueue: webhookQueue.map(event => ({
        id: event.id,
        type: event.type,
        processed: event.processed,
        created: new Date(event.created * 1000).toISOString()
      })),
      config: {
        accessPassPrices,
        testCards: mockStripeHelpers.getTestCards()
      }
    })

  } catch (error) {
    console.error('Error getting mock Stripe status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
