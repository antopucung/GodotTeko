import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { client } from '@/lib/sanity'
import { PLATFORM_CONFIG } from '@/config/platform'
import { v4 as uuidv4 } from 'uuid'

// Configuration for data generation - now using centralized config
const DATA_CONFIG = {
  timeRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date(),
  },
  volumes: PLATFORM_CONFIG.dataGeneration.orders,
  pricing: {
    platformFeeRate: PLATFORM_CONFIG.partner.platformFeeRate,
    processingFeeRate: PLATFORM_CONFIG.partner.processingFeeRate,
    partnerCommissionRate: PLATFORM_CONFIG.partner.commissionRate / 100, // Convert percentage to decimal
  },
  geography: PLATFORM_CONFIG.dataGeneration.geography,
  paymentMethods: PLATFORM_CONFIG.dataGeneration.paymentMethods,
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !isAdmin(session.user.role as string)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { type, count } = await request.json()

    if (type === 'realistic-orders') {
      const result = await generateRealisticOrders(count || DATA_CONFIG.volumes.defaultCount)
      return NextResponse.json({
        success: true,
        message: `Generated ${result.ordersCreated} orders with ${result.transactionsCreated} transactions`,
        data: result
      })
    }

    if (type === 'revenue-analytics') {
      const result = await generateRevenueAnalytics()
      return NextResponse.json({
        success: true,
        message: `Generated revenue analytics for ${result.periodsGenerated} periods`,
        data: result
      })
    }

    if (type === 'all-transaction-data') {
      const orders = await generateRealisticOrders(DATA_CONFIG.volumes.defaultCount)
      const analytics = await generateRevenueAnalytics()

      return NextResponse.json({
        success: true,
        message: `Generated complete transaction ecosystem`,
        data: {
          orders: orders.ordersCreated,
          transactions: orders.transactionsCreated,
          analyticsCards: analytics.periodsGenerated,
          totalRevenue: orders.totalRevenue
        }
      })
    }

    return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 })

  } catch (error) {
    console.error('Error generating data:', error)
    return NextResponse.json(
      { error: 'Failed to generate data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function generateRealisticOrders(targetCount: number) {
  const stats = {
    ordersCreated: 0,
    transactionsCreated: 0,
    totalRevenue: 0
  }

  // Get existing data for realistic generation
  const [users, products] = await Promise.all([
    client.fetch(`*[_type == "user" && role == "user"][0...50] {
      _id, name, email
    }`),
    client.fetch(`*[_type == "product"][0...30] {
      _id, title, price, salePrice, freebie,
      "author": author-> { _id, name }
    }`)
  ])

  if (users.length === 0 || products.length === 0) {
    throw new Error('Insufficient seed data. Need at least some users and products.')
  }

  const orders = []
  const transactions = []

  for (let i = 0; i < targetCount; i++) {
    const orderData = await generateSingleOrder(users, products, i)
    orders.push(orderData.order)
    transactions.push(...orderData.transactions)

    stats.ordersCreated++
    stats.transactionsCreated += orderData.transactions.length
    stats.totalRevenue += orderData.order.pricing.total
  }

  // Batch create in Sanity
  const mutations = [
    ...orders.map(order => ({ create: order })),
    ...transactions.map(transaction => ({ create: transaction }))
  ]

  await client.mutate(mutations)

  return stats
}

async function generateSingleOrder(users: any[], products: any[], index: number) {
  // Select random user and timing
  const user = users[Math.floor(Math.random() * users.length)]
  const orderDate = randomDateBetween(DATA_CONFIG.timeRange.startDate, DATA_CONFIG.timeRange.endDate)

  // Determine number of items (weighted towards 1-2 items)
  const itemCount = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3
  const selectedProducts = getRandomProducts(products, itemCount)

  // Generate geography and payment method
  const location = weightedRandom(DATA_CONFIG.geography)
  const paymentMethod = weightedRandom(DATA_CONFIG.paymentMethods)

  // Calculate pricing
  let subtotal = 0
  const orderItems = selectedProducts.map(product => {
    const price = product.salePrice || product.price
    subtotal += price

    return {
      product: { _type: 'reference', _ref: product._id },
      quantity: 1,
      price: product.price,
      salePrice: product.salePrice,
      partnerCommission: {
        rate: DATA_CONFIG.pricing.partnerCommissionRate * 100,
        amount: price * DATA_CONFIG.pricing.partnerCommissionRate,
        partner: { _type: 'reference', _ref: product.author._id }
      }
    }
  })

  const tax = subtotal * 0.08 // 8% average tax
  const total = subtotal + tax
  const processingFee = total * DATA_CONFIG.pricing.processingFeeRate
  const platformFee = subtotal * DATA_CONFIG.pricing.platformFeeRate
  const partnerEarnings = subtotal * DATA_CONFIG.pricing.partnerCommissionRate

  // Determine order status and success
  const isSuccessful = Math.random() < DATA_CONFIG.volumes.successRate
  const isRefunded = isSuccessful && Math.random() < DATA_CONFIG.volumes.refundRate

  const orderNumber = `ORD-${Date.now()}-${String(index).padStart(4, '0')}`
  const status = isRefunded ? 'refunded' : isSuccessful ? 'completed' : 'failed'

  // Create order
  const order = {
    _type: 'order',
    orderNumber,
    user: { _type: 'reference', _ref: user._id },
    items: orderItems,
    orderType: selectedProducts.every(p => p.freebie) ? 'free' : 'purchase',
    pricing: {
      subtotal,
      tax,
      discount: 0,
      total,
      currency: location.currency || 'USD'
    },
    status,
    paymentDetails: {
      stripePaymentIntentId: `pi_${generateRandomString(24)}`,
      paymentMethod: paymentMethod.method,
      last4: Math.floor(Math.random() * 9000 + 1000).toString(),
      brand: paymentMethod.method === 'card' ?
        paymentMethod.brands[Math.floor(Math.random() * paymentMethod.brands.length)] :
        paymentMethod.method,
      country: location.country
    },
    fulfillment: {
      downloadTokens: orderItems.map(item => ({
        productId: item.product._ref,
        token: `dl_${generateRandomString(32)}`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        downloadCount: 0,
        maxDownloads: 10
      })),
      licenseKeys: orderItems.map(item => ({
        productId: item.product._ref,
        licenseKey: `LIC-${generateRandomString(12).toUpperCase()}`,
        licenseType: 'standard'
      }))
    },
    analytics: {
      referralSource: weightedRandom([
        { value: 'organic', weight: 0.3 },
        { value: 'google', weight: 0.25 },
        { value: 'social', weight: 0.15 },
        { value: 'direct', weight: 0.15 },
        { value: 'email', weight: 0.1 },
        { value: 'affiliate', weight: 0.05 }
      ]).value,
      userAgent: 'Mozilla/5.0 (generated)',
      ipAddress: generateRandomIP(),
      location: {
        country: location.country,
        city: generateRandomCity(),
        timezone: 'UTC'
      }
    },
    timestamps: {
      placedAt: orderDate.toISOString(),
      paidAt: isSuccessful ? new Date(orderDate.getTime() + 2 * 60 * 1000).toISOString() : null,
      completedAt: isSuccessful ? new Date(orderDate.getTime() + 5 * 60 * 1000).toISOString() : null,
      cancelledAt: !isSuccessful ? new Date(orderDate.getTime() + 10 * 60 * 1000).toISOString() : null,
      refundedAt: isRefunded ? new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toISOString() : null
    },
    _createdAt: orderDate.toISOString()
  }

  // Create related transactions
  const orderTransactions = []

  // Main payment transaction
  if (isSuccessful) {
    orderTransactions.push({
      _type: 'transaction',
      transactionId: `txn_${generateRandomString(24)}`,
      order: { _type: 'reference', _ref: 'temp-order-id' }, // Will be updated after order creation
      type: 'payment',
      status: 'completed',
      amount: {
        gross: total,
        net: total - processingFee,
        fees: processingFee,
        tax,
        currency: location.currency || 'USD'
      },
      participants: {
        customer: { _type: 'reference', _ref: user._id },
        partner: { _type: 'reference', _ref: selectedProducts[0].author._id },
        platform: {
          amount: platformFee,
          percentage: DATA_CONFIG.pricing.platformFeeRate * 100
        }
      },
      paymentProvider: {
        provider: 'stripe',
        externalId: `pi_${generateRandomString(24)}`,
        processingFee,
        metadata: {
          paymentMethod: paymentMethod.method,
          cardBrand: order.paymentDetails.brand,
          cardLast4: order.paymentDetails.last4
        }
      },
      revenueDistribution: {
        partnerEarnings,
        platformEarnings: platformFee,
        affiliateEarnings: 0,
        taxAmount: tax,
        processingCosts: processingFee
      },
      timestamps: {
        initiatedAt: orderDate.toISOString(),
        authorizedAt: new Date(orderDate.getTime() + 1 * 60 * 1000).toISOString(),
        capturedAt: new Date(orderDate.getTime() + 2 * 60 * 1000).toISOString(),
        settledAt: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      _createdAt: orderDate.toISOString()
    })

    // Refund transaction if applicable
    if (isRefunded) {
      orderTransactions.push({
        _type: 'transaction',
        transactionId: `rfnd_${generateRandomString(24)}`,
        order: { _type: 'reference', _ref: 'temp-order-id' },
        type: 'refund',
        status: 'completed',
        amount: {
          gross: -total,
          net: -total,
          fees: 0,
          tax: -tax,
          currency: location.currency || 'USD'
        },
        participants: {
          customer: { _type: 'reference', _ref: user._id },
          partner: { _type: 'reference', _ref: selectedProducts[0].author._id }
        },
        paymentProvider: {
          provider: 'stripe',
          externalId: `re_${generateRandomString(24)}`,
          processingFee: 0
        },
        timestamps: {
          initiatedAt: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(orderDate.getTime() + 25 * 60 * 60 * 1000).toISOString()
        },
        _createdAt: new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
      })
    }
  }

  return {
    order,
    transactions: orderTransactions
  }
}

async function generateRevenueAnalytics() {
  const stats = { periodsGenerated: 0 }

  // Generate monthly analytics for the past 12 months
  const analytics = []
  const endDate = new Date()

  for (let i = 11; i >= 0; i--) {
    const periodStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
    const periodEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0)

    const monthlyData = await generateMonthlyAnalytics(periodStart, periodEnd)
    analytics.push(monthlyData)
    stats.periodsGenerated++
  }

  // Batch create analytics
  const mutations = analytics.map(data => ({ create: data }))
  await client.mutate(mutations)

  return stats
}

async function generateMonthlyAnalytics(startDate: Date, endDate: Date) {
  // This would normally aggregate real transaction data
  // For demo purposes, we'll generate realistic numbers
  const baseRevenue = 15000 + Math.random() * 25000 // $15k-40k per month
  const transactionCount = 80 + Math.floor(Math.random() * 120) // 80-200 transactions

  return {
    _type: 'revenueAnalytics',
    period: {
      type: 'monthly',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1
    },
    totals: {
      grossRevenue: baseRevenue,
      netRevenue: baseRevenue * 0.91, // After processing fees
      platformRevenue: baseRevenue * 0.15,
      partnerRevenue: baseRevenue * 0.70,
      refunds: baseRevenue * 0.05,
      chargebacks: baseRevenue * 0.01,
      processingFees: baseRevenue * 0.029,
      taxesCollected: baseRevenue * 0.08
    },
    transactions: {
      totalCount: transactionCount,
      successfulCount: Math.floor(transactionCount * 0.94),
      failedCount: Math.floor(transactionCount * 0.06),
      refundCount: Math.floor(transactionCount * 0.05),
      averageValue: baseRevenue / transactionCount,
      medianValue: (baseRevenue / transactionCount) * 0.85,
      successRate: 94
    },
    customers: {
      totalCustomers: Math.floor(transactionCount * 0.75), // Some repeat customers
      newCustomers: Math.floor(transactionCount * 0.45),
      returningCustomers: Math.floor(transactionCount * 0.30),
      averageLifetimeValue: 245,
      averageOrderValue: baseRevenue / transactionCount,
      repeatPurchaseRate: 30
    },
    trends: {
      revenueGrowth: -5 + Math.random() * 25, // -5% to +20% growth
      transactionGrowth: -3 + Math.random() * 20,
      customerGrowth: -2 + Math.random() * 15,
      averageOrderValueTrend: -10 + Math.random() * 20,
      projectedRevenue: baseRevenue * (1 + (Math.random() * 0.2 - 0.05))
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'system',
      dataSource: 'demo',
      version: '1.0'
    },
    _createdAt: endDate.toISOString()
  }
}

// Utility functions
function weightedRandom(items: any[]) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item
  }

  return items[items.length - 1]
}

function getRandomProducts(products: any[], count: number) {
  const shuffled = [...products].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function randomDateBetween(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generateRandomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function generateRandomCity() {
  const cities = ['New York', 'London', 'Paris', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Stockholm', 'Amsterdam']
  return cities[Math.floor(Math.random() * cities.length)]
}
