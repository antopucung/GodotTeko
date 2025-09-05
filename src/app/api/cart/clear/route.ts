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

    // Get cart
    const cart = await client.fetch(
      `*[_type == "cart" && user._ref == $userId][0] { _id }`,
      { userId: session.user.id }
    )

    if (!cart) {
      return NextResponse.json({
        success: true,
        message: 'Cart is already empty'
      })
    }

    // Clear cart by setting items to empty array
    await client
      .patch(cart._id)
      .set({
        items: [],
        updatedAt: new Date().toISOString()
      })
      .commit()

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
