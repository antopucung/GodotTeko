'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/styles/component-variants'
import {
  User,
  Download,
  CreditCard,
  Settings,
  Star,
  Package,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  ShoppingCart,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

const dashboardNavItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Home,
    href: '/dashboard',
    mobileLabel: 'Home'
  },
  {
    id: 'downloads',
    label: 'Downloads',
    icon: Download,
    href: '/dashboard/downloads',
    mobileLabel: 'Downloads'
  },
  {
    id: 'licenses',
    label: 'Licenses',
    icon: Package,
    href: '/dashboard/licenses',
    mobileLabel: 'Licenses'
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: CreditCard,
    href: '/dashboard/orders',
    mobileLabel: 'Orders'
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: Star,
    href: '/dashboard/favorites',
    mobileLabel: 'Favorites'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    mobileLabel: 'Settings'
  }
]

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentTabIndex, setCurrentTabIndex] = useState(0)

  // Find current tab index for mobile swipe navigation
  useEffect(() => {
    const currentIndex = dashboardNavItems.findIndex(item => item.href === pathname)
    if (currentIndex >= 0) {
      setCurrentTabIndex(currentIndex)
    }
  }, [pathname])

  // Handle swipe navigation on mobile
  const handleSwipeNavigation = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left'
      ? Math.min(currentTabIndex + 1, dashboardNavItems.length - 1)
      : Math.max(currentTabIndex - 1, 0)

    if (newIndex !== currentTabIndex) {
      router.push(dashboardNavItems[newIndex].href)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mobile-container">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/dashboard')
    return null
  }

  const currentNavItem = dashboardNavItems.find(item => item.href === pathname)

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
              <h1 className="mobile-subtitle">{currentNavItem?.label || 'Dashboard'}</h1>
              {subtitle && (
                <p className="mobile-caption">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link href="/search">
                <Search className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link href="/cart">
                <ShoppingCart className="w-5 h-5" />
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

        {/* Mobile Swipe Navigation Hint */}
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSwipeNavigation('right')}
            disabled={currentTabIndex === 0}
            className="touch-target"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-xs">
              {currentTabIndex > 0 ? dashboardNavItems[currentTabIndex - 1].mobileLabel : ''}
            </span>
          </Button>

          <div className="flex gap-1">
            {dashboardNavItems.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentTabIndex ? "bg-blue-600" : "bg-blue-200"
                )}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSwipeNavigation('left')}
            disabled={currentTabIndex === dashboardNavItems.length - 1}
            className="touch-target"
          >
            <span className="text-xs">
              {currentTabIndex < dashboardNavItems.length - 1 ? dashboardNavItems[currentTabIndex + 1].mobileLabel : ''}
            </span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GT</span>
                </div>
                <span className="text-xl font-bold">Dashboard</span>
              </Link>
            </div>

            <div className="mt-8 flex-1 flex flex-col">
              <nav className="flex-1 px-4 space-y-1">
                {dashboardNavItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5",
                          isActive ? "text-blue-600" : "text-gray-400"
                        )}
                      />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="flex-shrink-0 px-4 pb-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
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
                  <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">UI8</span>
                    </div>
                    <span className="text-xl font-bold">Dashboard</span>
                  </Link>
                </div>

                <nav className="px-4 space-y-1">
                  {dashboardNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "group flex items-center px-3 py-3 text-base font-medium rounded-lg touch-target transition-all duration-200",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-4 flex-shrink-0 h-6 w-6",
                            isActive ? "text-blue-600" : "text-gray-400"
                          )}
                        />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
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
                    <p className="mobile-caption text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
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
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/search">
                        <Search className="w-5 h-5 mr-2" />
                        Search
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/cart">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Cart
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
        {dashboardNavItems.slice(0, 5).map((item) => {
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
