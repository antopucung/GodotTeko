'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics-engine'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    // Initialize analytics if not already done
    analytics.initialize(session?.user?.id)
  }, [session])

  // Track page views
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Track page view
      analytics.trackEvent('navigation', 'page_view', {
        path: pathname,
        title: document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    }
  }, [pathname])

  // Track user identification
  useEffect(() => {
    if (session?.user?.id) {
      analytics.setUser(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      })
    }
  }, [session])

  return <>{children}</>
}

// Simple hook to use analytics in components
export function useAnalytics() {
  return {
    trackEvent: (category: string, name: string, properties?: Record<string, any>) => {
      analytics.trackEvent(category, name, properties)
    },
    trackPurchase: (data: any) => {
      analytics.trackPurchase(data)
    },
    trackAddToCart: (item: any) => {
      analytics.trackAddToCart(item)
    },
    trackRemoveFromCart: (item: any) => {
      analytics.trackRemoveFromCart(item)
    }
  }
}
