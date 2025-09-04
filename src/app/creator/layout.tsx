'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Package,
  BookOpen,
  BarChart3,
  Settings,
  DollarSign,
  Users,
  Award,
  Plus,
  Home,
  Play,
  Upload,
  Menu,
  X,
  Bell,
  LogOut,
  Crown,
  Star,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { cn } from '@/styles/component-variants'

interface CreatorLayoutProps {
  children: ReactNode
}

const creatorNavItems = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: Home,
    href: '/creator',
    description: 'Overview and analytics'
  },
  {
    id: 'content',
    label: 'My Content',
    icon: Package,
    href: '/creator/content',
    description: 'Manage all your content'
  },
  {
    id: 'assets',
    label: 'Assets',
    icon: Package,
    href: '/creator/assets',
    description: 'Manage marketplace assets'
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: BookOpen,
    href: '/creator/courses',
    description: 'Create and manage courses'
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    href: '/creator/students',
    description: 'Student management and progress'
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: Play,
    href: '/creator/projects',
    description: 'VIP project gallery',
    comingSoon: true
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/creator/analytics',
    description: 'Revenue and performance metrics'
  },
  {
    id: 'income',
    label: 'Income',
    icon: DollarSign,
    href: '/creator/income',
    description: 'Earnings and payments'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/creator/settings',
    description: 'Profile and preferences'
  }
]

const quickActions = [
  {
    id: 'create-asset',
    label: 'Upload Asset',
    icon: Upload,
    href: '/creator/assets/new',
    color: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    id: 'create-course',
    label: 'Create Course',
    icon: BookOpen,
    href: '/creator/courses/new',
    color: 'bg-green-600 hover:bg-green-700'
  },
  {
    id: 'create-project',
    label: 'New Project',
    icon: Play,
    href: '/creator/projects/new',
    color: 'bg-purple-600 hover:bg-purple-700',
    comingSoon: true
  }
]

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [creator, setCreator] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/creator')
      return
    }

    // Fetch creator profile
    fetch('/api/creator/profile')
      .then(res => res.json())
      .then(data => {
        if (data.creator) {
          setCreator(data.creator)
        } else {
          // Check if user can become a creator
          if (['partner', 'teacher', 'admin', 'super_admin'].includes(session.user.role)) {
            // Redirect to creator onboarding
            router.push('/creator/onboarding')
          } else {
            router.push('/user/dashboard')
          }
        }
      })
      .catch(error => {
        console.error('Failed to fetch creator profile:', error)
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
          <p className="text-gray-600">Loading creator dashboard...</p>
        </div>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Creator Access Required</h2>
          <p className="text-gray-600 mb-4">You need creator permissions to access this dashboard.</p>
          <Link href="/become-partner">
            <Button>Become a Creator</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentItem = creatorNavItems.find(item => item.href === pathname) || creatorNavItems[0]

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
        "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Creator Studio</h1>
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

          {/* Creator Info */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={creator.image} alt={creator.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {creator.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{creator.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {creator.creatorProfile?.studioName || 'Independent Creator'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {creator.creatorProfile?.verified && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                    {creator.role === 'partner' ? 'Partner' : creator.role === 'teacher' ? 'Teacher' : 'Creator'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {creator.stats?.assetsPublished || 0}
                </p>
                <p className="text-xs text-gray-500">Assets</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {creator.stats?.coursesCreated || 0}
                </p>
                <p className="text-xs text-gray-500">Courses</p>
              </div>
            </div>
          </div>

          {/* Content Type Tabs */}
          <div className="px-6 py-4 border-b">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto">
            {creatorNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.comingSoon ? '#' : item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                      : item.comingSoon
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault()
                    } else {
                      setSidebarOpen(false)
                    }
                  }}
                >
                  <item.icon className={cn("w-5 h-5",
                    isActive ? "text-blue-700" :
                    item.comingSoon ? "text-gray-400" : "text-gray-400"
                  )} />
                  <span>{item.label}</span>
                  {item.comingSoon && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-auto">
                      Soon
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-6 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.comingSoon ? '#' : action.href}
                  onClick={(e) => {
                    if (action.comingSoon) {
                      e.preventDefault()
                    }
                  }}
                >
                  <Button
                    className={cn(
                      "w-full justify-start text-sm",
                      action.comingSoon ? "opacity-50 cursor-not-allowed" : action.color
                    )}
                    size="sm"
                    disabled={action.comingSoon}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                    {action.comingSoon && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-auto">
                        Soon
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
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
                <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <currentItem.icon className="w-5 h-5 text-gray-600" />
                  {currentItem.label}
                </h1>
                <p className="text-sm text-gray-500">{currentItem.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Link href="/user/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  User Dashboard
                </Button>
              </Link>
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
