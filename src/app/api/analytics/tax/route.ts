import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { PLATFORM_CONFIG } from '@/config/platform'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const reportType = searchParams.get('type') || 'sales_tax'
    const taxYear = parseInt(searchParams.get('taxYear') || new Date().getFullYear().toString())
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')) : undefined
    const jurisdiction = searchParams.get('jurisdiction') || 'US'

    // Determine date range
    let startDate: string
    let endDate: string

    if (quarter) {
      const quarterStart = new Date(taxYear, (quarter - 1) * 3, 1)
      const quarterEnd = new Date(taxYear, quarter * 3, 0, 23, 59, 59)
      startDate = quarterStart.toISOString()
      endDate = quarterEnd.toISOString()
    } else {
      startDate = new Date(taxYear, 0, 1).toISOString()
      endDate = new Date(taxYear, 11, 31, 23, 59, 59).toISOString()
    }

    // Build base filter conditions
    const filterConditions = `_createdAt >= "${startDate}" && _createdAt <= "${endDate}" && status == "completed"`

    // Execute tax reporting queries based on report type
    let reportData: any = {}

    switch (reportType) {
      case 'sales_tax':
        reportData = await generateSalesTaxReport(filterConditions, jurisdiction, taxYear, quarter)
        break
      case 'vat':
        reportData = await generateVATReport(filterConditions, jurisdiction, taxYear, quarter)
        break
      case '1099':
        reportData = await generate1099Report(filterConditions, taxYear)
        break
      case 'income':
        reportData = await generateIncomeReport(filterConditions, taxYear, quarter)
        break
      case 'quarterly':
        reportData = await generateQuarterlyReport(filterConditions, taxYear, quarter || 1)
        break
      case 'annual':
        reportData = await generateAnnualReport(filterConditions, taxYear)
        break
      default:
        throw new Error(`Unknown report type: ${reportType}`)
    }

    const response = {
      reportType,
      period: {
        taxYear,
        quarter,
        startDate: startDate.split('T')[0],
        endDate: endDate.split('T')[0]
      },
      jurisdiction: {
        country: jurisdiction,
        taxIdNumber: process.env.TAX_ID_NUMBER || 'Not configured'
      },
      ...reportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        currency: 'USD',
        reportVersion: '1.0',
        dataSource: PLATFORM_CONFIG.development.enableDemoMode ? 'demo' : 'live'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error generating tax report:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate tax report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for creating tax reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportType, taxYear, quarter, jurisdiction, notes } = body

    if (!reportType || !taxYear) {
      return NextResponse.json(
        { error: 'Missing required fields: reportType and taxYear' },
        { status: 400 }
      )
    }

    // Generate the report data first
    const reportResponse = await GET(request)
    const reportData = await reportResponse.json()

    if (!reportResponse.ok) {
      return reportResponse
    }

    // Create tax report document in Sanity
    const reportId = `tax_${reportType}_${taxYear}${quarter ? `_Q${quarter}` : ''}_${Date.now()}`

    const taxReport = await client.create({
      _type: 'taxReport',
      _id: reportId,
      reportId,
      reportType,
      period: {
        startDate: reportData.period.startDate,
        endDate: reportData.period.endDate,
        taxYear,
        quarter
      },
      jurisdiction: {
        country: jurisdiction || 'US',
        taxIdNumber: process.env.TAX_ID_NUMBER || 'Not configured'
      },
      summary: reportData.summary,
      breakdown: reportData.breakdown,
      exemptions: reportData.exemptions,
      status: 'draft',
      notes: notes || '',
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: PLATFORM_CONFIG.development.enableDemoMode ? 'demo' : 'live',
        reportVersion: '1.0'
      }
    })

    return NextResponse.json({
      success: true,
      reportId,
      taxReport,
      message: 'Tax report created successfully'
    })

  } catch (error) {
    console.error('Error creating tax report:', error)
    return NextResponse.json(
      {
        error: 'Failed to create tax report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Sales Tax Report
async function generateSalesTaxReport(filterConditions: string, jurisdiction: string, taxYear: number, quarter?: number) {
  const [summary, breakdown] = await Promise.all([
    // Sales tax summary
    client.fetch(`
      {
        "totalRevenue": math::sum(*[_type == "transaction" && ${filterConditions}].amount.gross),
        "taxableRevenue": math::sum(*[_type == "transaction" && ${filterConditions} && analytics.location.country == "${jurisdiction}"].amount.gross),
        "totalTaxCollected": math::sum(*[_type == "transaction" && ${filterConditions}].amount.tax),
        "exemptRevenue": math::sum(*[_type == "transaction" && ${filterConditions} && analytics.location.country != "${jurisdiction}"].amount.gross)
      }
    `),

    // Sales tax breakdown by state/jurisdiction
    client.fetch(`
      *[_type == "transaction" && ${filterConditions} && defined(analytics.location)] {
        "state": analytics.location.state,
        "country": analytics.location.country,
        "revenue": amount.gross,
        "tax": amount.tax
      } | {
        "jurisdiction": state || country,
        "revenue": math::sum(revenue),
        "taxCollected": math::sum(tax),
        "transactionCount": count(revenue),
        "averageTaxRate": math::sum(tax) / math::sum(revenue) * 100
      } | order(revenue desc)
    `)
  ])

  return {
    summary: {
      totalRevenue: summary.totalRevenue || 0,
      taxableRevenue: summary.taxableRevenue || 0,
      totalTaxCollected: summary.totalTaxCollected || 0,
      netTaxLiability: summary.totalTaxCollected || 0,
      currency: 'USD'
    },
    breakdown: {
      salesTax: breakdown || []
    },
    exemptions: {
      exemptTransactions: 0, // Calculate based on exemption logic
      exemptAmount: summary.exemptRevenue || 0,
      exemptionReasons: [
        {
          reason: 'international',
          amount: summary.exemptRevenue || 0,
          certificateNumber: 'N/A'
        }
      ]
    }
  }
}

// VAT Report
async function generateVATReport(filterConditions: string, jurisdiction: string, taxYear: number, quarter?: number) {
  const [summary, breakdown] = await Promise.all([
    // VAT summary
    client.fetch(`
      {
        "totalRevenue": math::sum(*[_type == "transaction" && ${filterConditions}].amount.gross),
        "netSales": math::sum(*[_type == "transaction" && ${filterConditions}].amount.net),
        "totalVAT": math::sum(*[_type == "transaction" && ${filterConditions}].amount.tax)
      }
    `),

    // VAT breakdown by country
    client.fetch(`
      *[_type == "transaction" && ${filterConditions} && defined(analytics.location.country)] {
        "country": analytics.location.country,
        "netSales": amount.net,
        "vat": amount.tax
      } | {
        "country": country,
        "netSales": math::sum(netSales),
        "vatAmount": math::sum(vat),
        "vatRate": math::sum(vat) / math::sum(netSales) * 100
      } | order(netSales desc)
    `)
  ])

  return {
    summary: {
      totalRevenue: summary.totalRevenue || 0,
      taxableRevenue: summary.netSales || 0,
      totalTaxCollected: summary.totalVAT || 0,
      netTaxLiability: summary.totalVAT || 0,
      currency: 'USD'
    },
    breakdown: {
      vatDetails: breakdown || []
    }
  }
}

// 1099 Report
async function generate1099Report(filterConditions: string, taxYear: number) {
  const partnerEarnings = await client.fetch(`
    *[_type == "transaction" && ${filterConditions} && defined(participants.partner)] {
      "partnerId": participants.partner._ref,
      "partnerName": participants.partner->name,
      "partnerEmail": participants.partner->email,
      "earnings": revenueDistribution.partnerEarnings
    } | {
      "partnerId": partnerId,
      "partnerName": partnerName,
      "partnerEmail": partnerEmail,
      "totalEarnings": math::sum(earnings),
      "form1099Required": math::sum(earnings) >= 600
    } | order(totalEarnings desc)
  `)

  const total1099Amount = partnerEarnings
    .filter((p: any) => p.form1099Required)
    .reduce((sum: number, p: any) => sum + p.totalEarnings, 0)

  return {
    summary: {
      totalRevenue: total1099Amount,
      taxableRevenue: total1099Amount,
      totalTaxCollected: 0,
      netTaxLiability: 0,
      currency: 'USD'
    },
    breakdown: {
      partnerTax: partnerEarnings.map((partner: any) => ({
        partner: { _ref: partner.partnerId },
        totalEarnings: partner.totalEarnings,
        taxWithheld: 0,
        form1099Required: partner.form1099Required,
        form1099Amount: partner.form1099Required ? partner.totalEarnings : 0
      }))
    }
  }
}

// Income Report
async function generateIncomeReport(filterConditions: string, taxYear: number, quarter?: number) {
  const [income, expenses] = await Promise.all([
    // Platform income
    client.fetch(`
      {
        "grossRevenue": math::sum(*[_type == "transaction" && ${filterConditions}].amount.gross),
        "netRevenue": math::sum(*[_type == "transaction" && ${filterConditions}].amount.net),
        "platformEarnings": math::sum(*[_type == "transaction" && ${filterConditions}].revenueDistribution.platformEarnings),
        "processingFees": math::sum(*[_type == "transaction" && ${filterConditions}].amount.fees)
      }
    `),

    // Platform expenses (partner commissions, processing fees, etc.)
    client.fetch(`
      {
        "partnerCommissions": math::sum(*[_type == "transaction" && ${filterConditions}].revenueDistribution.partnerEarnings),
        "processingCosts": math::sum(*[_type == "transaction" && ${filterConditions}].revenueDistribution.processingCosts),
        "refunds": math::sum(*[_type == "transaction" && type == "refund" && ${filterConditions}].amount.gross)
      }
    `)
  ])

  const netIncome = (income.platformEarnings || 0) - (expenses.partnerCommissions || 0) - (expenses.processingCosts || 0)

  return {
    summary: {
      totalRevenue: income.grossRevenue || 0,
      taxableRevenue: netIncome,
      totalTaxCollected: 0,
      netTaxLiability: netIncome * 0.21, // Assuming 21% corporate tax rate
      currency: 'USD'
    },
    breakdown: {
      income: {
        grossRevenue: income.grossRevenue || 0,
        platformEarnings: income.platformEarnings || 0,
        processingFees: income.processingFees || 0
      },
      expenses: {
        partnerCommissions: expenses.partnerCommissions || 0,
        processingCosts: expenses.processingCosts || 0,
        refunds: expenses.refunds || 0
      },
      netIncome
    }
  }
}

// Quarterly Report
async function generateQuarterlyReport(filterConditions: string, taxYear: number, quarter: number) {
  // Combine multiple report types for quarterly filing
  const [salesTax, income] = await Promise.all([
    generateSalesTaxReport(filterConditions, 'US', taxYear, quarter),
    generateIncomeReport(filterConditions, taxYear, quarter)
  ])

  return {
    summary: {
      totalRevenue: salesTax.summary.totalRevenue,
      taxableRevenue: salesTax.summary.taxableRevenue,
      totalTaxCollected: salesTax.summary.totalTaxCollected,
      netTaxLiability: salesTax.summary.netTaxLiability + income.summary.netTaxLiability,
      currency: 'USD'
    },
    breakdown: {
      salesTax: salesTax.breakdown.salesTax,
      income: income.breakdown
    }
  }
}

// Annual Report
async function generateAnnualReport(filterConditions: string, taxYear: number) {
  // Comprehensive annual tax report
  const [salesTax, vat, form1099, income] = await Promise.all([
    generateSalesTaxReport(filterConditions, 'US', taxYear),
    generateVATReport(filterConditions, 'US', taxYear),
    generate1099Report(filterConditions, taxYear),
    generateIncomeReport(filterConditions, taxYear)
  ])

  return {
    summary: {
      totalRevenue: salesTax.summary.totalRevenue,
      taxableRevenue: salesTax.summary.taxableRevenue,
      totalTaxCollected: salesTax.summary.totalTaxCollected + vat.summary.totalTaxCollected,
      netTaxLiability: salesTax.summary.netTaxLiability + vat.summary.netTaxLiability + income.summary.netTaxLiability,
      currency: 'USD'
    },
    breakdown: {
      salesTax: salesTax.breakdown.salesTax,
      vatDetails: vat.breakdown.vatDetails,
      partnerTax: form1099.breakdown.partnerTax,
      income: income.breakdown
    }
  }
}
