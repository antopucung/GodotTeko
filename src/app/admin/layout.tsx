'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/styles/component-variants'
import {
  Shield,
  Activity,
  Database,
  Settings,
  Users,
  BarChart3,
  AlertTriangle,
  Menu,
  X,
  Home,
  Bell,
  LogOut,
  Monitor,
  Mail,
  Crown,
  BookOpen,
  Gamepad2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { toast } from 'sonner'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

const adminNavItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Activity,
    href: '/admin',
    mobileLabel: 'Overview'
  },
  {
    id: 'health',
    label: 'Health Monitor',
    icon: Shield,
    href: '/admin/health',
    mobileLabel: 'Health'
  },
  {
    id: 'monitoring',
    label: 'System Monitoring',
    icon: Monitor,
    href: '/admin/monitoring',
    mobileLabel: 'Monitor'
  },
  {
    id: 'system-analytics',
    label: 'Real-time Analytics',
    icon: Activity,
    href: '/admin/system-analytics',
    mobileLabel: 'Real-time'
  },
  {
    id: 'courses',
    label: 'Course Management',
    icon: BookOpen,
    href: '/admin/courses',
    mobileLabel: 'Courses'
  },
  {
    id: 'projects',
    label: 'Project Moderation',
    icon: Gamepad2,
    href: '/admin/projects',
    mobileLabel: 'Projects'
  },
  {
    id: 'experiments',
    label: 'A/B Testing',
    icon: Settings,
    href: '/admin/experiments',
    mobileLabel: 'A/B Tests'
  },
  {
    id: 'cdn',
    label: 'CDN Management',
    icon: Database,
    href: '/admin/cdn',
    mobileLabel: 'CDN'
  },
  {
    id: 'subscription-plans',
    label: 'Subscription Plans',
    icon: Crown,
    href: '/admin/subscription-plans',
    mobileLabel: 'Plans'
  },
  {
    id: 'branding',
    label: 'Site Branding',
    icon: Monitor,
    href: '/admin/branding',
    mobileLabel: 'Branding'
  },
  {
    id: 'components',
    label: 'Components',
    icon: Database,
    href: '/admin/components',
    mobileLabel: 'Components'
  },
  {
    id: 'revenue-analytics',
    label: 'Revenue Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    mobileLabel: 'Revenue'
  },
  {
    id: 'email-automation',
    label: 'Email Automation',
    icon: Mail,
    href: '/admin/email-automation',
    mobileLabel: 'Email'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    href: '/admin/users',
    mobileLabel: 'Users'
  },
  ...(process.env.NODE_ENV === 'development' ? [{
    id: 'dev-tools',
    label: 'Development Tools',
    icon: Monitor,
    href: '/admin/dev-tools',
    mobileLabel: 'Dev Tools'
  }] : []),
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    mobileLabel: 'Settings'
  }
]

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy')

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          // Check if user has admin access
          const isDemoMode = process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE === 'true'
          const isDevMode = process.env.NODE_ENV === 'development'

          if (isDemoMode || isDevMode) {
            setIsAdmin(true)
            toast.success('Admin access granted (Demo Mode)')
          } else {
            // In production, implement proper admin verification
            const response = await fetch('/api/admin/verify')
            const data = await response.json()

            if (data.hasAccess) {
              setIsAdmin(true)
            } else {
              toast.error('Admin access denied')
              router.push('/dashboard')
            }
          }
        } catch (error) {
          console.error('Error checking admin access:', error)
          router.push('/dashboard')
        }
      }
    }

    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin')
    } else if (status === 'authenticated') {
      checkAdminAccess()
    }
  }, [status, session, router])

  // Monitor system health
  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const response = await fetch('/api/admin/health?type=quick')
        if (response.ok) {
          const data = await response.json()
          setSystemStatus(data.data?.status || 'healthy')
        }
      } catch (error) {
        setSystemStatus('critical')
      }
    }

    if (isAdmin) {
      checkSystemHealth()
      // Check health every 30 seconds
      const interval = setInterval(checkSystemHealth, 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mobile-container">
          <div className="animate-pulse space-y-6 py-8">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  const currentNavItem = adminNavItems.find(item => item.href === pathname)
  const statusColor = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  }[systemStatus]

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b safe-area-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="touch-target"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <div>
              <h1 className="mobile-subtitle flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                {currentNavItem?.label || 'Admin'}
              </h1>
              {subtitle && (
                <p className="mobile-caption">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", {
              'bg-green-500': systemStatus === 'healthy',
              'bg-yellow-500': systemStatus === 'warning',
              'bg-red-500': systemStatus === 'critical'
            })} />
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link href="/dashboard">
                <Home className="w-5 h-5" />
              </Link>
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="text-xs">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* System status banner */}
        {systemStatus !== 'healthy' && (
          <div className={cn(
            "px-4 py-2 text-center text-sm border-t",
            systemStatus === 'warning' ? "bg-yellow-50 text-yellow-800 border-yellow-200" : "bg-red-50 text-red-800 border-red-200"
          )}>
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            System Status: {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold">Admin Panel</span>
              </Link>
            </div>

            {/* System Status Indicator */}
            <div className="px-4 py-3">
              <div className={cn(
                "flex items-center gap-2 p-2 rounded-lg text-sm",
                systemStatus === 'healthy' ? "bg-green-50 text-green-700" :
                systemStatus === 'warning' ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"
              )}>
                <div className={cn("w-2 h-2 rounded-full", {
                  'bg-green-500': systemStatus === 'healthy',
                  'bg-yellow-500': systemStatus === 'warning',
                  'bg-red-500': systemStatus === 'critical'
                })} />
                <span>System: {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}</span>
              </div>
            </div>

            <div className="mt-2 flex-1 flex flex-col">
              <nav className="flex-1 px-4 space-y-1">
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-red-50 text-red-700 border-r-2 border-red-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5",
                          isActive ? "text-red-600" : "text-gray-400"
                        )}
                      />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="flex-shrink-0 px-4 pb-4">
                <div className="border-t pt-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 p-3 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Back to Dashboard
                  </Link>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mt-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <Badge variant="destructive" className="text-xs">Admin</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Slide-out Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black bg-opacity-25"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white mobile-slide-up">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="touch-target text-white"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto safe-area-top">
                <div className="flex items-center flex-shrink-0 px-4 mb-8">
                  <Link href="/admin" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                      <Shield className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold">Admin Panel</span>
                  </Link>
                </div>

                <nav className="px-4 space-y-1">
                  {adminNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "group flex items-center px-3 py-3 text-base font-medium rounded-lg touch-target transition-all duration-200",
                          isActive
                            ? "bg-red-50 text-red-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-4 flex-shrink-0 h-6 w-6",
                            isActive ? "text-red-600" : "text-gray-400"
                          )}
                        />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                <div className="px-4 mt-8">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 p-3 text-base text-gray-600 hover:bg-gray-50 rounded-lg transition-colors touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="w-5 h-5" />
                    Back to Dashboard
                  </Link>
                </div>
              </div>

              <div className="flex-shrink-0 p-4 border-t safe-area-bottom">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="mobile-subtitle text-gray-900 truncate">
                      {session?.user?.name}
                    </p>
                    <Badge variant="destructive" className="text-xs">Admin</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            {/* Desktop Header */}
            <div className="hidden md:block bg-white border-b">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                    {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn("flex items-center gap-2 text-sm", statusColor)}>
                      <div className={cn("w-2 h-2 rounded-full", {
                        'bg-green-500': systemStatus === 'healthy',
                        'bg-yellow-500': systemStatus === 'warning',
                        'bg-red-500': systemStatus === 'critical'
                      })} />
                      <span>System {systemStatus}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard">
                        <Home className="w-5 h-5 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bell className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="mobile-container">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden mobile-nav safe-area-bottom">
        {adminNavItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "mobile-nav-item",
                isActive && "active"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.mobileLabel}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
