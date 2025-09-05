'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Download,
  Package,
  CreditCard,
  Star,
  TrendingUp,
  Calendar,
  Clock,
  Infinity,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/styles/component-variants'

interface DashboardStats {
  totalLicenses: number
  activeLicenses: number
  totalDownloads: number
  recentOrders: number
  favoriteProducts: number
  accessPass?: {
    isActive: boolean
    type: string
    downloadsThisPeriod: number
    daysRemaining?: number
  }
}

interface RecentActivity {
  id: string
  type: 'download' | 'purchase' | 'favorite'
  title: string
  timestamp: string
  product?: {
    title: string
    image?: string
    slug: string
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [recentLicenses, setRecentLicenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true)

      // Fetch stats and activity in parallel for better performance
      const [statsRes, activityRes, licensesRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/activity?limit=5'),
        fetch('/api/user/licenses?limit=3')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData.activities || [])
      }

      if (licensesRes.ok) {
        const licensesData = await licensesRes.json()
        setRecentLicenses(licensesData.licenses || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Welcome back!">
        <div className="space-y-6">
          {/* Mobile-optimized loading skeleton */}
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
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${session?.user?.name}!`}>
      <div className="space-y-6">
        {/* Mobile-optimized welcome section */}
        <div className="mobile-card bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="mobile-title text-white mb-2">
                <span className="mobile-only">Hi, {session?.user?.name?.split(' ')[0]}! 👋</span>
                <span className="desktop-only">Welcome back, {session?.user?.name}! 👋</span>
              </h2>
              <p className="mobile-body text-blue-100 mb-4">
                Here's what's happening with your account today.
              </p>
              <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="mobile-button"
              >
                {isRefreshing ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="mobile-only">Syncing...</span>
                    <span className="desktop-only">Refreshing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span className="mobile-only">Sync</span>
                    <span className="desktop-only">Refresh</span>
                  </div>
                )}
              </Button>
            </div>
            <div className="hidden md:block">
              <Monitor className="w-20 h-20 text-blue-200" />
            </div>
            <div className="md:hidden">
              <Smartphone className="w-12 h-12 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Mobile-first stats grid */}
        <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
          <Card className="mobile-card hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Total Licenses</p>
                  <p className="mobile-title">{stats?.totalLicenses || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-green-600 font-medium">
                  {stats?.activeLicenses || 0} active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Downloads</p>
                  <p className="mobile-title">{stats?.totalDownloads || 0}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  This month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Orders</p>
                  <p className="mobile-title">{stats?.recentOrders || 0}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  Recent purchases
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Favorites</p>
                  <p className="mobile-title">{stats?.favoriteProducts || 0}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-600">
                  Saved items
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Pass Status (if applicable) */}
        {stats?.accessPass && (
          <Card className={cn(
            "mobile-card border-2",
            stats.accessPass.isActive ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    stats.accessPass.isActive ? "bg-blue-600" : "bg-orange-600"
                  )}>
                    <Infinity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="mobile-subtitle">Access Pass</h3>
                    <p className="mobile-caption">
                      {stats.accessPass.type.charAt(0).toUpperCase() + stats.accessPass.type.slice(1)} Plan
                    </p>
                  </div>
                </div>
                <Badge className={cn(
                  stats.accessPass.isActive
                    ? "bg-blue-100 text-blue-800"
                    : "bg-orange-100 text-orange-800"
                )}>
                  {stats.accessPass.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="mobile-caption">Downloads this period</span>
                  <span className="mobile-body font-medium">
                    {stats.accessPass.downloadsThisPeriod}
                  </span>
                </div>

                {stats.accessPass.daysRemaining && (
                  <div className="flex justify-between items-center">
                    <span className="mobile-caption">Days remaining</span>
                    <span className="mobile-body font-medium">
                      {stats.accessPass.daysRemaining}
                    </span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mobile-button"
                  asChild
                >
                  <Link href="/dashboard/access-pass">
                    <span>Manage Access Pass</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile-optimized content tabs */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger
              value="activity"
              className="mobile-button py-3 data-[state=active]:bg-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              <span className="mobile-only">Activity</span>
              <span className="desktop-only">Recent Activity</span>
            </TabsTrigger>
            <TabsTrigger
              value="licenses"
              className="mobile-button py-3 data-[state=active]:bg-white"
            >
              <Package className="w-4 h-4 mr-2" />
              <span className="mobile-only">Licenses</span>
              <span className="desktop-only">Recent Licenses</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <Card className="mobile-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="mobile-subtitle">Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/activity">
                      <span className="mobile-only">All</span>
                      <span className="desktop-only">View All</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {activity.type === 'download' && <Download className="w-5 h-5 text-blue-600" />}
                          {activity.type === 'purchase' && <CreditCard className="w-5 h-5 text-blue-600" />}
                          {activity.type === 'favorite' && <Star className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="mobile-body font-medium line-clamp-1">{activity.title}</p>
                          <p className="mobile-caption">{activity.timestamp}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="touch-target">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="mobile-body text-gray-600 mb-4">No recent activity</p>
                    <Button asChild>
                      <Link href="/products">Browse Products</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licenses" className="space-y-4">
            <Card className="mobile-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="mobile-subtitle">Recent Licenses</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/licenses">
                      <span className="mobile-only">All</span>
                      <span className="desktop-only">View All</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentLicenses.length > 0 ? (
                  <div className="space-y-3">
                    {recentLicenses.map((license) => (
                      <div key={license._id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {license.product.image ? (
                            <Image
                              src={license.product.image}
                              alt={license.product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="mobile-body font-medium line-clamp-1">{license.product.title}</p>
                          <p className="mobile-caption">
                            {license.licenseType.charAt(0).toUpperCase() + license.licenseType.slice(1)} License
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="touch-target" asChild>
                          <Link href={`/dashboard/licenses/${license._id}`}>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="mobile-body text-gray-600 mb-4">No licenses yet</p>
                    <Button asChild>
                      <Link href="/products">Purchase Products</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mobile-optimized quick actions */}
        <div className="mobile-grid mobile-grid-2">
          <Button asChild className="mobile-button-primary h-auto p-4">
            <Link href="/products">
              <div className="flex flex-col items-center gap-2">
                <Package className="w-6 h-6" />
                <span className="mobile-body font-medium">Browse Products</span>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="mobile-button h-auto p-4">
            <Link href="/dashboard/downloads">
              <div className="flex flex-col items-center gap-2">
                <Download className="w-6 h-6" />
                <span className="mobile-body font-medium">My Downloads</span>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
