import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentIntentId } = params

    // Fetch order by payment intent ID
    const order = await client.fetch(
      `*[_type == "order" && paymentDetails.stripePaymentIntentId == $paymentIntentId && user._ref == $userId][0] {
        _id,
        orderNumber,
        items[] {
          product-> {
            _id,
            title,
            "image": images[0].asset->url
          },
          quantity,
          price,
          discount
        },
        orderType,
        subtotal,
        tax,
        total,
        currency,
        status,
        paymentDetails,
        licenses[] {
          _id,
          licenseKey,
          product-> {
            _id,
            title
          },
          licenseType
        },
        completedAt,
        _createdAt
      }`,
      { paymentIntentId, userId: session.user.id }
    )

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })

  } catch (error) {
    console.error('Error fetching order by payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
