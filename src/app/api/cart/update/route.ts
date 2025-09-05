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

    const { productId, quantity } = await request.json()

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 })
    }

    if (quantity < 0) {
      return NextResponse.json({ error: 'Quantity cannot be negative' }, { status: 400 })
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

    let updatedItems = cart.items || []

    if (quantity === 0) {
      // Remove item if quantity is 0
      updatedItems = updatedItems.filter(
        (item: any) => item.product._id !== productId
      )
    } else {
      // Update item quantity
      const itemIndex = updatedItems.findIndex(
        (item: any) => item.product._id === productId
      )

      if (itemIndex >= 0) {
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          quantity
        }
      } else {
        return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 })
      }
    }

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
      message: 'Cart updated successfully'
    })

  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}
