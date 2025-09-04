'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Users,
  BookOpen,
  Award,
  BarChart3,
  Settings,
  DollarSign,
  Home,
  Plus,
  GraduationCap,
  Menu,
  X,
  Bell,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { cn } from '@/styles/component-variants'

interface TeacherLayoutProps {
  children: ReactNode
}

const teacherNavItems = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: Home,
    href: '/teacher',
    description: 'Overview and analytics'
  },
  {
    id: 'classes',
    label: 'My Classes',
    icon: Users,
    href: '/teacher/classes',
    description: 'Manage your classes and students'
  },
  {
    id: 'courses',
    label: 'My Courses',
    icon: BookOpen,
    href: '/teacher/courses',
    description: 'Create and manage courses'
  },
  {
    id: 'students',
    label: 'Students',
    icon: GraduationCap,
    href: '/teacher/students',
    description: 'Student progress and management'
  },
  {
    id: 'certificates',
    label: 'Certificates',
    icon: Award,
    href: '/teacher/certificates',
    description: 'Generate and manage certificates'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/teacher/analytics',
    description: 'Performance and engagement metrics'
  },
  {
    id: 'income',
    label: 'Income',
    icon: DollarSign,
    href: '/teacher/income',
    description: 'Revenue tracking and invoices'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/teacher/settings',
    description: 'Profile and preferences'
  }
]

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [teacher, setTeacher] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/teacher')
      return
    }

    // Fetch teacher profile
    fetch('/api/teacher/profile')
      .then(res => res.json())
      .then(data => {
        if (data.teacher) {
          setTeacher(data.teacher)
        } else {
          // Redirect to regular dashboard if not a teacher
          router.push('/user/dashboard')
        }
      })
      .catch(error => {
        console.error('Failed to fetch teacher profile:', error)
        router.push('/user/dashboard')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher dashboard...</p>
        </div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Teacher Access Required</h2>
          <p className="text-gray-600 mb-4">You need teacher permissions to access this dashboard.</p>
          <Link href="/user/dashboard">
            <Button>Go to User Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentItem = teacherNavItems.find(item => item.href === pathname) || teacherNavItems[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GT</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-500">Godot Tekko</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Teacher Info */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={teacher.image} alt={teacher.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {teacher.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{teacher.name}</p>
                <p className="text-sm text-gray-500 truncate">{teacher.teacherProfile?.institution || 'Teacher'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">{teacher.stats?.studentCount || 0}</p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{teacher.stats?.coursesCount || 0}</p>
                <p className="text-xs text-gray-500">Courses</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2">
            {teacherNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-blue-700" : "text-gray-400")} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-6 border-t">
            <Link href="/teacher/courses/new">
              <Button className="w-full mb-3" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </Link>
            <Link href="/teacher/classes/new">
              <Button variant="outline" className="w-full" size="sm">
                <Users className="w-4 h-4 mr-2" />
                New Class
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{currentItem.label}</h1>
                <p className="text-sm text-gray-500">{currentItem.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
