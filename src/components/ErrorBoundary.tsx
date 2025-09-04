'use client'

import React, { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
  name?: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, you would send this to your error monitoring service
      // e.g., Sentry, LogRocket, Bugsnag, etc.
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: null, // Add user ID if available
        level: this.props.level || 'component',
        name: this.props.name || 'Unknown Component'
      }

      // Example: Send to monitoring service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // })

      console.log('Error reported:', errorReport)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    // Clear error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Unknown Error'}`)
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error Message: ${error?.message || 'Unknown'}
Stack Trace: ${error?.stack || 'Not available'}
Component Stack: ${errorInfo?.componentStack || 'Not available'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:

`)

    window.open(`mailto:support@same.new?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorId, errorInfo } = this.state
      const { level = 'component', name = 'Component' } = this.props

      // Critical errors get a full-screen treatment
      if (level === 'critical' || level === 'page') {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">
                  Something went wrong
                </CardTitle>
                <CardDescription>
                  We encountered an unexpected error while loading this {level}.
                  Don't worry, we've been notified and are working on a fix.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {process.env.NODE_ENV === 'development' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm font-mono">
                      <details>
                        <summary className="cursor-pointer font-sans font-medium mb-2">
                          Developer Info (click to expand)
                        </summary>
                        <div className="space-y-2">
                          <div><strong>Error:</strong> {error?.message}</div>
                          <div><strong>Error ID:</strong> {errorId}</div>
                          <div><strong>Component:</strong> {name}</div>
                          {error?.stack && (
                            <div>
                              <strong>Stack:</strong>
                              <pre className="text-xs mt-1 whitespace-pre-wrap">
                                {error.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={this.handleReload} variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                  <Button onClick={this.handleReportBug} variant="outline" size="sm" className="flex-1">
                    <Bug className="w-4 h-4 mr-2" />
                    Report Bug
                  </Button>
                </div>

                {errorId && (
                  <div className="text-center text-xs text-gray-500">
                    Error ID: {errorId}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      }

      // Component-level errors get a smaller inline treatment
      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                {name} Error
              </h3>
              <p className="text-sm text-red-700 mb-3">
                This component encountered an error. You can try to reload it or continue using the rest of the page.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <details className="mb-3">
                  <summary className="text-xs text-red-600 cursor-pointer mb-1">
                    Developer Details
                  </summary>
                  <div className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                    {error?.message}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={this.handleRetry} className="bg-red-600 hover:bg-red-700">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                <Button size="sm" variant="outline" onClick={this.handleReportBug}>
                  <Bug className="w-3 h-3 mr-1" />
                  Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    console.error('useErrorHandler caught error:', error)
  }, [])

  // Throw error to be caught by ErrorBoundary
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError, hasError: !!error }
}

// Async error handling hook
export function useAsyncError() {
  const [asyncError, setAsyncError] = React.useState<Error | null>(null)

  const throwAsyncError = React.useCallback((error: Error) => {
    setAsyncError(error)
  }, [])

  React.useEffect(() => {
    if (asyncError) {
      throw asyncError
    }
  }, [asyncError])

  return throwAsyncError
}
