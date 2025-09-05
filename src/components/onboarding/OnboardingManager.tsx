'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserOnboarding } from './UserOnboarding'
import { PartnerOnboarding } from './PartnerOnboarding'

interface OnboardingManagerProps {
  children: React.ReactNode
}

export function OnboardingManager({ children }: OnboardingManagerProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showUserOnboarding, setShowUserOnboarding] = useState(false)
  const [showPartnerOnboarding, setShowPartnerOnboarding] = useState(false)

  useEffect(() => {
    // Only check for onboarding if user is authenticated
    if (status === 'authenticated' && session?.user) {
      checkOnboardingNeeds()
    }
  }, [status, session])

  useEffect(() => {
    // Check URL parameters for forced onboarding triggers
    const forceUserOnboarding = searchParams.get('onboarding') === 'user'
    const forcePartnerOnboarding = searchParams.get('onboarding') === 'partner'

    if (forceUserOnboarding && session?.user) {
      setShowUserOnboarding(true)
    }

    if (forcePartnerOnboarding && session?.user) {
      setShowPartnerOnboarding(true)
    }
  }, [searchParams, session])

  const checkOnboardingNeeds = async () => {
    try {
      // Check if user has completed onboarding
      const hasCompletedUserOnboarding = localStorage.getItem('godot-tekko-onboarding-completed') === 'true'

      if (!hasCompletedUserOnboarding) {
        // Check if this is a brand new user (created in last 5 minutes)
        const response = await fetch('/api/user/onboarding-status')
        if (response.ok) {
          const data = await response.json()

          if (data.shouldShowOnboarding) {
            setShowUserOnboarding(true)
            return // Don't check for partner onboarding if showing user onboarding
          }
        }
      }

      // Check for partner onboarding triggers
      const partnerTrigger = searchParams.get('partner-onboarding')
      if (partnerTrigger === 'true') {
        setShowPartnerOnboarding(true)
      }

    } catch (error) {
      console.error('Error checking onboarding needs:', error)
    }
  }

  const handleUserOnboardingComplete = () => {
    setShowUserOnboarding(false)

    // Remove onboarding parameter from URL if it exists
    if (searchParams.get('onboarding') === 'user') {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('onboarding')
      router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false })
    }
  }

  const handlePartnerOnboardingComplete = () => {
    setShowPartnerOnboarding(false)

    // Remove partner onboarding parameters from URL
    const paramsToRemove = ['partner-onboarding', 'onboarding']
    const newSearchParams = new URLSearchParams(searchParams)
    paramsToRemove.forEach(param => newSearchParams.delete(param))

    const newUrl = newSearchParams.toString()
      ? `${window.location.pathname}?${newSearchParams.toString()}`
      : window.location.pathname

    router.replace(newUrl, { scroll: false })

    // Redirect to partner dashboard if they were approved
    setTimeout(() => {
      router.push('/partner/dashboard')
    }, 1000)
  }

  return (
    <>
      {children}

      {showUserOnboarding && (
        <UserOnboarding onComplete={handleUserOnboardingComplete} />
      )}

      {showPartnerOnboarding && (
        <PartnerOnboarding onComplete={handlePartnerOnboardingComplete} />
      )}
    </>
  )
}

// Export hook for triggering onboarding programmatically
export function useOnboarding() {
  const router = useRouter()

  const triggerUserOnboarding = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('onboarding', 'user')
    router.push(currentUrl.toString())
  }

  const triggerPartnerOnboarding = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('onboarding', 'partner')
    router.push(currentUrl.toString())
  }

  return {
    triggerUserOnboarding,
    triggerPartnerOnboarding
  }
}
