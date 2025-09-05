'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  BookOpen,
  Award,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface DashboardStats {
  totalStudents: number
  totalClasses: number
  totalCourses: number
  certificatesIssued: number
  monthlyRevenue: number
  totalRevenue: number
  recentActivity: any[]
  upcomingClasses: any[]
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalClasses: 0,
    totalCourses: 0,
    certificatesIssued: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    recentActivity: [],
    upcomingClasses: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard stats
    fetch('/api/teacher/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats(data.stats)
        }
      })
      .catch(error => {
        console.error('Failed to fetch dashboard stats:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      description: 'Across all classes',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Classes',
      value: stats.totalClasses,
      description: 'Currently running',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Courses Created',
      value: stats.totalCourses,
      description: 'Published courses',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Certificates Issued',
      value: stats.certificatesIssued,
      description: 'This semester',
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  const quickActions = [
    {
      title: 'Create New Course',
      description: 'Design and publish a new course',
      href: '/teacher/courses/new',
      icon: BookOpen,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Start New Class',
      description: 'Set up a class for your students',
      href: '/teacher/classes/new',
      icon: Users,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Generate Certificate',
      description: 'Issue certificates for students',
      href: '/teacher/certificates/new',
      icon: Award,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'View Analytics',
      description: 'Check student progress and engagement',
      href: '/teacher/analytics',
      icon: TrendingUp,
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ]

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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, Teacher! 👋</h1>
        <p className="text-blue-100">
          Manage your classes, track student progress, and create engaging courses all in one place.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">{stat.description}</p>
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

      {/* Recent Activity & Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No recent activity</p>
                  <p className="text-xs">Activity will appear here as you manage your classes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Upcoming Classes
            </CardTitle>
            <CardDescription>Your scheduled classes this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingClasses.length > 0 ? (
                stats.upcomingClasses.map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{classItem.name}</p>
                      <p className="text-sm text-gray-500">{classItem.time}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {classItem.students} students
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No upcoming classes</p>
                  <p className="text-xs mb-4">Create a class to get started</p>
                  <Link href="/teacher/classes/new">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Class
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Revenue Overview
          </CardTitle>
          <CardDescription>Your earnings and payment summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">${stats.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Earned</p>
            </div>
            <div className="text-center">
              <Link href="/teacher/income">
                <Button variant="outline" className="w-full">
                  View Details
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
