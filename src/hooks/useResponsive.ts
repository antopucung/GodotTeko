'use client'

import { useState, useEffect } from 'react'
import { useMediaQuery } from './useCardAnimations'

// Responsive design hook with common breakpoints
export function useResponsive() {
  // Tailwind CSS breakpoints
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  const isLargeDesktop = useMediaQuery('(min-width: 1440px)')

  // Specific breakpoints for UI8 design
  const isSmallMobile = useMediaQuery('(max-width: 430px)')
  const isLargeMobile = useMediaQuery('(min-width: 431px) and (max-width: 640px)')
  const isSmallTablet = useMediaQuery('(min-width: 641px) and (max-width: 768px)')
  const isLargeTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')

  // Device orientation
  const isPortrait = useMediaQuery('(orientation: portrait)')
  const isLandscape = useMediaQuery('(orientation: landscape)')

  // High DPI displays
  const isRetina = useMediaQuery('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)')

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  // Calculate grid columns based on screen size
  const getGridColumns = () => {
    if (isSmallMobile) return 1
    if (isLargeMobile) return 1
    if (isTablet) return 2
    if (isDesktop) return 3
    if (isLargeDesktop) return 4
    return 1
  }

  // Get appropriate image sizes for responsive images
  const getImageSizes = () => {
    if (isMobile) return '(max-width: 640px) 100vw'
    if (isTablet) return '(max-width: 1024px) 50vw'
    if (isDesktop) return '(max-width: 1440px) 33vw'
    return '25vw'
  }

  // Get container max width
  const getContainerMaxWidth = () => {
    if (isMobile) return '100%'
    if (isTablet) return '768px'
    if (isDesktop) return '1024px'
    if (isLargeDesktop) return '1440px'
    return '100%'
  }

  // Get appropriate spacing
  const getSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    const spacingMap = {
      xs: isMobile ? 'p-2' : isTablet ? 'p-3' : 'p-4',
      sm: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6',
      md: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8',
      lg: isMobile ? 'p-6' : isTablet ? 'p-8' : 'p-12',
      xl: isMobile ? 'p-8' : isTablet ? 'p-12' : 'p-16'
    }
    return spacingMap[size]
  }

  // Get appropriate text sizes
  const getTextSize = (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl') => {
    const textSizeMap = {
      xs: isMobile ? 'text-xs' : 'text-sm',
      sm: isMobile ? 'text-sm' : 'text-base',
      base: isMobile ? 'text-base' : 'text-lg',
      lg: isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl',
      xl: isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl',
      '2xl': isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl',
      '3xl': isMobile ? 'text-3xl' : isTablet ? 'text-4xl' : 'text-5xl'
    }
    return textSizeMap[size]
  }

  // Navigation behavior
  const shouldUseMobileNav = isMobile || (isTablet && isPortrait)

  // Card layout preferences
  const cardLayout = {
    aspectRatio: isMobile ? 'aspect-square' : 'aspect-[4/3]',
    imageSize: isMobile ? 'h-32' : isTablet ? 'h-40' : 'h-48',
    padding: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6',
    gap: isMobile ? 'gap-3' : isTablet ? 'gap-4' : 'gap-6'
  }

  // Modal and overlay behavior
  const modalBehavior = {
    shouldUseFullscreen: isMobile,
    backdropBlur: isMobile ? 'backdrop-blur-sm' : 'backdrop-blur-md',
    padding: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8'
  }

  // Animation preferences based on device
  const animationPreferences = {
    reduceMotion: false, // This could be detected from user preferences
    duration: isTouchDevice ? 'duration-200' : 'duration-300',
    easing: 'ease-out'
  }

  return {
    // Device type detection
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,

    // Specific breakpoints
    isSmallMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,

    // Device characteristics
    isPortrait,
    isLandscape,
    isRetina,
    isTouchDevice,

    // Helper functions
    getGridColumns,
    getImageSizes,
    getContainerMaxWidth,
    getSpacing,
    getTextSize,

    // Layout preferences
    shouldUseMobileNav,
    cardLayout,
    modalBehavior,
    animationPreferences,

    // Utility classes
    containerClass: `w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-[${getContainerMaxWidth()}]`,
    gridClass: `grid gap-4 grid-cols-1 ${isTablet ? 'md:grid-cols-2' : ''} ${isDesktop ? 'lg:grid-cols-3' : ''} ${isLargeDesktop ? 'xl:grid-cols-4' : ''}`,
    textResponsive: {
      hero: getTextSize('3xl'),
      title: getTextSize('2xl'),
      subtitle: getTextSize('lg'),
      body: getTextSize('base'),
      caption: getTextSize('sm')
    }
  }
}

// Hook for detecting device capabilities
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    hasHover: false,
    hasPointer: false,
    hasFinePointer: false,
    prefersReducedMotion: false,
    isOnline: true,
    connectionType: 'unknown'
  })

  useEffect(() => {
    // Detect hover capability
    const hasHover = window.matchMedia('(hover: hover)').matches

    // Detect pointer type
    const hasPointer = window.matchMedia('(pointer: coarse)').matches
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Detect online status
    const isOnline = navigator.onLine

    // Detect connection type (experimental)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const connectionType = connection?.effectiveType || 'unknown'

    setCapabilities({
      hasHover,
      hasPointer,
      hasFinePointer,
      prefersReducedMotion,
      isOnline,
      connectionType
    })

    // Listen for online/offline changes
    const handleOnline = () => setCapabilities(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setCapabilities(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return capabilities
}

// Hook for mobile navigation state management
export function useMobileNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isDesktop } = useResponsive()

  // Auto-close mobile menu on desktop
  useEffect(() => {
    if (isDesktop && isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }, [isDesktop, isMobileMenuOpen])

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const openMobileMenu = () => setIsMobileMenuOpen(true)

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    openMobileMenu
  }
}

// Hook for responsive font sizes based on content
export function useResponsiveFontSize(baseSize: number = 16) {
  const { isMobile, isTablet } = useResponsive()

  const getFontSize = (scale: number = 1) => {
    let size = baseSize * scale

    if (isMobile) {
      size *= 0.9 // Slightly smaller on mobile
    } else if (isTablet) {
      size *= 0.95 // Slightly smaller on tablet
    }

    return `${size}px`
  }

  return { getFontSize }
}

// Hook for adaptive loading based on connection
export function useAdaptiveLoading() {
  const { connectionType } = useDeviceCapabilities()
  const { isMobile } = useResponsive()

  const shouldUseReducedQuality = connectionType === 'slow-2g' || connectionType === '2g'
  const shouldLazyLoad = isMobile || shouldUseReducedQuality
  const shouldPreload = connectionType === '4g' && !isMobile

  const getImageQuality = () => {
    if (shouldUseReducedQuality) return 60
    if (isMobile) return 75
    return 85
  }

  const getImageSize = (baseWidth: number) => {
    if (shouldUseReducedQuality) return Math.round(baseWidth * 0.7)
    if (isMobile) return Math.round(baseWidth * 0.8)
    return baseWidth
  }

  return {
    shouldUseReducedQuality,
    shouldLazyLoad,
    shouldPreload,
    getImageQuality,
    getImageSize
  }
}
