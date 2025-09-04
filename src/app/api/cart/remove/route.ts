import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get cart
    const cart = await client.fetch(
      `*[_type == "cart" && user._ref == $userId][0] {
        _id,
        items[] {
          product-> { _id },
          quantity,
          addedAt
        }
      }`,
      { userId: session.user.id }
    )

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    // Remove item from cart
    const updatedItems = cart.items?.filter(
      (item: any) => item.product._id !== productId
    ) || []

    // Update cart
    await client
      .patch(cart._id)
      .set({
        items: updatedItems,
        updatedAt: new Date().toISOString()
      })
      .commit()

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart'
    })

  } catch (error) {
    console.error('Error removing item from cart:', error)
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    )
  }
}
