import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'
import { LicenseManager } from '@/lib/license-manager'

// Import real or mock Stripe based on environment
let stripe: any
let createOrRetrieveCustomer: any
let generateLicenseKey: any

if (process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true') {
  const mockStripe = await import('@/lib/mock-stripe')
  stripe = mockStripe.mockStripe
  createOrRetrieveCustomer = mockStripe.mockStripe.createOrRetrieveCustomer.bind(mockStripe.mockStripe)
  generateLicenseKey = mockStripe.mockStripeHelpers.generateLicenseKey
} else {
  const realStripe = await import('@/lib/stripe')
  stripe = realStripe.stripe
  createOrRetrieveCustomer = realStripe.createOrRetrieveCustomer
  generateLicenseKey = realStripe.generateLicenseKey
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items, licenseType = 'basic' } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    // Fetch product details from Sanity
    const productIds = items.map((item: any) => item.productId)
    const products = await client.fetch(
      `*[_type == "product" && _id in $productIds] {
        _id,
        title,
        price,
        salePrice,
        freebie,
        downloadUrl
      }`,
      { productIds }
    )

    if (products.length !== items.length) {
      return NextResponse.json({ error: 'Some products not found' }, { status: 404 })
    }

    // Calculate total amount
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = products.find((p: any) => p._id === item.productId)
      if (!product) continue

      if (product.freebie) {
        // Handle free products separately
        const freeOrderData = {
          _type: 'order',
          orderNumber: `ORD-FREE-${Date.now()}`,
          user: {
            _type: 'reference',
            _ref: session.user.id
          },
          items: [{
            product: {
              _type: 'reference',
              _ref: item.productId
            },
            quantity: item.quantity,
            price: 0,
            discount: 0
          }],
          orderType: 'individual',
          subtotal: 0,
          tax: 0,
          total: 0,
          currency: 'USD',
          status: 'completed',
          completedAt: new Date().toISOString()
        }

        const freeOrder = await client.create(freeOrderData)

        // Generate license for free product
        await LicenseManager.generateLicense({
          userId: session.user.id,
          productId: item.productId,
          orderId: freeOrder._id,
          licenseType: 'basic',
          purchasePrice: 0,
          currency: 'USD'
        })

        continue
      }

      const price = product.salePrice || product.price
      const licenseMultiplier = licenseType === 'extended' ? 3 : 1
      const itemPrice = price * licenseMultiplier
      const itemTotal = itemPrice * item.quantity

      totalAmount += itemTotal

      orderItems.push({
        productId: item.productId,
        product: product,
        quantity: item.quantity,
        price: itemPrice,
        licenseType
      })
    }

    if (totalAmount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Free products added to your library',
        isFree: true
      })
    }

    // Create customer
    const customer = await createOrRetrieveCustomer(
      session.user.id,
      session.user.email!,
      session.user.name || undefined
    )

    // Create payment intent (mock or real)
    let paymentIntent: any

    if (process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true') {
      paymentIntent = await stripe.createPaymentIntent({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        customer: customer.id,
        metadata: {
          userId: session.user.id,
          orderType: 'individual',
          licenseType,
          itemCount: items.length.toString(),
          orderItems: JSON.stringify(orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            licenseType: item.licenseType
          })))
        },
        automatic_payment_methods: {
          enabled: true
        }
      })
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'usd',
        customer: customer.id,
        metadata: {
          userId: session.user.id,
          orderType: 'individual',
          licenseType,
          itemCount: items.length.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      items: orderItems,
      mockMode: process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true'
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
