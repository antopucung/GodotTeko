'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, FileTextIcon, DownloadIcon, RefreshCwIcon, DollarSignIcon, PercentIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react'
import { format } from 'date-fns'

interface TaxReportData {
  reportType: string
  period: {
    taxYear: number
    quarter?: number
    startDate: string
    endDate: string
  }
  jurisdiction: {
    country: string
    taxIdNumber: string
  }
  summary: {
    totalRevenue: number
    taxableRevenue: number
    totalTaxCollected: number
    netTaxLiability: number
    currency: string
  }
  breakdown: {
    salesTax?: Array<{
      jurisdiction: string
      revenue: number
      taxCollected: number
      transactionCount: number
      averageTaxRate: number
    }>
    vatDetails?: Array<{
      country: string
      netSales: number
      vatAmount: number
      vatRate: number
    }>
    partnerTax?: Array<{
      partner: { _ref: string }
      totalEarnings: number
      taxWithheld: number
      form1099Required: boolean
      form1099Amount: number
    }>
  }
  exemptions?: {
    exemptTransactions: number
    exemptAmount: number
    exemptionReasons: Array<{
      reason: string
      amount: number
      certificateNumber: string
    }>
  }
}

export default function TaxReportsDashboard() {
  const [reportData, setReportData] = useState<TaxReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [reportType, setReportType] = useState('sales_tax')
  const [taxYear, setTaxYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState('')
  const [jurisdiction, setJurisdiction] = useState('US')

  // Available years (current year and 3 years back)
  const availableYears = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i)

  // Fetch tax report data
  const generateReport = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('type', reportType)
      params.append('taxYear', taxYear.toString())
      params.append('jurisdiction', jurisdiction)

      if (quarter) {
        params.append('quarter', quarter)
      }

      const response = await fetch(`/api/analytics/tax?${params}`)

      if (!response.ok) {
        throw new Error('Failed to generate tax report')
      }

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error generating tax report:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  // Save report to database
  const saveReport = async () => {
    if (!reportData) return

    try {
      const response = await fetch('/api/analytics/tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType: reportData.reportType,
          taxYear: reportData.period.taxYear,
          quarter: reportData.period.quarter,
          jurisdiction: reportData.jurisdiction.country,
          notes: `Generated on ${new Date().toLocaleDateString()}`
        })
      })

      if (response.ok) {
        alert('Report saved successfully!')
      } else {
        throw new Error('Failed to save report')
      }
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Failed to save report')
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Reports</h1>
          <p className="text-gray-600">Generate and manage tax reports for compliance</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileTextIcon className="h-4 w-4 mr-2" />
            )}
            Generate Report
          </Button>
          {reportData && (
            <>
              <Button variant="outline" onClick={saveReport}>
                Save Report
              </Button>
              <Button variant="outline">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Configure the tax report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales_tax">Sales Tax</SelectItem>
                <SelectItem value="vat">VAT Report</SelectItem>
                <SelectItem value="1099">1099 Forms</SelectItem>
                <SelectItem value="income">Income Summary</SelectItem>
                <SelectItem value="quarterly">Quarterly Report</SelectItem>
                <SelectItem value="annual">Annual Report</SelectItem>
              </SelectContent>
            </Select>

            <Select value={taxYear.toString()} onValueChange={(value) => setTaxYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Tax Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(reportType === 'quarterly' || reportType === 'sales_tax') && (
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Quarter (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Year</SelectItem>
                  <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                  <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                  <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select value={jurisdiction} onValueChange={setJurisdiction}>
              <SelectTrigger>
                <SelectValue placeholder="Jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="EU">European Union</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-600 mr-2" />
              <span>Generating tax report...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && (
        <div className="space-y-6">
          {/* Report Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Report Summary</CardTitle>
                  <CardDescription>
                    {reportData.reportType.replace('_', ' ').toUpperCase()} Report for {reportData.period.taxYear}
                    {reportData.period.quarter && ` Q${reportData.period.quarter}`}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Generated
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <DollarSignIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(reportData.summary.totalRevenue)}
                  </p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSignIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-600 font-medium">Taxable Revenue</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(reportData.summary.taxableRevenue)}
                  </p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <PercentIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-orange-600 font-medium">Tax Collected</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatCurrency(reportData.summary.totalTaxCollected)}
                  </p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-600 font-medium">Tax Liability</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(reportData.summary.netTaxLiability)}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Report Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Period:</span>
                    <p className="font-medium">
                      {format(new Date(reportData.period.startDate), 'MMM d, yyyy')} - {format(new Date(reportData.period.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Jurisdiction:</span>
                    <p className="font-medium">{reportData.jurisdiction.country}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tax ID:</span>
                    <p className="font-medium">{reportData.jurisdiction.taxIdNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Currency:</span>
                    <p className="font-medium">{reportData.summary.currency}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <Tabs defaultValue="breakdown" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="breakdown">Tax Breakdown</TabsTrigger>
              <TabsTrigger value="exemptions">Exemptions</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="space-y-6">
              {/* Sales Tax Breakdown */}
              {reportData.breakdown.salesTax && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Tax by Jurisdiction</CardTitle>
                    <CardDescription>Tax collected by state/region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.breakdown.salesTax.map((tax, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{tax.jurisdiction}</div>
                            <div className="text-sm text-gray-600">
                              {tax.transactionCount} transactions • Avg rate: {formatPercentage(tax.averageTaxRate)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(tax.taxCollected)}</div>
                            <div className="text-sm text-gray-600">
                              on {formatCurrency(tax.revenue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* VAT Breakdown */}
              {reportData.breakdown.vatDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle>VAT by Country</CardTitle>
                    <CardDescription>Value Added Tax collected by country</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.breakdown.vatDetails.map((vat, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{vat.country}</div>
                            <div className="text-sm text-gray-600">
                              VAT Rate: {formatPercentage(vat.vatRate)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(vat.vatAmount)}</div>
                            <div className="text-sm text-gray-600">
                              on {formatCurrency(vat.netSales)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Partner Tax Information */}
              {reportData.breakdown.partnerTax && (
                <Card>
                  <CardHeader>
                    <CardTitle>Partner Tax Information</CardTitle>
                    <CardDescription>1099 forms and partner earnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.breakdown.partnerTax.map((partner, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">Partner {partner.partner._ref.slice(-6)}</div>
                            <div className="text-sm text-gray-600">
                              {partner.form1099Required ? (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  1099 Required
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600">
                                  Below 1099 Threshold
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(partner.totalEarnings)}</div>
                            <div className="text-sm text-gray-600">
                              Tax withheld: {formatCurrency(partner.taxWithheld)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="exemptions" className="space-y-6">
              {reportData.exemptions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Exemptions</CardTitle>
                    <CardDescription>Tax-exempt transactions and amounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Exempt Transactions</p>
                        <p className="text-2xl font-bold text-green-700">
                          {reportData.exemptions.exemptTransactions}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Exempt Amount</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(reportData.exemptions.exemptAmount)}
                        </p>
                      </div>
                    </div>

                    {reportData.exemptions.exemptionReasons.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Exemption Breakdown</h4>
                        {reportData.exemptions.exemptionReasons.map((exemption, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium capitalize">{exemption.reason.replace('_', ' ')}</div>
                              <div className="text-sm text-gray-600">
                                Cert #: {exemption.certificateNumber || 'N/A'}
                              </div>
                            </div>
                            <div className="font-medium">{formatCurrency(exemption.amount)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Information</CardTitle>
                  <CardDescription>Filing requirements and deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Filing Status</h4>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Draft
                        </Badge>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Due Date</h4>
                        <p className="text-sm text-gray-600">
                          {reportData.period.quarter ? `${taxYear + 1}-04-15` : `${taxYear + 1}-03-15`}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Payment Due</h4>
                        <p className="text-sm text-gray-600">
                          {reportData.period.quarter ? `${taxYear + 1}-04-15` : `${taxYear + 1}-03-15`}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Action Required</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Review and verify all tax calculations</li>
                        <li>• Ensure all supporting documents are available</li>
                        <li>• Save report to system for audit trail</li>
                        <li>• Schedule filing before deadline</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
