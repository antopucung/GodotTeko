'use client'

import React, { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { CartProvider } from '@/context/CartContext'
import { RecentlyViewedProvider } from '@/context/RecentlyViewedContext'
// Sentry disabled for production build import { Sentry, setUserContext } from '@/sentry.client.config'
import { analytics } from '@/lib/analytics-engine'
import { abTesting } from '@/lib/ab-testing'
import { cdnManager, CDN_CONFIGS } from '@/lib/cdn-integration'

// Enterprise features integrated into existing providers

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize enterprise features
  useEffect(() => {
    const initializeEnterpriseFeatures = async () => {
      try {
        // Initialize analytics engine
        analytics.initialize()

        // Initialize A/B testing framework
        await abTesting.initialize()

        // Initialize CDN integration in production
        if (process.env.NODE_ENV === 'production' && process.env.CLOUDFLARE_API_TOKEN) {
          cdnManager.initialize(CDN_CONFIGS.production.cloudflare)
        }

        console.log('🚀 Enterprise features initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize enterprise features:', error)
        Sentry.captureException(error)
      }
    }

    initializeEnterpriseFeatures()

    // Cleanup on unmount
    return () => {
      if (typeof analytics.destroy === 'function') {
        analytics.destroy()
      }
    }
  }, [])

  return (
    <SessionProvider
      refetchInterval={5 * 60} // 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <EnhancedSessionHandler />
      <CartProvider>
        <RecentlyViewedProvider>
          {children}
        </RecentlyViewedProvider>
      </CartProvider>
    </SessionProvider>
  )
}

// Enhanced session handler with enterprise features integration
function EnhancedSessionHandler() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      
      // Set user context for Sentry
      // Sentry disabled for production build
      // setUserContext({
      //   id: session.user.id,
      //   email: session.user.email || undefined,
      //   username: session.user.name || undefined,
      //   role: session.user.role
      // })

      // Set user for analytics
      analytics.setUser(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      })

      // Set user for A/B testing
      abTesting.setUser(session.user.id)

      // Track user session
      analytics.trackEvent('auth', 'session_authenticated', {
        userId: session.user.id,
        role: session.user.role,
        method: 'session_resume'
      })
    } else if (status === 'unauthenticated') {
      // Clear user context
      setUserContext({})

      // Track anonymous session
      analytics.trackEvent('auth', 'session_anonymous', {
        timestamp: Date.now()
      })
    }
  }, [session, status])

  return null
}
