'use client'

import { useState, useEffect } from 'react'
import {
  Zap,
  Mail,
  DollarSign,
  TrendingUp,
  Target,
  Users,
  Eye,
  BarChart3,
  Send,
  Plus,
  RefreshCw,
  Calendar,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Star,
  Gift,
  Share2,
  Crown,
  Flame,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { toast } from 'sonner'

interface MarketingData {
  recommendations: {
    primary: any[]
    crossSell: any[]
    trending: any[]
    personalized: any[]
  }
  emailCampaigns: {
    totalSent: number
    successRate: number
    byType: any[]
    topPerforming: any[]
  }
  revenueOptimization: {
    currentPerformance: any
    pricingSuggestions: any[]
    bundleOpportunities: any[]
    actionableTasks: any[]
  }
}

export default function MarketingDashboard() {
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadMarketingData()
  }, [])

  const loadMarketingData = async () => {
    try {
      setIsLoading(true)

      // Load marketing data from multiple endpoints
      const [recommendationsRes, emailRes, revenueRes] = await Promise.all([
        fetch('/api/marketing/recommendations?type=course&contentId=sample'),
        fetch('/api/marketing/email'),
        fetch('/api/marketing/revenue-optimization')
      ])

      const [recommendations, emailData, revenueData] = await Promise.all([
        recommendationsRes.json(),
        emailRes.json(),
        revenueRes.json()
      ])

      setMarketingData({
        recommendations: recommendations.recommendations || {
          primary: [],
          crossSell: [],
          trending: [],
          personalized: []
        },
        emailCampaigns: emailData.analytics || {
          totalSent: 145,
          successRate: 92,
          byType: [
            { campaignType: 'course_recommendation', count: 45 },
            { campaignType: 'welcome_new_user', count: 32 },
            { campaignType: 'abandoned_cart', count: 28 }
          ],
          topPerforming: []
        },
        revenueOptimization: revenueData.optimizations || {
          currentPerformance: {
            revenuePerDay: 85,
            conversionRate: 3.2,
            engagementScore: 78
          },
          pricingSuggestions: [],
          bundleOpportunities: [],
          actionableTasks: []
        }
      })

    } catch (error) {
      console.error('Error loading marketing data:', error)
      toast.error('Failed to load marketing data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Tools</h1>
            <p className="text-gray-600">Automated marketing and revenue optimization</p>
          </div>
          <div className="animate-spin">
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Tools</h1>
          <p className="text-gray-600">Automated marketing and revenue optimization</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={loadMarketingData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Marketing Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Smart Recommendations</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(marketingData?.recommendations.primary?.length || 0) +
                   (marketingData?.recommendations.crossSell?.length || 0)}
                </p>
                <p className="text-xs text-blue-500">Active suggestions</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Email Campaigns</p>
                <p className="text-2xl font-bold text-green-700">
                  {marketingData?.emailCampaigns.totalSent || 0}
                </p>
                <p className="text-xs text-green-500">
                  {marketingData?.emailCampaigns.successRate || 0}% success rate
                </p>
              </div>
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Revenue Optimization</p>
                <p className="text-2xl font-bold text-purple-700">
                  ${marketingData?.revenueOptimization.currentPerformance?.revenuePerDay || 0}/day
                </p>
                <p className="text-xs text-purple-500">
                  {marketingData?.revenueOptimization.currentPerformance?.conversionRate || 0}% conversion
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Engagement Score</p>
                <p className="text-2xl font-bold text-orange-700">
                  {marketingData?.revenueOptimization.currentPerformance?.engagementScore || 0}
                </p>
                <p className="text-xs text-orange-500">Out of 100</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Tools Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="email">Email Marketing</TabsTrigger>
          <TabsTrigger value="optimization">Revenue Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>High-impact marketing tasks for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">Send abandoned cart emails</p>
                        <p className="text-sm text-red-600">12 users with items in cart</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Send Now
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">Update pricing on 3 assets</p>
                        <p className="text-sm text-yellow-600">Potential 25% revenue increase</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">Create course bundle</p>
                        <p className="text-sm text-blue-600">Bundle opportunity identified</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Create
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Weekly digest ready</p>
                        <p className="text-sm text-green-600">45 subscribers scheduled</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Marketing Performance</CardTitle>
                <CardDescription>7-day marketing metrics overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Email Campaign Success</span>
                      <span className="text-sm font-bold">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Cross-sell Conversion</span>
                      <span className="text-sm font-bold">18%</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Revenue Optimization</span>
                      <span className="text-sm font-bold">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Content Recommendations</span>
                      <span className="text-sm font-bold">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">+$1,247</p>
                    <p className="text-xs text-gray-500">Revenue increase (7d)</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">+89</p>
                    <p className="text-xs text-gray-500">New conversions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Results Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Email campaign results over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { date: '2024-01-01', sent: 45, opened: 38, clicked: 12 },
                  { date: '2024-01-02', sent: 52, opened: 44, clicked: 15 },
                  { date: '2024-01-03', sent: 38, opened: 32, clicked: 8 },
                  { date: '2024-01-04', sent: 67, opened: 58, clicked: 22 },
                  { date: '2024-01-05', sent: 73, opened: 65, clicked: 28 },
                  { date: '2024-01-06', sent: 41, opened: 35, clicked: 11 },
                  { date: '2024-01-07', sent: 89, opened: 79, clicked: 31 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                  <Legend />
                  <Area type="monotone" dataKey="sent" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Sent" />
                  <Area type="monotone" dataKey="opened" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Opened" />
                  <Area type="monotone" dataKey="clicked" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Clicked" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Smart Content Recommendations
              </CardTitle>
              <CardDescription>AI-powered suggestions to increase cross-selling and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Cross-Sell Opportunities</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-800">Bundle 3D Modeling Course + Assets</p>
                          <p className="text-sm text-blue-600">40% higher conversion expected</p>
                        </div>
                        <Button size="sm">Create</Button>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">Recommend UI Course to Asset Buyers</p>
                          <p className="text-sm text-green-600">18% click-through rate</p>
                        </div>
                        <Button size="sm">Enable</Button>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-purple-800">VIP Project for Premium Users</p>
                          <p className="text-sm text-purple-600">Behind-the-scenes content</p>
                        </div>
                        <Button size="sm">Setup</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Trending Recommendations</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Godot 4 Game Development</p>
                          <p className="text-sm text-gray-500">Trending in Game Development</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Hot</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Blender Character Rigging</p>
                          <p className="text-sm text-gray-500">25% increase in searches</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Rising</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium">VIP Animation Projects</p>
                          <p className="text-sm text-gray-500">Premium content opportunity</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Marketing Tab */}
        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Automated Email Campaigns
                </CardTitle>
                <CardDescription>Set up and manage automated email marketing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: 'Welcome Series',
                      description: 'Onboard new users with course recommendations',
                      status: 'active',
                      sent: 32,
                      openRate: 89
                    },
                    {
                      name: 'Course Completion',
                      description: 'Congratulate and suggest next courses',
                      status: 'active',
                      sent: 18,
                      openRate: 94
                    },
                    {
                      name: 'Abandoned Cart',
                      description: 'Recover lost sales with incentives',
                      status: 'active',
                      sent: 28,
                      openRate: 67
                    },
                    {
                      name: 'Weekly Digest',
                      description: 'Share new content and achievements',
                      status: 'draft',
                      sent: 0,
                      openRate: 0
                    }
                  ].map((campaign, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          campaign.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                          <p className="text-sm text-gray-500">{campaign.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{campaign.sent} sent</div>
                        <div className="text-xs text-gray-500">{campaign.openRate}% open rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-700">145</div>
                    <div className="text-sm text-blue-600">Total Emails Sent</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-700">92%</div>
                    <div className="text-sm text-green-600">Average Open Rate</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-700">18%</div>
                    <div className="text-sm text-purple-600">Click-through Rate</div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Top Campaigns</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Course Completion</span>
                        <span className="font-medium">94%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Welcome Series</span>
                        <span className="font-medium">89%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Abandoned Cart</span>
                        <span className="font-medium">67%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Pricing Optimization
                </CardTitle>
                <CardDescription>AI-powered pricing recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-green-800">Increase Asset Prices</h4>
                        <p className="text-sm text-green-600 mb-2">3 assets priced below market average</p>
                        <p className="text-xs text-green-500">Expected impact: +25% revenue</p>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Apply
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-blue-800">Bundle Opportunity</h4>
                        <p className="text-sm text-blue-600 mb-2">Course + Asset bundle suggested</p>
                        <p className="text-xs text-blue-500">Expected impact: +40% AOV</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Create
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-yellow-800">Seasonal Discount</h4>
                        <p className="text-sm text-yellow-600 mb-2">Summer learning promotion suggested</p>
                        <p className="text-xs text-yellow-500">Expected impact: +30% sales volume</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Analysis</CardTitle>
                <CardDescription>Competitive positioning and opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Category Performance</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Game Development</span>
                        <div className="flex items-center gap-2">
                          <Progress value={78} className="w-16 h-2" />
                          <span className="text-sm font-medium">78%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">3D Modeling</span>
                        <div className="flex items-center gap-2">
                          <Progress value={85} className="w-16 h-2" />
                          <span className="text-sm font-medium">85%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Digital Art</span>
                        <div className="flex items-center gap-2">
                          <Progress value={62} className="w-16 h-2" />
                          <span className="text-sm font-medium">62%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Market Opportunities</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>High demand for beginner courses</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>VIP content gaining popularity</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Gift className="w-4 h-4 text-purple-500" />
                        <span>Bundle sales outperforming individual</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">$2,340</div>
                    <div className="text-sm text-gray-500">Potential monthly increase</div>
                    <div className="text-xs text-green-600 mt-1">Based on optimizations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Revenue Action Plan
              </CardTitle>
              <CardDescription>Prioritized tasks to maximize revenue impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                  <Badge className="bg-red-100 text-red-800 mb-2">High Priority</Badge>
                  <h4 className="font-medium text-red-800 mb-2">Price Optimization</h4>
                  <p className="text-sm text-red-600 mb-3">Update 3 underpriced assets</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-red-500">Impact: +25% revenue</span>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Do Now
                    </Button>
                  </div>
                </div>

                <div className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                  <Badge className="bg-yellow-100 text-yellow-800 mb-2">Medium Priority</Badge>
                  <h4 className="font-medium text-yellow-800 mb-2">Bundle Creation</h4>
                  <p className="text-sm text-yellow-600 mb-3">Create course + asset bundles</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-500">Impact: +40% AOV</span>
                    <Button size="sm" variant="outline">
                      Plan
                    </Button>
                  </div>
                </div>

                <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                  <Badge className="bg-blue-100 text-blue-800 mb-2">Low Priority</Badge>
                  <h4 className="font-medium text-blue-800 mb-2">Content Expansion</h4>
                  <p className="text-sm text-blue-600 mb-3">Create VIP project content</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-500">Impact: +15% engagement</span>
                    <Button size="sm" variant="outline">
                      Later
                    </Button>
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
