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

    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Verify product exists
    const product = await client.fetch(
      `*[_type == "product" && _id == $productId][0] { _id, title, price }`,
      { productId }
    )

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get or create cart
    let cart = await client.fetch(
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

    const newItem = {
      product: {
        _type: 'reference',
        _ref: productId
      },
      quantity,
      addedAt: new Date().toISOString()
    }

    if (!cart) {
      // Create new cart
      const cartData = {
        _type: 'cart',
        user: {
          _type: 'reference',
          _ref: session.user.id
        },
        items: [newItem],
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      cart = await client.create(cartData)
    } else {
      // Check if product already exists in cart
      const existingItemIndex = cart.items?.findIndex(
        (item: any) => item.product._id === productId
      )

      const updatedItems = cart.items || []

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        }
      } else {
        // Add new item
        updatedItems.push(newItem)
      }

      // Update cart
      await client
        .patch(cart._id)
        .set({
          items: updatedItems,
          updatedAt: new Date().toISOString()
        })
        .commit()
    }

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      cartId: cart._id
    })

  } catch (error) {
    console.error('Error adding item to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}
