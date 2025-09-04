import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// Get user's cart
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch cart from Sanity
    const cart = await client.fetch(
      `*[_type == "cart" && user._ref == $userId][0] {
        _id,
        items[] {
          product-> {
            _id,
            title,
            slug,
            price,
            salePrice,
            "image": images[0].asset->url,
            freebie
          },
          quantity,
          addedAt
        },
        updatedAt
      }`,
      { userId: session.user.id }
    )

    if (!cart) {
      return NextResponse.json({ items: [] })
    }

    // Transform cart items to match frontend format
    const transformedItems = cart.items?.map((item: any) => ({
      id: `${item.product._id}-${item.addedAt}`,
      product: item.product,
      quantity: item.quantity,
      addedAt: item.addedAt
    })) || []

    return NextResponse.json({ items: transformedItems })

  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// Create or update user's cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items } = await request.json()

    // Check if cart exists
    const existingCart = await client.fetch(
      `*[_type == "cart" && user._ref == $userId][0] { _id }`,
      { userId: session.user.id }
    )

    const cartData = {
      _type: 'cart',
      user: {
        _type: 'reference',
        _ref: session.user.id
      },
      items: items.map((item: any) => ({
        product: {
          _type: 'reference',
          _ref: item.product._id
        },
        quantity: item.quantity,
        addedAt: item.addedAt
      })),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }

    let result
    if (existingCart) {
      // Update existing cart
      result = await client
        .patch(existingCart._id)
        .set({
          items: cartData.items,
          updatedAt: cartData.updatedAt
        })
        .commit()
    } else {
      // Create new cart
      result = await client.create(cartData)
    }

    return NextResponse.json({ success: true, cartId: result._id })

  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

// Clear user's cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find and delete cart
    const cart = await client.fetch(
      `*[_type == "cart" && user._ref == $userId][0] { _id }`,
      { userId: session.user.id }
    )

    if (cart) {
      await client.delete(cart._id)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
