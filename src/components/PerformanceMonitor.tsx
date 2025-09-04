'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Clock,
  Zap,
  Eye,
  Wifi,
  HardDrive,
  Monitor,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'

interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number  // Largest Contentful Paint
  FID?: number  // First Input Delay
  CLS?: number  // Cumulative Layout Shift
  FCP?: number  // First Contentful Paint
  TTFB?: number // Time to First Byte

  // Navigation Timing
  domContentLoaded?: number
  loadComplete?: number

  // Resource Timing
  totalResources?: number
  totalSize?: number
  imageCount?: number
  scriptCount?: number
  stylesheetCount?: number

  // Network Information
  connectionType?: string
  downlink?: number
  saveData?: boolean

  // Memory Usage (if available)
  usedJSHeapSize?: number
  totalJSHeapSize?: number
  jsHeapSizeLimit?: number
}

interface PerformanceGrade {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  color: string
  description: string
}

const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 }
}

export function PerformanceMonitor({ showDetailed = false }: { showDetailed?: boolean }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isVisible, setIsVisible] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)

  // Collect performance metrics
  const collectMetrics = useCallback(async () => {
    if (typeof window === 'undefined') return

    setIsCollecting(true)

    try {
      const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const resourceEntries = performance.getEntriesByType('resource')

      const newMetrics: PerformanceMetrics = {
        domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
        loadComplete: perfEntries.loadEventEnd - perfEntries.loadEventStart,
        TTFB: perfEntries.responseStart - perfEntries.requestStart,
        totalResources: resourceEntries.length,
        imageCount: resourceEntries.filter(entry => entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)).length,
        scriptCount: resourceEntries.filter(entry => entry.name.includes('.js')).length,
        stylesheetCount: resourceEntries.filter(entry => entry.name.includes('.css')).length
      }

      // Calculate total resource size
      let totalSize = 0
      resourceEntries.forEach(entry => {
        if ('transferSize' in entry) {
          totalSize += (entry as any).transferSize || 0
        }
      })
      newMetrics.totalSize = totalSize

      // Network Information API
      const connection = (navigator as any).connection
      if (connection) {
        newMetrics.connectionType = connection.effectiveType
        newMetrics.downlink = connection.downlink
        newMetrics.saveData = connection.saveData
      }

      // Memory Usage API
      const memory = (performance as any).memory
      if (memory) {
        newMetrics.usedJSHeapSize = memory.usedJSHeapSize
        newMetrics.totalJSHeapSize = memory.totalJSHeapSize
        newMetrics.jsHeapSizeLimit = memory.jsHeapSizeLimit
      }

      setMetrics(newMetrics)
    } catch (error) {
      console.error('Error collecting performance metrics:', error)
    } finally {
      setIsCollecting(false)
    }
  }, [])

  // Collect Core Web Vitals using PerformanceObserver
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1] as any
      setMetrics(prev => ({ ...prev, LCP: lastEntry.startTime }))
    })

    // First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        setMetrics(prev => ({ ...prev, FID: (entry as any).processingStart - entry.startTime }))
      })
    })

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0
      entryList.getEntries().forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      })
      setMetrics(prev => ({ ...prev, CLS: clsValue }))
    })

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, FCP: entry.startTime }))
        }
      })
    })

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      fidObserver.observe({ entryTypes: ['first-input'] })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      fcpObserver.observe({ entryTypes: ['paint'] })
    } catch (error) {
      console.error('PerformanceObserver not supported:', error)
    }

    // Initial metrics collection
    collectMetrics()

    return () => {
      lcpObserver.disconnect()
      fidObserver.disconnect()
      clsObserver.disconnect()
      fcpObserver.disconnect()
    }
  }, [collectMetrics])

  // Grade calculation
  const calculateGrade = (metric: keyof typeof THRESHOLDS, value?: number): PerformanceGrade => {
    if (!value || !THRESHOLDS[metric]) {
      return { score: 0, grade: 'F', color: 'text-gray-500', description: 'No data' }
    }

    const { good, poor } = THRESHOLDS[metric]
    let score: number
    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    let color: string
    let description: string

    if (value <= good) {
      score = 90 + (10 * (good - value) / good)
      grade = 'A'
      color = 'text-green-600'
      description = 'Excellent'
    } else if (value <= poor) {
      score = 50 + (40 * (poor - value) / (poor - good))
      grade = value <= good * 1.5 ? 'B' : 'C'
      color = value <= good * 1.5 ? 'text-blue-600' : 'text-yellow-600'
      description = value <= good * 1.5 ? 'Good' : 'Needs Improvement'
    } else {
      score = Math.max(0, 50 * (poor * 2 - value) / poor)
      grade = score > 25 ? 'D' : 'F'
      color = score > 25 ? 'text-orange-600' : 'text-red-600'
      description = score > 25 ? 'Poor' : 'Very Poor'
    }

    return { score: Math.round(score), grade, color, description }
  }

  // Overall performance score
  const getOverallScore = (): PerformanceGrade => {
    const scores = [
      calculateGrade('LCP', metrics.LCP),
      calculateGrade('FID', metrics.FID),
      calculateGrade('CLS', metrics.CLS ? metrics.CLS * 1000 : undefined),
      calculateGrade('FCP', metrics.FCP),
      calculateGrade('TTFB', metrics.TTFB)
    ].filter(grade => grade.score > 0)

    if (scores.length === 0) {
      return { score: 0, grade: 'F', color: 'text-gray-500', description: 'No data available' }
    }

    const avgScore = scores.reduce((sum, grade) => sum + grade.score, 0) / scores.length
    return calculateGrade('LCP', avgScore <= 90 ? 2000 : avgScore <= 70 ? 3000 : avgScore <= 50 ? 4500 : 6000)
  }

  // Format bytes
  const formatBytes = (bytes?: number): string => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Format milliseconds
  const formatMs = (ms?: number): string => {
    if (!ms) return '0ms'
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
  }

  const overallGrade = getOverallScore()

  if (!showDetailed && !isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>
    )
  }

  return (
    <div className={showDetailed ? '' : 'fixed bottom-4 right-4 z-50 w-96'}>
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              {!showDetailed && (
                <Button
                  onClick={() => setIsVisible(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              )}
              <Button
                onClick={collectMetrics}
                variant="outline"
                size="sm"
                disabled={isCollecting}
              >
                <RefreshCw className={`w-4 h-4 ${isCollecting ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time performance metrics and Core Web Vitals
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall Score */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-600">Overall Score</span>
              <p className={`text-2xl font-bold ${overallGrade.color}`}>
                {overallGrade.grade}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-lg font-semibold ${overallGrade.color}`}>
                {overallGrade.score}/100
              </span>
              <p className="text-xs text-gray-500">{overallGrade.description}</p>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Core Web Vitals
            </h4>

            {/* LCP */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Largest Contentful Paint</span>
                <span className={calculateGrade('LCP', metrics.LCP).color}>
                  {formatMs(metrics.LCP)}
                </span>
              </div>
              <Progress
                value={Math.min(100, ((THRESHOLDS.LCP.poor - (metrics.LCP || 0)) / THRESHOLDS.LCP.poor) * 100)}
                className="h-2"
              />
            </div>

            {/* FID */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>First Input Delay</span>
                <span className={calculateGrade('FID', metrics.FID).color}>
                  {formatMs(metrics.FID)}
                </span>
              </div>
              <Progress
                value={Math.min(100, ((THRESHOLDS.FID.poor - (metrics.FID || 0)) / THRESHOLDS.FID.poor) * 100)}
                className="h-2"
              />
            </div>

            {/* CLS */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Cumulative Layout Shift</span>
                <span className={calculateGrade('CLS', metrics.CLS ? metrics.CLS * 1000 : undefined).color}>
                  {metrics.CLS ? metrics.CLS.toFixed(3) : 'N/A'}
                </span>
              </div>
              <Progress
                value={Math.min(100, ((THRESHOLDS.CLS.poor - (metrics.CLS || 0)) / THRESHOLDS.CLS.poor) * 100)}
                className="h-2"
              />
            </div>
          </div>

          {/* Additional Metrics */}
          {showDetailed && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timing Metrics
              </h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">First Contentful Paint</span>
                  <p className="font-medium">{formatMs(metrics.FCP)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Time to First Byte</span>
                  <p className="font-medium">{formatMs(metrics.TTFB)}</p>
                </div>
                <div>
                  <span className="text-gray-600">DOM Content Loaded</span>
                  <p className="font-medium">{formatMs(metrics.domContentLoaded)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Load Complete</span>
                  <p className="font-medium">{formatMs(metrics.loadComplete)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resource Information */}
          {showDetailed && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Resources
              </h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Total Size</span>
                  <p className="font-medium">{formatBytes(metrics.totalSize)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Resources</span>
                  <p className="font-medium">{metrics.totalResources || 0}</p>
                </div>
                <div>
                  <span className="text-gray-600">Images</span>
                  <p className="font-medium">{metrics.imageCount || 0}</p>
                </div>
                <div>
                  <span className="text-gray-600">Scripts</span>
                  <p className="font-medium">{metrics.scriptCount || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Network Information */}
          {metrics.connectionType && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Network
              </h4>

              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">
                  {metrics.connectionType?.toUpperCase()}
                </Badge>
                {metrics.downlink && (
                  <span className="text-gray-600">
                    {metrics.downlink} Mbps
                  </span>
                )}
                {metrics.saveData && (
                  <Badge variant="secondary">Data Saver</Badge>
                )}
              </div>
            </div>
          )}

          {/* Memory Usage */}
          {metrics.usedJSHeapSize && showDetailed && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Memory Usage
              </h4>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Used Heap</span>
                  <span>{formatBytes(metrics.usedJSHeapSize)}</span>
                </div>
                <Progress
                  value={(metrics.usedJSHeapSize / (metrics.totalJSHeapSize || 1)) * 100}
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {formatBytes(metrics.usedJSHeapSize)} / {formatBytes(metrics.totalJSHeapSize)}
                </p>
              </div>
            </div>
          )}

          {/* Performance Tips */}
          {showDetailed && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recommendations
              </h4>

              <div className="space-y-2 text-sm">
                {metrics.LCP && metrics.LCP > THRESHOLDS.LCP.good && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <span>Consider optimizing images and reducing server response time to improve LCP.</span>
                  </div>
                )}

                {metrics.CLS && metrics.CLS > THRESHOLDS.CLS.good && (
                  <div className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                    <Info className="w-4 h-4 text-orange-600 mt-0.5" />
                    <span>Add size attributes to images and avoid inserting content above existing content.</span>
                  </div>
                )}

                {metrics.FID && metrics.FID > THRESHOLDS.FID.good && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 rounded">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span>Reduce JavaScript execution time and split large tasks into smaller ones.</span>
                  </div>
                )}

                {!metrics.LCP && !metrics.FID && !metrics.CLS && (
                  <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Great job! Your site performance looks good.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceMonitor
