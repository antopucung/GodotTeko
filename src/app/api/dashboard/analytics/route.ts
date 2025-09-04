import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const metric = searchParams.get('metric') || 'overview'

    const userRole = (session.user as any).role || 'user'

    if (metric === 'overview') {
      return await getOverviewAnalytics(session.user.id, userRole, parseInt(period))
    }

    if (metric === 'revenue' && (userRole === 'partner' || userRole === 'admin')) {
      return await getRevenueAnalytics(session.user.id, userRole, parseInt(period))
    }

    if (metric === 'transactions') {
      return await getTransactionAnalytics(session.user.id, userRole, parseInt(period))
    }

    if (metric === 'products' && (userRole === 'partner' || userRole === 'admin')) {
      return await getProductAnalytics(session.user.id, userRole, parseInt(period))
    }

    return NextResponse.json({ error: 'Invalid metric or insufficient permissions' }, { status: 400 })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

async function getOverviewAnalytics(userId: string, userRole: string, periodDays: number) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  let overviewData

  if (userRole === 'admin') {
    // Admin gets platform-wide analytics
    overviewData = await client.fetch(
      `{
        "platformMetrics": {
          "totalRevenue": sum(*[_type == "revenueAnalytics" && period.startDate >= $startDate].totals.grossRevenue),
          "totalOrders": sum(*[_type == "revenueAnalytics" && period.startDate >= $startDate].transactions.totalCount),
          "totalUsers": count(*[_type == "user"]),
          "totalProducts": count(*[_type == "product"]),
          "activePartners": count(*[_type == "user" && role == "partner"]),
          "successRate": round(avg(*[_type == "revenueAnalytics" && period.startDate >= $startDate].transactions.successRate))
        },
        "recentRevenue": *[_type == "revenueAnalytics" && period.startDate >= $startDate] | order(period.startDate desc) [0...7] {
          "date": period.startDate,
          "revenue": totals.grossRevenue,
          "transactions": transactions.totalCount
        },
        "topProducts": *[_type == "product"] | order(stats.downloads desc) [0...5] {
          _id,
          title,
          "image": images[0].asset->url,
          price,
          "downloads": stats.downloads,
          "author": author->name
        },
        "topPartners": *[_type == "user" && role == "partner"] [0...5] {
          _id,
          name,
          "totalEarnings": 0,
          "productsCount": count(*[_type == "product" && author._ref == ^._id])
        }
      }`,
      { startDate: startDate.toISOString().split('T')[0] }
    )
  } else if (userRole === 'partner') {
    // Partner gets their own analytics
    overviewData = await client.fetch(
      `{
        "partnerMetrics": {
          "totalEarnings": sum(*[_type == "transaction" && participants.partner._ref == $userId && _createdAt >= $startDate].revenueDistribution.partnerEarnings),
          "totalSales": count(*[_type == "order" && items[].partnerCommission.partner._ref == $userId && _createdAt >= $startDate]),
          "productsCount": count(*[_type == "product" && author._ref == $userId]),
          "avgOrderValue": round(avg(*[_type == "order" && items[].partnerCommission.partner._ref == $userId && _createdAt >= $startDate].pricing.total))
        },
        "salesHistory": *[_type == "order" && items[].partnerCommission.partner._ref == $userId && _createdAt >= $startDate] | order(_createdAt desc) [0...10] {
          _id,
          orderNumber,
          "total": pricing.total,
          "customerName": user->name,
          "date": timestamps.placedAt,
          status
        },
        "productPerformance": *[_type == "product" && author._ref == $userId] | order(stats.downloads desc) [0...5] {
          _id,
          title,
          price,
          "downloads": stats.downloads,
          "revenue": price * stats.downloads
        }
      }`,
      {
        userId,
        startDate: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()
      }
    )
  } else {
    // Regular user gets their purchase analytics
    overviewData = await client.fetch(
      `{
        "userMetrics": {
          "totalSpent": sum(*[_type == "order" && user._ref == $userId && _createdAt >= $startDate].pricing.total),
          "totalOrders": count(*[_type == "order" && user._ref == $userId && _createdAt >= $startDate]),
          "totalLicenses": count(*[_type == "license" && user._ref == $userId]),
          "favoriteCategories": array::unique(*[_type == "order" && user._ref == $userId].items[].product->category->title)[0...3]
        },
        "recentOrders": *[_type == "order" && user._ref == $userId] | order(_createdAt desc) [0...5] {
          _id,
          orderNumber,
          "total": pricing.total,
          status,
          "date": timestamps.placedAt,
          "itemCount": count(items)
        },
        "downloadActivity": *[_type == "downloadActivity" && user._ref == $userId] | order(_createdAt desc) [0...5] {
          _id,
          product-> {
            title,
            "image": images[0].asset->url
          },
          downloadedAt,
          fileSize
        }
      }`,
      {
        userId,
        startDate: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()
      }
    )
  }

  return NextResponse.json({
    success: true,
    period: `${periodDays} days`,
    userRole,
    data: overviewData
  })
}

