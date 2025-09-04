'use client'

import { useState, useEffect } from 'react'
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
  TestTube
} from 'lucide-react'

interface DevDashboardProps {
  isVisible: boolean
  onToggle: () => void
}

export default function DevDashboard({ isVisible, onToggle }: DevDashboardProps) {
  const [status, setStatus] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isVisible) {
      refreshData()
    }
  }, [isVisible])

  const refreshData = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const clearData = async () => {
    try {
      await fetch('/api/dev/stripe-clear', { method: 'POST' })
      refreshData()
    } catch (error) {
      console.error('Failed to clear data:', error)
    }
  }

  const runTestScenario = async (scenario: string) => {
    try {
      await fetch('/api/dev/test-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      })
      refreshData()
    } catch (error) {
      console.error('Failed to run test scenario:', error)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3"
        >
          <Monitor className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Development Dashboard</h2>
              <p className="text-gray-600">Mock Stripe Status & Testing Tools</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={refreshData}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={onToggle} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>

          {/* Status Overview */}
          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Payment Intents</p>
                      <p className="text-2xl font-bold">{status.paymentIntents}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Subscriptions</p>
                      <p className="text-2xl font-bold">{status.subscriptions}</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Customers</p>
                      <p className="text-2xl font-bold">{status.customers}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Webhooks</p>
                      <p className="text-2xl font-bold">{status.pendingWebhooks}</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Scenarios */}
            <Card>
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
                <Button
                  onClick={() => runTestScenario('successful_purchase')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  🛒 Successful Purchase Flow
                </Button>
                <Button
                  onClick={() => runTestScenario('failed_payment')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  ❌ Failed Payment Flow
                </Button>
                <Button
                  onClick={() => runTestScenario('subscription_flow')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  🔄 Subscription Flow
                </Button>
                <Button
                  onClick={() => runTestScenario('access_pass_flow')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  👑 Access Pass Flow
                </Button>
                <Separator />
                <Button
                  onClick={clearData}
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card>
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

          {/* Test Cards Reference */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Test Card Numbers</CardTitle>
              <CardDescription>
                Use these card numbers to test different payment scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Success Cards</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Success:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">4242 4242 4242 4242</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Success (Debit):</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">4000 0566 5566 5556</code>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Decline Cards</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Generic Decline:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">4000 0000 0000 0002</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insufficient Funds:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded">4000 0000 0000 9995</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
