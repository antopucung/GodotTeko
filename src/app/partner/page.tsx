'use client'

import { useState, useEffect } from 'react'
import PartnerLayout from './layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  DollarSign,
  Download,
  Users,
  TrendingUp,
  Package,
  Star,
  BarChart3,
  Calendar,
  ArrowRight,
  Plus,
  FileText,
  Bell,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/styles/component-variants'
import { formatDistanceToNow } from 'date-fns'

interface PartnerStats {
  totalProducts: number
  totalSales: number
  totalEarnings: number
  pendingUploads: number
  recentOrders: any[]
  monthlyEarnings: number
  monthlyDownloads: number
  averageRating: number
  totalFiles: number
  storageUsed: number
}

export default function PartnerOverviewPage() {
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  const fetchPartnerData = async () => {
    try {
      // Check partner access and get basic stats
      const accessResponse = await fetch('/api/partner/access-check')
      const accessData = await accessResponse.json()

      if (accessData.hasAccess) {
        setStats(accessData.partner.stats)
        setIsDemoMode(accessData.isDevelopmentMode)
      }

      // Fetch recent activity (mock for now)
      const mockActivity = [
        {
          id: '1',
          type: 'sale',
          title: 'New purchase of Mobile App UI Kit',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          amount: 49
        },
        {
          id: '2',
          type: 'upload',
          title: 'Uploaded 5 new design files',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'download',
          title: 'Product downloaded 12 times today',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        }
      ]
      setRecentActivity(mockActivity)

    } catch (error) {
      console.error('Error fetching partner data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPartnerData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return <DollarSign className="w-4 h-4 text-green-600" />
      case 'upload': return <Upload className="w-4 h-4 text-blue-600" />
      case 'download': return <Download className="w-4 h-4 text-purple-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <PartnerLayout title="Partner Overview" subtitle="Welcome to your partner dashboard">
        <div className="space-y-6">
          <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="mobile-card">
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-3">
                    <div className="mobile-skeleton-title"></div>
                    <div className="mobile-skeleton-text"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="h-64 mobile-skeleton rounded-lg"></div>
        </div>
      </PartnerLayout>
    )
  }

  return (
    <PartnerLayout title="Partner Overview" subtitle="Welcome to your partner dashboard">
      <div className="space-y-6">
        {/* Demo Mode Notice */}
        {isDemoMode && (
          <Card className="mobile-card border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="mobile-subtitle text-blue-900 mb-1">Demo Mode Active</h3>
                  <p className="mobile-body text-blue-800">
                    You're in demo mode! All partner features are unlocked for testing.
                    In production, partner access would require verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Total Products</p>
                  <p className="mobile-title">{stats?.totalProducts || 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  {stats?.pendingUploads || 0} pending uploads
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Total Sales</p>
                  <p className="mobile-title">{stats?.totalSales || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-green-600 font-medium">
                  {formatCurrency(stats?.monthlyEarnings || 0)} this month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Downloads</p>
                  <p className="mobile-title">{stats?.monthlyDownloads || 0}</p>
                </div>
                <Download className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  This month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Storage</p>
                  <p className="mobile-title text-sm md:text-lg">
                    {stats?.totalFiles || 0} files
                  </p>
                </div>
                <Upload className="w-8 h-8 text-orange-600" />
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  File uploads
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Overview */}
        <Card className="mobile-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="mobile-subtitle">Earnings Overview</CardTitle>
                <CardDescription>Your revenue and performance metrics</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/partner/earnings">
                  <span className="mobile-only">View</span>
                  <span className="desktop-only">View Details</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="mobile-body font-medium">Total Earnings</span>
                <span className="mobile-title font-bold text-green-600">
                  {formatCurrency(stats?.totalEarnings || 0)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Goal: $1,000</span>
                  <span>{Math.round(((stats?.monthlyEarnings || 0) / 1000) * 100)}%</span>
                </div>
                <Progress value={((stats?.monthlyEarnings || 0) / 1000) * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="mobile-caption text-gray-600">Avg. Rating</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="mobile-body font-medium">
                      {stats?.averageRating || 4.8}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="mobile-caption text-gray-600">Conversion</p>
                  <p className="mobile-body font-medium mt-1">12.5%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mobile-grid mobile-grid-2">
          <Button asChild className="mobile-button-primary h-auto p-6">
            <Link href="/partner/uploads">
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8" />
                <div className="text-center">
                  <p className="mobile-body font-semibold">Upload Files</p>
                  <p className="mobile-caption text-blue-100 mt-1">
                    Add new assets to your products
                  </p>
                </div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="mobile-button h-auto p-6">
            <Link href="/partner/products">
              <div className="flex flex-col items-center gap-3">
                <Plus className="w-8 h-8" />
                <div className="text-center">
                  <p className="mobile-body font-semibold">Create Product</p>
                  <p className="mobile-caption text-gray-600 mt-1">
                    Launch a new design product
                  </p>
                </div>
              </div>
            </Link>
          </Button>
        </div>

        {/* Recent Activity & Recent Orders */}
        <div className="mobile-grid lg:grid-cols-2">
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="mobile-subtitle">Recent Activity</CardTitle>
              <CardDescription>Latest updates from your partner account</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="mobile-body font-medium line-clamp-2">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="mobile-caption text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                          {activity.amount && (
                            <Badge variant="secondary" className="text-xs">
                              {formatCurrency(activity.amount)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="mobile-body text-gray-600">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="mobile-subtitle">Recent Orders</CardTitle>
              <CardDescription>Latest purchases of your products</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="mobile-body font-medium">#{order.orderNumber}</p>
                        <p className="mobile-caption text-gray-500">
                          {formatDistanceToNow(new Date(order._createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="mobile-body font-semibold">
                          {formatCurrency(order.total)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {order.items.length} item(s)
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="mobile-body text-gray-600 mb-4">No orders yet</p>
                  <Button asChild size="sm">
                    <Link href="/partner/products">Create Your First Product</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Preview */}
        <Card className="mobile-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="mobile-subtitle">Performance Analytics</CardTitle>
                <CardDescription>Track your success metrics</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/partner/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="mobile-only">View</span>
                  <span className="desktop-only">View Analytics</span>
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="mobile-caption text-gray-600">Page Views</p>
                <p className="mobile-title text-blue-600">2,547</p>
                <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="mobile-caption text-gray-600">Conversion</p>
                <p className="mobile-title text-purple-600">12.5%</p>
                <p className="text-xs text-green-600 mt-1">+2.3% vs last month</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="mobile-caption text-gray-600">Favorites</p>
                <p className="mobile-title text-orange-600">89</p>
                <p className="text-xs text-green-600 mt-1">+15% vs last month</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="mobile-caption text-gray-600">Reviews</p>
                <p className="mobile-title text-yellow-600">4.8</p>
                <p className="text-xs text-gray-500 mt-1">24 reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        {(!stats?.totalProducts || stats.totalProducts === 0) && (
          <Card className="mobile-card border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="mobile-subtitle text-green-900 mb-2">Get Started as a Partner</h3>
                  <p className="mobile-body text-green-800 mb-4">
                    Welcome! Here's how to launch your first product on our platform.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <Upload className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="font-medium">1. Upload Files</p>
                    <p className="text-green-700">Add your design assets</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <Package className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="font-medium">2. Create Product</p>
                    <p className="text-green-700">Set up your listing</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="font-medium">3. Start Selling</p>
                    <p className="text-green-700">Earn from downloads</p>
                  </div>
                </div>
                <Button asChild className="mt-4">
                  <Link href="/partner/uploads">Start Uploading Files</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerLayout>
  )
}