async function getRevenueAnalytics(userId: string, userRole: string, periodDays: number) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  if (userRole === 'admin') {
    // Platform revenue analytics
    const revenueData = await client.fetch(
      `{
        "summary": *[_type == "revenueAnalytics" && period.startDate >= $startDate] {
          "period": period.startDate,
          "grossRevenue": totals.grossRevenue,
          "netRevenue": totals.netRevenue,
          "platformRevenue": totals.platformRevenue,
          "partnerRevenue": totals.partnerRevenue,
          "transactionCount": transactions.totalCount,
          "successRate": transactions.successRate
        } | order(period desc),
        "totals": {
          "grossRevenue": sum(*[_type == "revenueAnalytics" && period.startDate >= $startDate].totals.grossRevenue),
          "netRevenue": sum(*[_type == "revenueAnalytics" && period.startDate >= $startDate].totals.netRevenue),
          "refunds": sum(*[_type == "revenueAnalytics" && period.startDate >= $startDate].totals.refunds),
          "processingFees": sum(*[_type == "revenueAnalytics" && period.startDate >= $startDate].totals.processingFees),
          "growthRate": 12.5
        },
        "topRevenueSources": *[_type == "product"] | order(price * stats.downloads desc) [0...5] {
          title,
          "revenue": price * stats.downloads,
          "sales": stats.downloads,
          "author": author->name
        }
      }`,
      { startDate: startDate.toISOString().split('T')[0] }
    )

    return NextResponse.json({
      success: true,
      data: revenueData
    })
  } else if (userRole === 'partner') {
    // Partner earnings analytics
    const partnerData = await client.fetch(
      `{
        "earnings": *[_type == "transaction" && participants.partner._ref == $userId && type == "payment" && _createdAt >= $startDate] {
          "date": timestamps.capturedAt,
          "amount": revenueDistribution.partnerEarnings,
          "orderId": order->orderNumber,
          "productTitle": order->items[0].product->title
        } | order(date desc),
        "summary": {
          "totalEarnings": sum(*[_type == "transaction" && participants.partner._ref == $userId && type == "payment" && _createdAt >= $startDate].revenueDistribution.partnerEarnings),
          "pendingEarnings": sum(*[_type == "transaction" && participants.partner._ref == $userId && status == "pending"].revenueDistribution.partnerEarnings),
          "salesCount": count(*[_type == "transaction" && participants.partner._ref == $userId && type == "payment" && _createdAt >= $startDate]),
          "avgSaleValue": round(avg(*[_type == "transaction" && participants.partner._ref == $userId && type == "payment" && _createdAt >= $startDate].amount.gross))
        },
        "monthlyBreakdown": *[_type == "revenueAnalytics" && period.type == "monthly"] {
          "month": period.month,
          "year": period.year,
          "earnings": partners.topEarningPartners[partners.topEarningPartners[].partner._ref == $userId][0].earnings
        } | order(year desc, month desc) [0...6]
      }`,
      {
        userId,
        startDate: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()
      }
    )

    return NextResponse.json({
      success: true,
      data: partnerData
    })
  }

  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
}

