'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon, UsersIcon, DollarSignIcon, CreditCardIcon, MapPinIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

interface AnalyticsData {
  summary: {
    totalRevenue: number
    netRevenue: number
    platformRevenue: number
    partnerRevenue: number
    totalTransactions: number
    successfulTransactions: number
    averageTransactionValue: number
    successRate: number
    conversionRate: number
    revenueGrowth: number
    transactionGrowth: number
  }
  trends: {
    timeSeriesData: Array<{
      period: string
      totalRevenue: number
      transactionCount: number
    }>
  }
  partners: {
    topPartners: Array<{
      partnerId: string
      partnerName: string
      totalEarnings: number
      transactionCount: number
    }>
    totalActivePartners: number
  }
  products: {
    topProducts: Array<{
      productId: string
      productTitle: string
      totalRevenue: number
      unitsSold: number
    }>
  }
  geography: {
    topCountries: Array<{
      country: string
      totalRevenue: number
      transactionCount: number
    }>
  }
  paymentMethods: {
    breakdown: Array<{
      paymentMethod: string
      totalRevenue: number
      transactionCount: number
      successRate: number
    }>
  }
  customers: {
    newCustomers: number
    returningCustomers: number
    customerRetentionRate: number
  }
  recentActivity: Array<{
    _id: string
    transactionId: string
    customerName: string
    partnerName: string
    productTitle: string
    amount: number
    country: string
    _createdAt: string
  }>
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [dateRange, setDateRange] = useState('30d')
  const [period, setPeriod] = useState('daily')
  const [selectedPartner, setSelectedPartner] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Chart colors
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    gray: '#6b7280'
  }

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  // Fetch analytics data
  const fetchAnalytics = async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)

    setError(null)

    try {
      const params = new URLSearchParams()

      // Handle date range
      let startDate: string
      let endDate: string = new Date().toISOString().split('T')[0]

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        startDate = customStartDate
        endDate = customEndDate
      } else {
        const days = parseInt(dateRange.replace('d', ''))
        startDate = subDays(new Date(), days).toISOString().split('T')[0]
      }

      params.append('startDate', startDate)
      params.append('endDate', endDate)
      params.append('period', period)

      if (selectedPartner) params.append('partnerId', selectedPartner)
      if (selectedCountry) params.append('country', selectedCountry)

      const response = await fetch(`/api/analytics/revenue?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, period, selectedPartner, selectedCountry, customStartDate, customEndDate])

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
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchAnalytics()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive revenue and performance analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="365d">Last year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  placeholder="Start Date"
                />
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  placeholder="End Date"
                />
              </>
            )}

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {analyticsData.geography.topCountries.map((country) => (
                  <SelectItem key={country.country} value={country.country}>
                    {country.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.summary.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analyticsData.summary.revenueGrowth >= 0 ? (
                <TrendingUpIcon className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 mr-1 text-red-600" />
              )}
              <span className={analyticsData.summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(analyticsData.summary.revenueGrowth)}
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalTransactions.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-2">
                {analyticsData.summary.successRate.toFixed(1)}% success
              </Badge>
              <span className={analyticsData.summary.transactionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(analyticsData.summary.transactionGrowth)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.partners.totalActivePartners}</div>
            <div className="text-xs text-muted-foreground">
              Partner Revenue: {formatCurrency(analyticsData.summary.partnerRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.summary.averageTransactionValue)}</div>
            <div className="text-xs text-muted-foreground">
              Conversion Rate: {analyticsData.summary.conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Revenue and transaction volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.trends.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="revenue" orientation="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="transactions" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'totalRevenue' ? formatCurrency(value as number) : value,
                        name === 'totalRevenue' ? 'Revenue' : 'Transactions'
                      ]}
                    />
                    <Legend />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      fillOpacity={0.3}
                      name="Revenue"
                    />
                    <Line
                      yAxisId="transactions"
                      type="monotone"
                      dataKey="transactionCount"
                      stroke={chartColors.secondary}
                      name="Transactions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest completed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.recentActivity.slice(0, 10).map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{transaction.productTitle}</div>
                      <div className="text-sm text-gray-600">
                        {transaction.customerName} • {transaction.country}
                        {transaction.partnerName && ` • Partner: ${transaction.partnerName}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(transaction._createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          {/* Top Partners */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Partners</CardTitle>
              <CardDescription>Partners ranked by total earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.partners.topPartners.map((partner, index) => (
                  <div key={partner.partnerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{partner.partnerName}</div>
                        <div className="text-sm text-gray-600">{partner.transactionCount} transactions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(partner.totalEarnings)}</div>
                      <div className="text-sm text-gray-600">
                        Avg: {formatCurrency(partner.totalEarnings / partner.transactionCount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Products ranked by total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.products.topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.productTitle}</div>
                        <div className="text-sm text-gray-600">{product.unitsSold} units sold</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.totalRevenue)}</div>
                      <div className="text-sm text-gray-600">
                        Avg: {formatCurrency(product.totalRevenue / product.unitsSold)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Country</CardTitle>
              <CardDescription>Geographic distribution of sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {analyticsData.geography.topCountries.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium">{country.country}</div>
                          <div className="text-sm text-gray-600">{country.transactionCount} transactions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(country.totalRevenue)}</div>
                        <div className="text-sm text-gray-600">
                          Avg: {formatCurrency(country.totalRevenue / country.transactionCount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.geography.topCountries.slice(0, 8)}
                        dataKey="totalRevenue"
                        nameKey="country"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ country, totalRevenue }) => `${country}: ${formatCurrency(totalRevenue)}`}
                      >
                        {analyticsData.geography.topCountries.slice(0, 8).map((_, index) => (
                          <Cell key={index} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Performance</CardTitle>
              <CardDescription>Revenue and success rates by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.paymentMethods.breakdown.map((method) => (
                  <div key={method.paymentMethod} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-medium capitalize">{method.paymentMethod}</div>
                        <div className="text-sm text-gray-600">{method.transactionCount} transactions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(method.totalRevenue)}</div>
                      <div className="text-sm text-gray-600">
                        Success: {method.successRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
