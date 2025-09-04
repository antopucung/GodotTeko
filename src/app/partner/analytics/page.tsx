'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, PackageIcon, DownloadIcon, RefreshCwIcon, ClockIcon } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subDays } from 'date-fns'

interface PartnerAnalyticsData {
  summary: {
    totalEarnings: number
    totalTransactions: number
    averageEarning: number
    averageCommissionRate: number
    totalCommissionsPaid: number
    averageEarningPerPartner: number
  }
  partners: {
    all: Array<{
      partnerId: string
      partnerName: string
      partnerEmail: string
      totalEarnings: number
      totalTransactions: number
      averageEarning: number
      topProducts: string[]
    }>
    topPerformers: Array<{
      partnerId: string
      partnerName: string
      totalEarnings: number
      transactionCount: number
    }>
  }
  payouts: {
    recent: Array<{
      _id: string
      payoutId: string
      grossEarnings: number
      netPayout: number
      status: string
      periodStart: string
      periodEnd: string
      processedAt: string
    }>
    pending: Array<{
      partnerId: string
      partnerName: string
      amount: number
      dueDate: string
    }>
    projections: any[]
  }
  products: {
    performance: Array<{
      partnerId: string
      productId: string
      productTitle: string
      totalEarnings: number
      unitsSold: number
    }>
  }
  trends: {
    earnings: Array<{
      period: string
      totalEarnings: number
      partnerCount: number
    }>
  }
}

export default function PartnerAnalyticsDashboard() {
  const { data: session } = useSession()
  const [analyticsData, setAnalyticsData] = useState<PartnerAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [dateRange, setDateRange] = useState('30d')
  const [period, setPeriod] = useState('daily')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Chart colors
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b'
  }

  // Fetch partner analytics data
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

      // Filter by current partner
      if (session?.user?.id) {
        params.append('partnerId', session.user.id)
      }

      const response = await fetch(`/api/analytics/partners?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch partner analytics data')
      }

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching partner analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalytics()
    }
  }, [session, dateRange, period, customStartDate, customEndDate])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get current partner data
  const currentPartnerData = analyticsData?.partners.all.find(p => p.partnerId === session?.user?.id)
  const currentPartnerProducts = analyticsData?.products.performance.filter(p => p.partnerId === session?.user?.id) || []

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

  if (!analyticsData || !currentPartnerData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">No analytics data available for your account.</p>
              <p className="text-sm text-gray-500">Start selling products to see your analytics here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Analytics</h1>
          <p className="text-gray-600">Track your earnings and performance</p>
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
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Time Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentPartnerData.totalEarnings)}</div>
            <div className="text-xs text-muted-foreground">
              Commission Rate: {analyticsData.summary?.averageCommissionRate || 70}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPartnerData.totalTransactions}</div>
            <div className="text-xs text-muted-foreground">
              Products: {currentPartnerProducts.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Sale</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentPartnerData.averageEarning)}</div>
            <div className="text-xs text-muted-foreground">
              Per transaction
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.payouts.pending.find(p => p.partnerId === session?.user?.id)?.amount || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Next payout: monthly
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Earnings Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <CardDescription>Your earnings trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.trends.earnings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area
                      type="monotone"
                      dataKey="totalEarnings"
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      fillOpacity={0.3}
                      name="Earnings"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Rank</CardTitle>
                <CardDescription>Your ranking among all partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    #{analyticsData.partners.topPerformers.findIndex(p => p.partnerId === session?.user?.id) + 1}
                  </div>
                  <div className="text-sm text-gray-600">out of {analyticsData.partners.topPerformers.length} partners</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best Selling Product</CardTitle>
                <CardDescription>Your top performing product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {currentPartnerProducts.length > 0 ? (
                    <>
                      <div className="font-medium text-lg mb-2">
                        {currentPartnerProducts.sort((a, b) => b.totalEarnings - a.totalEarnings)[0].productTitle}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(currentPartnerProducts.sort((a, b) => b.totalEarnings - a.totalEarnings)[0].totalEarnings)} earned
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">No products yet</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Goal</CardTitle>
                <CardDescription>Progress towards monthly target</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">78%</div>
                  <div className="text-sm text-gray-600">of $5,000 target</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Product Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Your products ranked by earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentPartnerProducts
                  .sort((a, b) => b.totalEarnings - a.totalEarnings)
                  .map((product, index) => (
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
                        <div className="font-medium">{formatCurrency(product.totalEarnings)}</div>
                        <div className="text-sm text-gray-600">
                          Avg: {formatCurrency(product.totalEarnings / product.unitsSold)}
                        </div>
                      </div>
                    </div>
                  ))}
                {currentPartnerProducts.length === 0 && (
                  <div className="text-center py-8">
                    <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No products yet</p>
                    <p className="text-sm text-gray-500">Upload your first product to start earning</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          {/* Recent Payouts */}
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Your recent and pending payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.payouts.recent.map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">
                        {format(new Date(payout.periodStart), 'MMM d')} - {format(new Date(payout.periodEnd), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-600">
                        <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>
                          {payout.status}
                        </Badge>
                        {payout.processedAt && (
                          <span className="ml-2">
                            Processed: {format(new Date(payout.processedAt), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(payout.netPayout)}</div>
                      <div className="text-sm text-gray-600">
                        Gross: {formatCurrency(payout.grossEarnings)}
                      </div>
                    </div>
                  </div>
                ))}
                {analyticsData.payouts.recent.length === 0 && (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No payouts yet</p>
                    <p className="text-sm text-gray-500">Your first payout will appear here once you start earning</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Earnings Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Trends</CardTitle>
              <CardDescription>Detailed view of your earnings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.trends.earnings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalEarnings"
                      stroke={chartColors.primary}
                      strokeWidth={2}
                      name="Total Earnings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key insights about your sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Top Performing Days</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monday</span>
                      <span className="text-sm font-medium">$245</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Wednesday</span>
                      <span className="text-sm font-medium">$189</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Friday</span>
                      <span className="text-sm font-medium">$167</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Growth Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Month over Month</span>
                      <span className="text-sm font-medium text-green-600">+15.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quarter over Quarter</span>
                      <span className="text-sm font-medium text-green-600">+28.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Year over Year</span>
                      <span className="text-sm font-medium text-green-600">+67.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
