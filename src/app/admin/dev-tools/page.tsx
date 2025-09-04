'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Monitor,
  Activity,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Trash2,
  TestTube,
  Settings,
  Database,
  Zap,
  FileText,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/styles/component-variants'
import { toast } from 'sonner'

interface DevStatus {
  paymentIntents: number
  subscriptions: number
  customers: number
  pendingWebhooks: number
}

interface DevEvent {
  event: string
  timestamp: string
  details?: any
}

export default function DevToolsPage() {
  const [status, setStatus] = useState<DevStatus | null>(null)
  const [events, setEvents] = useState<DevEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = async () => {
    setLoading(true)
    setIsRefreshing(true)
    try {
      // Get mock Stripe status
      const response = await fetch('/api/dev/stripe-status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
        setEvents(data.recentEvents || [])
      }
    } catch (error) {
      console.error('Failed to fetch dev data:', error)
      toast.error('Failed to load development data')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const clearData = async () => {
    try {
      await fetch('/api/dev/stripe-clear', { method: 'POST' })
      await refreshData()
      toast.success('Development data cleared successfully')
    } catch (error) {
      console.error('Failed to clear data:', error)
      toast.error('Failed to clear development data')
    }
  }

  const runTestScenario = async (scenario: string) => {
    try {
      await fetch('/api/dev/test-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      })
      await refreshData()
      toast.success(`Test scenario "${scenario}" executed successfully`)
    } catch (error) {
      console.error('Failed to run test scenario:', error)
      toast.error('Failed to run test scenario')
    }
  }

  const generateTransactionData = async (type: string, count?: number) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/generate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, count })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        await refreshData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate data')
      }
    } catch (error) {
      console.error('Failed to generate transaction data:', error)
      toast.error('Failed to generate transaction data')
    } finally {
      setLoading(false)
    }
  }

  const testScenarios = [
    {
      id: 'successful_purchase',
      name: 'Successful Purchase Flow',
      icon: '🛒',
      description: 'Simulate a complete successful purchase'
    },
    {
      id: 'failed_payment',
      name: 'Failed Payment Flow',
      icon: '❌',
      description: 'Test payment failure handling'
    },
    {
      id: 'subscription_flow',
      name: 'Subscription Flow',
      icon: '🔄',
      description: 'Test subscription creation and management'
    },
    {
      id: 'access_pass_flow',
      name: 'Access Pass Flow',
      icon: '👑',
      description: 'Test all-access pass functionality'
    }
  ]

  if (process.env.NODE_ENV !== 'development') {
    return (
      <AdminLayout title="Development Tools" subtitle="Development environment tools and testing utilities">
        <Card className="mobile-card">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Production Environment</h3>
              <p className="text-gray-600">
                Development tools are only available in development environment for security reasons.
              </p>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Development Tools" subtitle="Development environment tools and testing utilities">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-6 h-6 text-purple-600" />
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Development Environment
            </Badge>
          </div>
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh Data
          </Button>
        </div>

        {/* Mock Stripe Status Overview */}
        {status && (
          <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Payment Intents</p>
                    <p className="mobile-title">{status.paymentIntents}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Subscriptions</p>
                    <p className="mobile-title">{status.subscriptions}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Customers</p>
                    <p className="mobile-title">{status.customers}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Pending Webhooks</p>
                    <p className="mobile-title">{status.pendingWebhooks}</p>
                  </div>
                  {status.pendingWebhooks > 0 ? (
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mobile-grid lg:grid-cols-2">
          {/* Test Scenarios */}
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="w-5 h-5 mr-2" />
                Test Scenarios
              </CardTitle>
              <CardDescription>
                Run predefined test scenarios to verify functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {testScenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  onClick={() => runTestScenario(scenario.id)}
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-start gap-3 text-left">
                    <span className="text-xl">{scenario.icon}</span>
                    <div>
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{scenario.description}</div>
                    </div>
                  </div>
                </Button>
              ))}

              <Separator />

              <Button
                onClick={clearData}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                variant="outline"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Mock Data
              </Button>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Events
              </CardTitle>
              <CardDescription>
                Latest Mock Stripe events and webhook deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent events</p>
                ) : (
                  events.map((event, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{event.event}</span>
                        <Badge variant="outline" className="text-xs">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      {event.details && (
                        <div className="text-xs text-gray-600 mt-1">
                          {typeof event.details === 'object'
                            ? JSON.stringify(event.details, null, 2).slice(0, 100) + '...'
                            : event.details
                          }
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Data Generation */}
        <Card className="mobile-card border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900">
              <Database className="w-5 h-5 mr-2" />
              Transaction Data Generation
            </CardTitle>
            <CardDescription className="text-green-700">
              Generate realistic transaction data to populate analytics and dashboards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => generateTransactionData('realistic-orders', 50)}
              disabled={loading}
              className="w-full justify-start h-auto p-4 bg-green-600 hover:bg-green-700 text-white"
            >
              <div className="flex items-start gap-3 text-left">
                <span className="text-xl">📊</span>
                <div>
                  <div className="font-medium">Generate 50 Realistic Orders</div>
                  <div className="text-xs text-green-100 mt-1">Creates orders with transactions, revenue tracking, and analytics data</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => generateTransactionData('revenue-analytics')}
              disabled={loading}
              className="w-full justify-start h-auto p-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <div className="flex items-start gap-3 text-left">
                <span className="text-xl">📈</span>
                <div>
                  <div className="font-medium">Generate Revenue Analytics</div>
                  <div className="text-xs text-blue-100 mt-1">Creates 12 months of aggregated revenue and performance data</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => generateTransactionData('all-transaction-data')}
              disabled={loading}
              className="w-full justify-start h-auto p-4 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <div className="flex items-start gap-3 text-left">
                <span className="text-xl">🚀</span>
                <div>
                  <div className="font-medium">Generate Complete Ecosystem</div>
                  <div className="text-xs text-purple-100 mt-1">Orders + Transactions + Analytics - Full production-ready data</div>
                </div>
              </div>
            </Button>

            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-4">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> This will create realistic data for dashboards, analytics, and user experiences.
                Perfect for demonstrating the platform's capabilities with real transaction flows.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Development Utilities */}
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Development Utilities
            </CardTitle>
            <CardDescription>
              Quick access to development tools and external services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mobile-grid mobile-grid-2 lg:grid-cols-3">
              <Button asChild variant="outline" className="h-auto p-4">
                <a href="http://localhost:3333" target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-pink-600" />
                    <div className="text-left">
                      <div className="font-medium">Sanity Studio</div>
                      <div className="text-xs text-gray-600">Content Management</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </div>
                </a>
              </Button>

              <Button asChild variant="outline" className="h-auto p-4">
                <a href="/api/debug/sanity" target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Sanity Debug</div>
                      <div className="text-xs text-gray-600">API Data Inspector</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </div>
                </a>
              </Button>

              <Button asChild variant="outline" className="h-auto p-4">
                <a href="https://dashboard.stripe.com/test" target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium">Stripe Dashboard</div>
                      <div className="text-xs text-gray-600">Payment Testing</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Card Numbers Reference */}
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle>Test Card Numbers</CardTitle>
            <CardDescription>
              Use these card numbers to test different payment scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mobile-grid lg:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3 text-green-700">Success Cards</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm text-gray-600">Basic Success:</span>
                    <code className="bg-white px-2 py-1 rounded text-sm">4242 4242 4242 4242</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm text-gray-600">Debit Card:</span>
                    <code className="bg-white px-2 py-1 rounded text-sm">4000 0566 5566 5556</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm text-gray-600">Visa:</span>
                    <code className="bg-white px-2 py-1 rounded text-sm">4000 0000 0000 0077</code>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 text-red-700">Decline Cards</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm text-gray-600">Generic Decline:</span>
                    <code className="bg-white px-2 py-1 rounded text-sm">4000 0000 0000 0002</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm text-gray-600">Insufficient Funds:</span>
                    <code className="bg-white px-2 py-1 rounded text-sm">4000 0000 0000 9995</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm text-gray-600">Expired Card:</span>
                    <code className="bg-white px-2 py-1 rounded text-sm">4000 0000 0000 0069</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Use any future expiry date (MM/YY), any 3-digit CVC, and any billing ZIP code for testing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Information */}
        <Card className="mobile-card border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Monitor className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="mobile-subtitle text-purple-900 mb-1">Development Environment Active</h3>
                <p className="mobile-body text-purple-800">
                  You're in development mode with access to testing tools and mock data.
                  These tools are automatically hidden in production for security.
                </p>
                <div className="mt-2 text-xs text-purple-700">
                  Environment: <code className="bg-purple-100 px-1 rounded">development</code> •
                  Node: <code className="bg-purple-100 px-1 rounded">{process.version}</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