async function getTransactionAnalytics(userId: string, userRole: string, periodDays: number) {
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

  let transactionData

  if (userRole === 'admin') {
    transactionData = await client.fetch(
      `{
        "transactionSummary": {
          "totalTransactions": count(*[_type == "transaction" && _createdAt >= $startDate]),
          "successfulTransactions": count(*[_type == "transaction" && _createdAt >= $startDate && status == "completed"]),
          "failedTransactions": count(*[_type == "transaction" && _createdAt >= $startDate && status == "failed"]),
          "refundedTransactions": count(*[_type == "transaction" && _createdAt >= $startDate && type == "refund"]),
          "totalVolume": sum(*[_type == "transaction" && _createdAt >= $startDate && type == "payment"].amount.gross),
          "averageTransactionValue": round(avg(*[_type == "transaction" && _createdAt >= $startDate && type == "payment"].amount.gross))
        },
        "paymentMethodBreakdown": *[_type == "revenueAnalytics" && period.startDate >= $startDateString][0].paymentMethods.breakdown,
        "dailyTransactions": *[_type == "transaction" && _createdAt >= $startDate] | order(_createdAt desc) [0...20] {
          _id,
          transactionId,
          type,
          status,
          "amount": amount.gross,
          "currency": amount.currency,
          "date": timestamps.initiatedAt,
          "customerName": participants.customer->name,
          "paymentMethod": paymentProvider.metadata.paymentMethod
        }
      }`,
      {
        startDate: startDate.toISOString(),
        startDateString: startDate.toISOString().split('T')[0]
      }
    )
  } else if (userRole === 'partner') {
    transactionData = await client.fetch(
      `{
        "partnerTransactions": *[_type == "transaction" && participants.partner._ref == $userId && _createdAt >= $startDate] {
          _id,
          transactionId,
          type,
          status,
          "earnings": revenueDistribution.partnerEarnings,
          "totalAmount": amount.gross,
          "date": timestamps.capturedAt,
          "orderNumber": order->orderNumber,
          "productTitle": order->items[0].product->title,
          "customerName": participants.customer->name
        } | order(date desc),
        "commissionSummary": {
          "totalCommissions": sum(*[_type == "transaction" && participants.partner._ref == $userId && type == "payment" && _createdAt >= $startDate].revenueDistribution.partnerEarnings),
          "commissionCount": count(*[_type == "transaction" && participants.partner._ref == $userId && type == "payment" && _createdAt >= $startDate]),
          "averageCommission": round(avg(*[_type == "transaction" && participants.partner._ref == $userId && type == "payment" && _createdAt >= $startDate].revenueDistribution.partnerEarnings))
        }
      }`,
      {
        userId,
        startDate: startDate.toISOString()
      }
    )
  } else {
    transactionData = await client.fetch(
      `{
        "userTransactions": *[_type == "transaction" && participants.customer._ref == $userId && _createdAt >= $startDate] {
          _id,
          transactionId,
          type,
          status,
          "amount": amount.gross,
          "currency": amount.currency,
          "date": timestamps.initiatedAt,
          "orderNumber": order->orderNumber,
          "paymentMethod": paymentProvider.metadata.paymentMethod
        } | order(date desc),
        "spendingSummary": {
          "totalSpent": sum(*[_type == "transaction" && participants.customer._ref == $userId && type == "payment" && _createdAt >= $startDate].amount.gross),
          "transactionCount": count(*[_type == "transaction" && participants.customer._ref == $userId && type == "payment" && _createdAt >= $startDate]),
          "averageSpend": round(avg(*[_type == "transaction" && participants.customer._ref == $userId && type == "payment" && _createdAt >= $startDate].amount.gross))
        }
      }`,
      {
        userId,
        startDate: startDate.toISOString()
      }
    )
  }

  return NextResponse.json({
    success: true,
    data: transactionData
  })
}

async function getProductAnalytics(userId: string, userRole: string, periodDays: number) {
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

  if (userRole === 'partner') {
    const productData = await client.fetch(
      `{
        "productPerformance": *[_type == "product" && author._ref == $userId] {
          _id,
          title,
          price,
          "image": images[0].asset->url,
          "totalSales": count(*[_type == "order" && items[].product._ref == ^._id && _createdAt >= $startDate]),
          "totalRevenue": sum(*[_type == "order" && items[].product._ref == ^._id && _createdAt >= $startDate].pricing.total),
          "downloads": stats.downloads,
          "likes": stats.likes,
          "views": stats.views,
          "conversionRate": round((count(*[_type == "order" && items[].product._ref == ^._id && _createdAt >= $startDate]) / stats.views) * 100)
        } | order(totalRevenue desc),
        "categorySales": *[_type == "product" && author._ref == $userId] {
          "category": category->title,
          "sales": count(*[_type == "order" && items[].product._ref == ^._id && _createdAt >= $startDate]),
          "revenue": sum(*[_type == "order" && items[].product._ref == ^._id && _createdAt >= $startDate].pricing.total)
        }
      }`,
      {
        userId,
        startDate: startDate.toISOString()
      }
    )

    return NextResponse.json({
      success: true,
      data: productData
    })
  } else if (userRole === 'admin') {
    const allProductData = await client.fetch(
      `{
        "topProducts": *[_type == "product"] {
          _id,
          title,
          price,
          "author": author->name,
          "sales": count(*[_type == "order" && items[].product._ref == ^._id && _createdAt >= $startDate]),
          "revenue": sum(*[_type == "order" && items[].product._ref == ^._id && _createdAt >= $startDate].pricing.total),
          "downloads": stats.downloads
        } | order(revenue desc) [0...10],
        "categoryPerformance": *[_type == "category"] {
          _id,
          title,
          "sales": count(*[_type == "order" && items[].product->category._ref == ^._id && _createdAt >= $startDate]),
          "revenue": sum(*[_type == "order" && items[].product->category._ref == ^._id && _createdAt >= $startDate].pricing.total)
        } | order(revenue desc)
      }`,
      { startDate: startDate.toISOString() }
    )

    return NextResponse.json({
      success: true,
      data: allProductData
    })
  }

  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
}
