'use client'

import React, { useEffect, useState, createContext, useContext } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Smartphone,
  X
} from 'lucide-react'

interface ServiceWorkerContextType {
  isOnline: boolean
  isUpdateAvailable: boolean
  isInstallable: boolean
  swRegistration: ServiceWorkerRegistration | null
  updateApp: () => void
  installApp: () => void
  cacheInfo: any
  clearCache: () => Promise<void>
}

const ServiceWorkerContext = createContext<ServiceWorkerContextType | null>(null)

export function useServiceWorker() {
  const context = useContext(ServiceWorkerContext)
  if (!context) {
    throw new Error('useServiceWorker must be used within ServiceWorkerProvider')
  }
  return context
}

interface ServiceWorkerProviderProps {
  children: React.ReactNode
  enableNotifications?: boolean
  enableInstallPrompt?: boolean
}

export function ServiceWorkerProvider({
  children,
  enableNotifications = true,
  enableInstallPrompt = true
}: ServiceWorkerProviderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [cacheInfo, setCacheInfo] = useState<any>(null)

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      registerServiceWorker()
    }
  }, [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (enableNotifications) {
        toast.success('Connection restored', {
          description: 'You are back online',
          icon: <Wifi className="w-4 h-4" />
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      if (enableNotifications) {
        toast.error('Connection lost', {
          description: 'You are now offline. Some features may be limited.',
          icon: <WifiOff className="w-4 h-4" />,
          duration: 5000
        })
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial state
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enableNotifications])

  // PWA install prompt detection
  useEffect(() => {
    if (!enableInstallPrompt) return

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setIsInstallable(true)

      // Show install prompt after a delay
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 5000)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstallable(false)
      setShowInstallPrompt(false)

      if (enableNotifications) {
        toast.success('App installed!', {
          description: 'Godot Tekko has been added to your home screen',
          icon: <CheckCircle className="w-4 h-4" />
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [enableInstallPrompt, enableNotifications])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      setSwRegistration(registration)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsUpdateAvailable(true)

              if (enableNotifications) {
                toast.info('Update available', {
                  description: 'A new version of the app is ready',
                  action: {
                    label: 'Update',
                    onClick: updateApp
                  },
                  duration: 10000
                })
              }
            }
          })
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

      console.log('✅ Service Worker registered successfully')
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
    }
  }

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, payload } = event.data || {}

    switch (type) {
      case 'CACHE_UPDATED':
        if (enableNotifications) {
          toast.success('Content cached for offline use')
        }
        break
      case 'OFFLINE_FALLBACK':
        if (enableNotifications) {
          toast.warning('Loading from cache (offline)')
        }
        break
    }
  }

  const updateApp = () => {
    if (swRegistration?.waiting) {
      // Send message to skip waiting
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })

      // Listen for controlling change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt')
      } else {
        console.log('❌ User dismissed the install prompt')
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const getCacheInfo = async () => {
    if (swRegistration) {
      const messageChannel = new MessageChannel()

      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          setCacheInfo(event.data)
          resolve(event.data)
        }

        swRegistration.active?.postMessage(
          { type: 'GET_CACHE_INFO' },
          [messageChannel.port2]
        )
      })
    }
  }

  const clearCache = async () => {
    if (swRegistration) {
      const messageChannel = new MessageChannel()

      return new Promise<void>((resolve) => {
        messageChannel.port1.onmessage = () => {
          setCacheInfo(null)
          toast.success('Cache cleared successfully')
          resolve()
        }

        swRegistration.active?.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        )
      })
    }
  }

  const contextValue: ServiceWorkerContextType = {
    isOnline,
    isUpdateAvailable,
    isInstallable,
    swRegistration,
    updateApp,
    installApp,
    cacheInfo,
    clearCache
  }

  return (
    <ServiceWorkerContext.Provider value={contextValue}>
      {children}

      {/* PWA Install Prompt */}
      {showInstallPrompt && isInstallable && (
        <PWAInstallPrompt
          onInstall={installApp}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}

      {/* Update Available Notification */}
      {isUpdateAvailable && (
        <UpdateAvailableNotification onUpdate={updateApp} />
      )}

      {/* Offline Indicator */}
      {!isOnline && <OfflineIndicator />}
    </ServiceWorkerContext.Provider>
  )
}

// PWA Install Prompt Component
interface PWAInstallPromptProps {
  onInstall: () => void
  onDismiss: () => void
}

function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="shadow-lg border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Install App</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Install Godot Tekko for faster access and offline browsing
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button onClick={onInstall} size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
            <Button variant="outline" onClick={onDismiss} size="sm">
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Update Available Notification
interface UpdateAvailableNotificationProps {
  onUpdate: () => void
}

function UpdateAvailableNotification({ onUpdate }: UpdateAvailableNotificationProps) {
  const [showUpdate, setShowUpdate] = useState(true)

  if (!showUpdate) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-blue-800">Update available</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={onUpdate} className="h-6 px-2 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Update
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUpdate(false)}
              className="h-6 px-2 text-xs"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Offline Indicator
function OfflineIndicator() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        Offline
      </div>
    </div>
  )
}

// Cache Management Component
export function CacheManager() {
  const { cacheInfo, clearCache } = useServiceWorker()
  const [loading, setLoading] = useState(false)

  const handleClearCache = async () => {
    setLoading(true)
    try {
      await clearCache()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cache Management</CardTitle>
        <CardDescription>
          Manage offline content and cached data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cacheInfo && (
          <div className="space-y-2">
            <h4 className="font-medium">Cache Information</h4>
            {Object.entries(cacheInfo).map(([cacheName, info]: [string, any]) => (
              <div key={cacheName} className="flex justify-between text-sm">
                <span>{cacheName}</span>
                <span>{info.count} items ({(info.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleClearCache}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Clear Cache
        </Button>
      </CardContent>
    </Card>
  )
}

// Offline Page Component
export function OfflinePage() {
  const { isOnline } = useServiceWorker()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle>You're Offline</CardTitle>
          <CardDescription>
            Check your internet connection and try again
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            You can still browse previously viewed products and access your cached content.
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => window.location.reload()}
              disabled={!isOnline}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>

            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>

          {isOnline && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Connection restored! Click retry to continue.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
