import { NextRequest, NextResponse } from 'next/server'

// Only allow in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true'

export async function POST(request: NextRequest) {
  // Security check - only in development
  if (!isDevelopment) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Import mock Stripe (only available in development)
    const { mockStripeHelpers } = await import('@/lib/mock-stripe')

    // Clear all mock data
    mockStripeHelpers.clearAllData()

    return NextResponse.json({
      success: true,
      message: 'All mock Stripe data cleared',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error clearing mock Stripe data:', error)
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    )
  }
}
