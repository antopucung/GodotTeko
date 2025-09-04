'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Heart,
  Star,
  Award,
  Play,
  Plus,
  ArrowRight,
  BarChart3,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface CreatorStats {
  // Asset metrics
  assetsPublished: number
  totalAssetSales: number
  assetViews: number
  assetLikes: number

  // Course metrics
  coursesCreated: number
  coursesPublished: number
  totalEnrollments: number
  averageRating: number

  // Student metrics
  totalStudents: number
  activeClasses: number
  certificatesIssued: number

  // Revenue metrics
  assetRevenue: number
  courseRevenue: number
  teachingRevenue: number
  totalEarnings: number

  // Performance metrics
  conversionRate: number
  studentSatisfaction: number
}

interface CreatorDashboardData {
  creator: {
    name: string
    role: string
    creatorProfile?: any
    teacherProfile?: any
    capabilities: any
    stats: CreatorStats
    recentActivity: any[]
  }
}

export default function CreatorDashboard() {
  const [dashboardData, setDashboardData] = useState<CreatorDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/creator/profile')
      .then(res => res.json())
      .then(data => {
        if (data.creator) {
          setDashboardData(data)
        }
      })
      .catch(error => {
        console.error('Failed to fetch creator dashboard data:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Failed to load dashboard data</div>
      </div>
    )
  }

  const { creator } = dashboardData
  const stats = creator.stats

  // Main KPI cards
  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      description: 'All-time earnings',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Content Published',
      value: (stats.assetsPublished + stats.coursesPublished).toString(),
      description: `${stats.assetsPublished} assets, ${stats.coursesPublished} courses`,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+3 this month',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Total Students',
      value: (stats.totalEnrollments + stats.totalStudents).toLocaleString(),
      description: 'Across all content',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+127 this month',
      changeColor: 'text-purple-600'
    },
    {
      title: 'Satisfaction Score',
      value: `${stats.averageRating.toFixed(1)}/5.0`,
      description: 'Course ratings',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '+0.2 vs last month',
      changeColor: 'text-yellow-600'
    }
  ]

  // Quick actions based on capabilities
  const quickActions = [
    ...(creator.capabilities.canCreateAssets ? [{
      title: 'Upload New Asset',
      description: 'Add assets to marketplace',
      href: '/creator/assets/new',
      icon: Package,
      color: 'bg-blue-600 hover:bg-blue-700'
    }] : []),
    ...(creator.capabilities.canCreateCourses ? [{
      title: 'Create Course',
      description: 'Build educational content',
      href: '/creator/courses/new',
      icon: BookOpen,
      color: 'bg-green-600 hover:bg-green-700'
    }] : []),
    ...(creator.capabilities.canManageStudents ? [{
      title: 'Add Students',
      description: 'Invite students to classes',
      href: '/creator/students/invite',
      icon: Users,
      color: 'bg-purple-600 hover:bg-purple-700'
    }] : []),
    {
      title: 'View Analytics',
      description: 'Detailed performance metrics',
      href: '/creator/analytics',
      icon: BarChart3,
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ]

  // Revenue breakdown
  const revenueBreakdown = [
    {
      source: 'Asset Sales',
      amount: stats.assetRevenue,
      percentage: stats.totalEarnings > 0 ? (stats.assetRevenue / stats.totalEarnings) * 100 : 0,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      source: 'Course Sales',
      amount: stats.courseRevenue,
      percentage: stats.totalEarnings > 0 ? (stats.courseRevenue / stats.totalEarnings) * 100 : 0,
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      source: 'Teaching',
      amount: stats.teachingRevenue,
      percentage: stats.totalEarnings > 0 ? (stats.teachingRevenue / stats.totalEarnings) * 100 : 0,
      icon: Users,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {creator.name}! 👋
            </h1>
            <p className="text-blue-100">
              {creator.creatorProfile?.studioName ?
                `Managing ${creator.creatorProfile.studioName}` :
                'Your creator dashboard'
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Total Earnings</div>
            <div className="text-3xl font-bold">${stats.totalEarnings.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {kpi.value}
              </div>
              <p className="text-xs text-gray-500 mb-2">{kpi.description}</p>
              <div className={`text-xs font-medium ${kpi.changeColor} flex items-center`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {kpi.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>Income by content type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.source}</div>
                      <div className="text-sm text-gray-500">
                        ${item.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {item.percentage.toFixed(1)}%
                    </div>
                    <Progress value={item.percentage} className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Content Engagement</span>
                  <span className="text-sm font-bold text-gray-900">
                    {((stats.assetLikes + stats.totalEnrollments) / Math.max(stats.assetViews + stats.totalEnrollments, 1) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={((stats.assetLikes + stats.totalEnrollments) / Math.max(stats.assetViews + stats.totalEnrollments, 1) * 100)} className="h-3" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Student Satisfaction</span>
                  <span className="text-sm font-bold text-gray-900">
                    {((stats.averageRating / 5) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={(stats.averageRating / 5) * 100} className="h-3" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Content Portfolio</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.assetsPublished + stats.coursesPublished} items
                  </span>
                </div>
                <Progress value={Math.min((stats.assetsPublished + stats.coursesPublished) * 10, 100)} className="h-3" />
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{stats.certificatesIssued}</div>
                    <div className="text-xs text-gray-500">Certificates Issued</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{stats.activeClasses}</div>
                    <div className="text-xs text-gray-500">Active Classes</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates from your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creator.recentActivity && creator.recentActivity.length > 0 ? (
              creator.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity._type === 'product' ? '📦 Asset' :
                       activity._type === 'course' ? '📚 Course' :
                       '👥 Class'}: {activity.name || activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity._createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={activity.status === 'published' ? 'default' : 'secondary'}>
                    {activity.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No recent activity</p>
                <p className="text-xs">Activity will appear here as you create and manage content</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Growth Opportunities */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Grow Your Creator Business
                </h3>
                <p className="text-gray-600 text-sm max-w-lg">
                  {stats.assetsPublished === 0 && stats.coursesCreated === 0 ?
                    'Start by creating your first piece of content!' :
                    stats.coursesCreated === 0 ?
                    'Consider creating courses to complement your assets and increase revenue!' :
                    stats.assetsPublished === 0 ?
                    'Add marketplace assets to diversify your income streams!' :
                    'Explore VIP project galleries to showcase your creative process!'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/creator/analytics">
                <Button variant="outline" size="sm">
                  View Analytics
                </Button>
              </Link>
              <Link href={stats.coursesCreated === 0 ? '/creator/courses/new' : '/creator/projects'}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  {stats.coursesCreated === 0 ? 'Create Course' : 'New Project'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
