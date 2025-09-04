'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Product {
  _id: string
  title: string
  slug: { current: string }
  price: number
  salePrice?: number
  images?: Array<{ asset: { url: string } }>
  freebie: boolean
  author?: {
    name: string
  }
  category?: {
    title: string
  }
}

interface RecentlyViewedContextType {
  recentlyViewed: Product[]
  addRecentlyViewed: (product: Product) => void
  clearRecentlyViewed: () => void
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined)

const MAX_RECENTLY_VIEWED = 12
const STORAGE_KEY = 'ui8-recently-viewed'

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setRecentlyViewed(parsed)
          }
        }
      } catch (error) {
        console.warn('Error loading recently viewed products:', error)
      }
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever recentlyViewed changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed))
      } catch (error) {
        console.warn('Error saving recently viewed products:', error)
      }
    }
  }, [recentlyViewed, isLoaded])

  const addRecentlyViewed = (product: Product) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p._id !== product._id)

      // Add to front and limit to MAX_RECENTLY_VIEWED
      const updated = [product, ...filtered].slice(0, MAX_RECENTLY_VIEWED)

      return updated
    })
  }

  const clearRecentlyViewed = () => {
    setRecentlyViewed([])
  }

  const value = {
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed
  }

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  )
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext)
  if (context === undefined) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider')
  }
  return context
}

// Hook to track product views
export function useTrackProductView() {
  const { addRecentlyViewed } = useRecentlyViewed()

  const trackView = (product: Product) => {
    // Add a small delay to avoid tracking accidental/quick views
    setTimeout(() => {
      addRecentlyViewed(product)
    }, 1000) // 1 second delay
  }

  return trackView
}
