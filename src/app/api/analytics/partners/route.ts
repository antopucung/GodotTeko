import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { PLATFORM_CONFIG } from '@/config/platform'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const partnerId = searchParams.get('partnerId')
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const period = searchParams.get('period') || 'monthly'

    // Build filter conditions
    let filterConditions = `_createdAt >= "${startDate}T00:00:00Z" && _createdAt <= "${endDate}T23:59:59Z"`

    if (partnerId) {
      filterConditions += ` && participants.partner._ref == "${partnerId}"`
    }

    // Execute comprehensive partner analytics queries
    const [
      partnerSummary,
      earningsBreakdown,
      topPartners,
      partnerPayouts,
      partnerProducts,
      earningsTrends
    ] = await Promise.all([
      // Partner Summary
      client.fetch(`
        {
          "totalPartners": count(*[_type == "user" && role == "partner"]),
          "activePartners": count(*[_type == "transaction" && status == "completed" && defined(participants.partner) && ${filterConditions}].participants.partner._ref),
          "totalEarnings": math::sum(*[_type == "transaction" && status == "completed" && defined(participants.partner) && ${filterConditions}].revenueDistribution.partnerEarnings),
          "averageCommissionRate": math::avg(*[_type == "transaction" && status == "completed" && defined(participants.partner) && ${filterConditions}].participants.platform.percentage),
          "totalCommissionsPaid": math::sum(*[_type == "partnerPayout" && status == "completed" && period.endDate >= "${startDate}" && period.startDate <= "${endDate}"].netPayout)
        }
      `),

      // Detailed Earnings Breakdown
      client.fetch(`
        *[_type == "transaction" && status == "completed" && defined(participants.partner) && ${filterConditions}] {
          "partnerId": participants.partner._ref,
          "partnerName": participants.partner->name,
          "partnerEmail": participants.partner->email,
          "earnings": revenueDistribution.partnerEarnings,
          "platformFee": revenueDistribution.platformEarnings,
          "transactionValue": amount.gross,
          "commissionRate": participants.platform.percentage,
          "productId": order->items[0].product._ref,
          "productTitle": order->items[0].product->title,
          "transactionDate": _createdAt
        } | {
          "partnerId": partnerId,
          "partnerName": partnerName,
          "partnerEmail": partnerEmail,
          "totalEarnings": math::sum(earnings),
          "totalTransactions": count(earnings),
          "averageEarning": math::avg(earnings),
          "totalRevenue": math::sum(transactionValue),
          "averageCommissionRate": math::avg(commissionRate),
          "topProducts": array::unique(productTitle)[0...5]
        } | order(totalEarnings desc)
      `),

      // Top Performing Partners
      client.fetch(`
        *[_type == "transaction" && status == "completed" && defined(participants.partner) && ${filterConditions}] {
          "partnerId": participants.partner._ref,
          "partnerName": participants.partner->name,
          "earnings": revenueDistribution.partnerEarnings,
          "transactionCount": 1
        } | {
          "partnerId": partnerId,
          "partnerName": partnerName,
          "totalEarnings": math::sum(earnings),
          "transactionCount": math::sum(transactionCount),
          "averagePerTransaction": math::avg(earnings)
        } | order(totalEarnings desc)[0...10]
      `),

      // Partner Payouts
      client.fetch(`
        *[_type == "partnerPayout" && period.endDate >= "${startDate}" && period.startDate <= "${endDate}"] | order(period.endDate desc) {
          _id,
          payoutId,
          "partnerName": partner->name,
          "partnerId": partner._ref,
          "grossEarnings": earnings.grossEarnings,
          "netPayout": netPayout,
          "totalTransactions": earnings.totalTransactions,
          "status": status,
          "periodType": period.type,
          "periodStart": period.startDate,
          "periodEnd": period.endDate,
          "processedAt": processing.processedAt,
          "paymentMethod": paymentMethod.type
        }
      `),

      // Partner Product Performance
      client.fetch(`
        *[_type == "transaction" && status == "completed" && defined(participants.partner) && ${filterConditions}] {
          "partnerId": participants.partner._ref,
          "partnerName": participants.partner->name,
          "productId": order->items[0].product._ref,
          "productTitle": order->items[0].product->title,
          "earnings": revenueDistribution.partnerEarnings,
          "units": order->items[0].quantity
        } | {
          "partnerId": partnerId,
          "partnerName": partnerName,
          "productId": productId,
          "productTitle": productTitle,
          "totalEarnings": math::sum(earnings),
          "unitsSold": math::sum(units),
          "averageEarningPerUnit": math::avg(earnings / units)
        } | order(totalEarnings desc)
      `),

      // Earnings Trends (Time Series)
      client.fetch(`
        *[_type == "transaction" && status == "completed" && defined(participants.partner) && ${filterConditions}] {
          "partnerId": participants.partner._ref,
          "earnings": revenueDistribution.partnerEarnings,
          "date": _createdAt
        } | {
          "period": ${getGroupByClause(period)},
          "totalEarnings": math::sum(earnings),
          "partnerCount": count(array::unique(partnerId)),
          "averageEarningPerPartner": math::sum(earnings) / count(array::unique(partnerId))
        } | order(period asc)
      `)
    ])

    // Calculate partner metrics
    const partnerMetrics = calculatePartnerMetrics(earningsBreakdown)

    // Get pending payouts
    const pendingPayouts = await client.fetch(`
      *[_type == "partnerPayout" && status == "pending"] {
        "partnerId": partner._ref,
        "partnerName": partner->name,
        "amount": netPayout,
        "dueDate": period.endDate
      } | order(dueDate asc)
    `)

    // Calculate next payout projections
    const nextPayoutProjections = await calculateNextPayoutProjections(startDate, endDate)

    const responseData = {
      summary: {
        totalPartners: partnerSummary.totalPartners || 0,
        activePartners: partnerSummary.activePartners || 0,
        totalEarnings: partnerSummary.totalEarnings || 0,
        averageCommissionRate: partnerSummary.averageCommissionRate || PLATFORM_CONFIG.partner.commissionRate,
        totalCommissionsPaid: partnerSummary.totalCommissionsPaid || 0,
        averageEarningPerPartner: partnerSummary.activePartners > 0
          ? (partnerSummary.totalEarnings / partnerSummary.activePartners)
          : 0
      },
      partners: {
        all: earningsBreakdown || [],
        topPerformers: topPartners || [],
        metrics: partnerMetrics
      },
      payouts: {
        recent: partnerPayouts || [],
        pending: pendingPayouts || [],
        projections: nextPayoutProjections
      },
      products: {
        performance: partnerProducts || []
      },
      trends: {
        earnings: earningsTrends || []
      },
      filters: {
        startDate,
        endDate,
        period,
        partnerId
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        currency: 'USD',
        commissionRate: PLATFORM_CONFIG.partner.commissionRate,
        payoutSchedule: PLATFORM_CONFIG.business.partnerPayoutSchedule
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching partner analytics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch partner analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for creating partner payouts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partnerId, periodType, startDate, endDate, manual = false } = body

    if (!partnerId || !periodType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate earnings for the period
    const earnings = await calculatePartnerEarnings(partnerId, startDate, endDate)

    if (earnings.grossEarnings === 0) {
      return NextResponse.json(
        { error: 'No earnings found for this period' },
        { status: 400 }
      )
    }

    // Create payout record
    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2)}`

    const payout = await client.create({
      _type: 'partnerPayout',
      _id: payoutId,
      payoutId,
      partner: { _type: 'reference', _ref: partnerId },
      period: {
        type: periodType,
        startDate,
        endDate
      },
      earnings: {
        grossEarnings: earnings.grossEarnings,
        totalTransactions: earnings.totalTransactions,
        averageCommissionRate: earnings.averageCommissionRate,
        topProducts: earnings.topProducts
      },
      deductions: {
        platformFees: earnings.platformFees || 0,
        chargebacks: earnings.chargebacks || 0,
        refunds: earnings.refunds || 0,
        adjustments: earnings.adjustments || 0,
        taxes: earnings.taxes || 0
      },
      netPayout: earnings.netPayout,
      currency: 'USD',
      status: 'pending',
      metadata: {
        createdAt: new Date().toISOString(),
        isRecurring: !manual,
        recurringSchedule: manual ? undefined : PLATFORM_CONFIG.business.partnerPayoutSchedule
      }
    })

    return NextResponse.json({
      success: true,
      payout,
      message: 'Payout created successfully'
    })

  } catch (error) {
    console.error('Error creating partner payout:', error)
    return NextResponse.json(
      {
        error: 'Failed to create payout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions
function getGroupByClause(period: string): string {
  switch (period) {
    case 'daily':
      return 'dateTime::format(date, "%Y-%m-%d")'
    case 'weekly':
      return 'dateTime::format(date, "%Y-W%W")'
    case 'monthly':
      return 'dateTime::format(date, "%Y-%m")'
    case 'quarterly':
      return 'dateTime::format(date, "%Y") + "-Q" + string(math::floor(dateTime::format(date, "%m") / 3) + 1)'
    case 'yearly':
      return 'dateTime::format(date, "%Y")'
    default:
      return 'dateTime::format(date, "%Y-%m")'
  }
}

function calculatePartnerMetrics(partnersData: any[]) {
  if (!partnersData || partnersData.length === 0) {
    return {
      averageEarnings: 0,
      medianEarnings: 0,
      topPercentileEarnings: 0,
      totalPartners: 0
    }
  }

  const earnings = partnersData.map(p => p.totalEarnings).sort((a, b) => a - b)
  const totalPartners = partnersData.length

  return {
    averageEarnings: earnings.reduce((sum, val) => sum + val, 0) / totalPartners,
    medianEarnings: earnings[Math.floor(totalPartners / 2)],
    topPercentileEarnings: earnings[Math.floor(totalPartners * 0.9)],
    totalPartners
  }
}

async function calculatePartnerEarnings(partnerId: string, startDate: string, endDate: string) {
  const transactions = await client.fetch(`
    *[_type == "transaction" && status == "completed" &&
      participants.partner._ref == "${partnerId}" &&
      _createdAt >= "${startDate}T00:00:00Z" &&
      _createdAt <= "${endDate}T23:59:59Z"
    ] {
      "earnings": revenueDistribution.partnerEarnings,
      "platformFee": revenueDistribution.platformEarnings,
      "productTitle": order->items[0].product->title,
      "commissionRate": participants.platform.percentage
    }
  `)

  const grossEarnings = transactions.reduce((sum: number, t: any) => sum + (t.earnings || 0), 0)
  const platformFees = transactions.reduce((sum: number, t: any) => sum + (t.platformFee || 0), 0)

  // Get product breakdown
  const productMap = new Map()
  transactions.forEach((t: any) => {
    const title = t.productTitle
    if (title) {
      productMap.set(title, (productMap.get(title) || 0) + t.earnings)
    }
  })

  const topProducts = Array.from(productMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([title, earnings]) => ({ product: title, earnings }))

  return {
    grossEarnings,
    totalTransactions: transactions.length,
    averageCommissionRate: transactions.length > 0
      ? transactions.reduce((sum: number, t: any) => sum + (t.commissionRate || 0), 0) / transactions.length
      : PLATFORM_CONFIG.partner.commissionRate,
    topProducts,
    platformFees,
    chargebacks: 0, // TODO: Calculate from chargeback data
    refunds: 0, // TODO: Calculate from refund data
    adjustments: 0, // Manual adjustments
    taxes: 0, // Tax withholdings
    netPayout: grossEarnings // After deductions
  }
}

async function calculateNextPayoutProjections(startDate: string, endDate: string) {
  // This would calculate projected payouts based on current trends
  // For now, return empty array
  return []
}
