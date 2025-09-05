import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { PLATFORM_CONFIG } from '@/config/platform'

interface AnalyticsFilters {
  startDate?: string
  endDate?: string
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  partnerId?: string
  productId?: string
  country?: string
  paymentMethod?: string
  category?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract filter parameters
    const filters: AnalyticsFilters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      period: searchParams.get('period') as any || 'monthly',
      partnerId: searchParams.get('partnerId') || undefined,
      productId: searchParams.get('productId') || undefined,
      country: searchParams.get('country') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      category: searchParams.get('category') || undefined
    }

    // Default to last 30 days if no dates provided
    const endDate = filters.endDate || new Date().toISOString().split('T')[0]
    const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Build filter conditions for GROQ query
    let filterConditions = `_createdAt >= "${startDate}T00:00:00Z" && _createdAt <= "${endDate}T23:59:59Z"`

    if (filters.partnerId) {
      filterConditions += ` && participants.partner._ref == "${filters.partnerId}"`
    }

    if (filters.country) {
      filterConditions += ` && analytics.location.country == "${filters.country}"`
    }

    if (filters.paymentMethod) {
      filterConditions += ` && paymentProvider.metadata.paymentMethod == "${filters.paymentMethod}"`
    }

    // Execute parallel queries for comprehensive analytics
    const [
      revenueData,
      transactionMetrics,
      partnerAnalytics,
      productPerformance,
      geographicData,
      paymentMethodData,
      conversionData,
      recentActivity
    ] = await Promise.all([
      // Revenue Summary
      client.fetch(`
        {
          "totalRevenue": math::sum(*[_type == "transaction" && status == "completed" && ${filterConditions}].amount.gross),
          "netRevenue": math::sum(*[_type == "transaction" && status == "completed" && ${filterConditions}].amount.net),
          "platformRevenue": math::sum(*[_type == "transaction" && status == "completed" && ${filterConditions}].revenueDistribution.platformEarnings),
          "partnerRevenue": math::sum(*[_type == "transaction" && status == "completed" && ${filterConditions}].revenueDistribution.partnerEarnings),
          "refunds": math::sum(*[_type == "transaction" && type == "refund" && ${filterConditions}].amount.gross),
          "processingFees": math::sum(*[_type == "transaction" && status == "completed" && ${filterConditions}].amount.fees),
          "taxesCollected": math::sum(*[_type == "transaction" && status == "completed" && ${filterConditions}].amount.tax)
        }
      `),

      // Transaction Metrics
      client.fetch(`
        {
          "totalTransactions": count(*[_type == "transaction" && ${filterConditions}]),
          "successfulTransactions": count(*[_type == "transaction" && status == "completed" && ${filterConditions}]),
          "failedTransactions": count(*[_type == "transaction" && status == "failed" && ${filterConditions}]),
          "pendingTransactions": count(*[_type == "transaction" && status == "pending" && ${filterConditions}]),
          "averageTransactionValue": math::avg(*[_type == "transaction" && status == "completed" && ${filterConditions}].amount.gross),
          "medianTransactionValue": math::median(*[_type == "transaction" && status == "completed" && ${filterConditions}].amount.gross)
        }
      `),

      // Partner Analytics
      client.fetch(`
        *[_type == "transaction" && status == "completed" && ${filterConditions} && defined(participants.partner)] {
          "partnerId": participants.partner._ref,
          "partnerName": participants.partner->name,
          "earnings": revenueDistribution.partnerEarnings,
          "productId": order->items[0].product._ref,
          "productTitle": order->items[0].product->title
        } | {
          "partnerId": partnerId,
          "partnerName": partnerName,
          "totalEarnings": math::sum(earnings),
          "transactionCount": count(earnings),
          "averageEarning": math::avg(earnings)
        } | order(totalEarnings desc)[0...10]
      `),

      // Product Performance
      client.fetch(`
        *[_type == "order" && status == "completed" && ${filterConditions}] {
          items[] {
            "productId": product._ref,
            "productTitle": product->title,
            "price": price,
            "quantity": quantity,
            "revenue": price * quantity
          }
        }.items[] | {
          "productId": productId,
          "productTitle": productTitle,
          "totalRevenue": math::sum(revenue),
          "unitsSold": math::sum(quantity),
          "averagePrice": math::avg(price)
        } | order(totalRevenue desc)[0...10]
      `),

      // Geographic Distribution
      client.fetch(`
        *[_type == "transaction" && status == "completed" && ${filterConditions} && defined(analytics.location.country)] {
          "country": analytics.location.country,
          "revenue": amount.gross
        } | {
          "country": country,
          "totalRevenue": math::sum(revenue),
          "transactionCount": count(revenue),
          "averageTransactionValue": math::avg(revenue)
        } | order(totalRevenue desc)[0...15]
      `),

      // Payment Method Performance
      client.fetch(`
        *[_type == "transaction" && status == "completed" && ${filterConditions} && defined(paymentProvider.metadata.paymentMethod)] {
          "paymentMethod": paymentProvider.metadata.paymentMethod,
          "revenue": amount.gross,
          "success": status == "completed"
        } | {
          "paymentMethod": paymentMethod,
          "totalRevenue": math::sum(revenue),
          "transactionCount": count(revenue),
          "successCount": count(success[@ == true]),
          "successRate": count(success[@ == true]) / count(success) * 100
        } | order(totalRevenue desc)
      `),

      // Conversion Analytics
      client.fetch(`
        {
          "totalOrders": count(*[_type == "order" && ${filterConditions}]),
          "completedOrders": count(*[_type == "order" && status == "completed" && ${filterConditions}]),
          "failedOrders": count(*[_type == "order" && status == "failed" && ${filterConditions}]),
          "cancelledOrders": count(*[_type == "order" && status == "cancelled" && ${filterConditions}]),
          "newCustomers": count(*[_type == "transaction" && status == "completed" && analytics.isFirstPurchase == true && ${filterConditions}]),
          "returningCustomers": count(*[_type == "transaction" && status == "completed" && analytics.isFirstPurchase == false && ${filterConditions}])
        }
      `),

      // Recent Activity
      client.fetch(`
        *[_type == "transaction" && status == "completed" && ${filterConditions}] | order(_createdAt desc)[0...20] {
          _id,
          transactionId,
          type,
          "amount": amount.gross,
          "currency": amount.currency,
          "customerName": participants.customer->name,
          "partnerName": participants.partner->name,
          "productTitle": order->items[0].product->title,
          "country": analytics.location.country,
          "paymentMethod": paymentProvider.metadata.paymentMethod,
          _createdAt
        }
      `)
    ])

    // Calculate time series data based on period
    const timeSeriesData = await generateTimeSeriesData(startDate, endDate, filters.period, filterConditions)

    // Calculate growth rates
    const previousPeriodStart = getPreviousPeriodStart(startDate, endDate)
    const previousPeriodEnd = startDate

    const previousRevenueData = await client.fetch(`
      {
        "totalRevenue": math::sum(*[_type == "transaction" && status == "completed" &&
          _createdAt >= "${previousPeriodStart}T00:00:00Z" && _createdAt <= "${previousPeriodEnd}T23:59:59Z"
        ].amount.gross),
        "totalTransactions": count(*[_type == "transaction" && status == "completed" &&
          _createdAt >= "${previousPeriodStart}T00:00:00Z" && _createdAt <= "${previousPeriodEnd}T23:59:59Z"
        ])
      }
    `)

    // Calculate growth rates
    const revenueGrowth = previousRevenueData.totalRevenue > 0
      ? ((revenueData.totalRevenue - previousRevenueData.totalRevenue) / previousRevenueData.totalRevenue * 100)
      : 0

    const transactionGrowth = previousRevenueData.totalTransactions > 0
      ? ((transactionMetrics.totalTransactions - previousRevenueData.totalTransactions) / previousRevenueData.totalTransactions * 100)
      : 0

    // Calculate success rate
    const successRate = transactionMetrics.totalTransactions > 0
      ? (transactionMetrics.successfulTransactions / transactionMetrics.totalTransactions * 100)
      : 0

    // Calculate conversion rate
    const conversionRate = conversionData.totalOrders > 0
      ? (conversionData.completedOrders / conversionData.totalOrders * 100)
      : 0

    // Prepare response data
    const analyticsData = {
      summary: {
        totalRevenue: revenueData.totalRevenue || 0,
        netRevenue: revenueData.netRevenue || 0,
        platformRevenue: revenueData.platformRevenue || 0,
        partnerRevenue: revenueData.partnerRevenue || 0,
        refunds: revenueData.refunds || 0,
        processingFees: revenueData.processingFees || 0,
        taxesCollected: revenueData.taxesCollected || 0,
        totalTransactions: transactionMetrics.totalTransactions || 0,
        successfulTransactions: transactionMetrics.successfulTransactions || 0,
        failedTransactions: transactionMetrics.failedTransactions || 0,
        pendingTransactions: transactionMetrics.pendingTransactions || 0,
        averageTransactionValue: transactionMetrics.averageTransactionValue || 0,
        medianTransactionValue: transactionMetrics.medianTransactionValue || 0,
        successRate: successRate,
        conversionRate: conversionRate,
        revenueGrowth: revenueGrowth,
        transactionGrowth: transactionGrowth
      },
      trends: {
        timeSeriesData: timeSeriesData || [],
        revenueGrowth: revenueGrowth,
        transactionGrowth: transactionGrowth
      },
      partners: {
        topPartners: partnerAnalytics || [],
        totalActivePartners: partnerAnalytics?.length || 0,
        averagePartnerEarning: partnerAnalytics?.length > 0
          ? partnerAnalytics.reduce((sum: number, partner: any) => sum + partner.totalEarnings, 0) / partnerAnalytics.length
          : 0
      },
      products: {
        topProducts: productPerformance || [],
        totalProductsSold: productPerformance?.reduce((sum: number, product: any) => sum + product.unitsSold, 0) || 0
      },
      geography: {
        topCountries: geographicData || [],
        totalCountries: geographicData?.length || 0
      },
      paymentMethods: {
        breakdown: paymentMethodData || []
      },
      customers: {
        newCustomers: conversionData.newCustomers || 0,
        returningCustomers: conversionData.returningCustomers || 0,
        totalOrders: conversionData.totalOrders || 0,
        completedOrders: conversionData.completedOrders || 0,
        customerRetentionRate: conversionData.returningCustomers > 0 && conversionData.newCustomers > 0
          ? (conversionData.returningCustomers / (conversionData.newCustomers + conversionData.returningCustomers) * 100)
          : 0
      },
      recentActivity: recentActivity || [],
      filters: {
        startDate,
        endDate,
        period: filters.period,
        appliedFilters: Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        currency: 'USD', // From platform config
        dataSource: PLATFORM_CONFIG.development.enableDemoMode ? 'demo' : 'live',
        refreshInterval: 300000 // 5 minutes
      }
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to generate time series data
async function generateTimeSeriesData(startDate: string, endDate: string, period: string, filterConditions: string) {
  try {
    const groupByClause = getGroupByClause(period)

    return await client.fetch(`
      *[_type == "transaction" && status == "completed" && ${filterConditions}] {
        "date": _createdAt,
        "revenue": amount.gross,
        "transactions": 1
      } | order(date asc) | {
        "period": ${groupByClause},
        "totalRevenue": math::sum(revenue),
        "transactionCount": math::sum(transactions),
        "averageTransactionValue": math::avg(revenue)
      } | order(period asc)
    `)
  } catch (error) {
    console.error('Error generating time series data:', error)
    return []
  }
}

// Helper function to get GROQ group by clause based on period
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

// Helper function to calculate previous period start date
function getPreviousPeriodStart(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const periodLength = end.getTime() - start.getTime()
  const previousStart = new Date(start.getTime() - periodLength)
  return previousStart.toISOString().split('T')[0]
}
