'use client'

import { useRef, useEffect, useState } from 'react'

// Enhanced card animations with intersection observer
interface CardAnimationOptions {
  staggerDelay?: number
  threshold?: number
  enableStagger?: boolean
  enableHover?: boolean
  enableInView?: boolean
}

export function useCardAnimations(
  index: number = 0,
  options: CardAnimationOptions = {}
) {
  const {
    staggerDelay = 100,
    threshold = 0.15,
    enableStagger = true,
    enableHover = true,
    enableInView = true
  } = options

  const cardRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    if (!enableInView || !cardRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin: '50px 0px' }
    )

    observer.observe(cardRef.current)

    return () => observer.disconnect()
  }, [threshold, enableInView])

  // Staggered animation classes
  const getAnimationClass = () => {
    if (!enableInView) return ''

    const baseClass = 'scroll-fade-in'
    const visibleClass = isVisible ? 'visible' : ''
    const staggerClass = enableStagger && isVisible ? 'stagger-fade-in' : ''

    return `${baseClass} ${visibleClass} ${staggerClass}`.trim()
  }

  // Animation delay for staggered effects
  const getAnimationDelay = () => {
    if (!enableStagger || !isVisible) return 0
    return index * staggerDelay
  }

  // Hover handlers
  const handleMouseEnter = () => {
    if (enableHover) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (enableHover) {
      setIsHovered(false)
    }
  }

  return {
    cardRef,
    isVisible,
    isHovered,
    animationClass: getAnimationClass(),
    animationDelay: getAnimationDelay(),
    handleMouseEnter,
    handleMouseLeave
  }
}

// Micro-interactions for buttons and interactive elements
export function useMicroInteractions() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const buttonClass = `
    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
    ${isPressed ? 'scale-95' : ''}
    ${isHovered ? 'scale-105' : ''}
    transition-all duration-150 ease-in-out
  `.trim()

  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false)
      setIsPressed(false)
    },
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false)
  }

  return {
    isLoading,
    isPressed,
    isHovered,
    setIsLoading,
    buttonClass,
    handlers
  }
}

// Count animation for numbers (likes, views, etc.)
export function useCountAnimation(
  targetValue: number,
  duration: number = 1000,
  trigger: boolean = true
) {
  const [currentValue, setCurrentValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!trigger) return

    setIsAnimating(true)
    const startTime = Date.now()
    const startValue = currentValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      const newValue = Math.round(
        startValue + (targetValue - startValue) * easedProgress
      )

      setCurrentValue(newValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [targetValue, duration, trigger])

  return {
    currentValue,
    isAnimating
  }
}

// Image loading with fade-in effect
export function useImageLoading(src: string) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!src) return

    const img = new Image()
    img.onload = () => setIsLoaded(true)
    img.onerror = () => setIsError(true)
    img.src = src

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  const imageProps = {
    ref: imgRef,
    className: `transition-opacity duration-500 ${
      isLoaded ? 'opacity-100' : 'opacity-0'
    }`,
    onLoad: () => setIsLoaded(true),
    onError: () => setIsError(true)
  }

  return {
    isLoaded,
    isError,
    imageProps
  }
}

// Performance-optimized scroll listener
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  const [isScrollingDown, setIsScrollingDown] = useState(false)

  useEffect(() => {
    let previousScrollY = 0
    let ticking = false

    const updateScrollPosition = () => {
      const currentScrollY = window.scrollY

      setScrollY(currentScrollY)
      setIsScrollingDown(currentScrollY > previousScrollY)

      previousScrollY = currentScrollY
      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition)
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    scrollY,
    isScrollingDown
  }
}

// Intersection observer for multiple elements
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [entries, setEntries] = useState<IntersectionObserverEntry[]>([])
  const observer = useRef<IntersectionObserver | null>(null)

  const { threshold = 0.1, rootMargin = '0px' } = options

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (observerEntries) => {
        setEntries(observerEntries)
      },
      { threshold, rootMargin }
    )

    return () => observer.current?.disconnect()
  }, [threshold, rootMargin])

  const observe = (element: Element) => {
    observer.current?.observe(element)
  }

  const unobserve = (element: Element) => {
    observer.current?.unobserve(element)
  }

  return {
    entries,
    observe,
    unobserve
  }
}

// Debounced value hook for search inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Local storage with SSR safety
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

// Media query hook for responsive design
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    componentMountTime: 0
  })

  useEffect(() => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      setMetrics(prev => ({
        ...prev,
        componentMountTime: endTime - startTime
      }))
    }
  }, [])

  const measureRender = (callback: () => void) => {
    const startTime = performance.now()
    callback()
    const endTime = performance.now()

    setMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime
    }))
  }

  return {
    metrics,
    measureRender
  }
}
