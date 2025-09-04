'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Crown,
  Calendar,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Star,
  Infinity,
  Pause,
  Play
} from 'lucide-react'
import Link from 'next/link'

interface AccessPass {
  _id: string
  passType: 'monthly' | 'yearly' | 'lifetime'
  status: string
  stripeSubscriptionId?: string
  currentPeriodStart: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  pricing: {
    amount: number
    currency: string
    interval?: string
  }
  usage: {
    totalDownloads: number
    downloadsThisPeriod: number
    lastDownloadAt?: string
  }
}

interface AccessPassTabProps {
  onStatsUpdate: () => void
}

export function AccessPassTab({ onStatsUpdate }: AccessPassTabProps) {
  const [accessPass, setAccessPass] = useState<AccessPass | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchAccessPass()
  }, [])

  const fetchAccessPass = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/access-pass')
      const data = await response.json()

      if (response.ok && data.hasAccessPass) {
        setAccessPass(data.accessPass)
      } else {
        setAccessPass(null)
      }
    } catch (error) {
      console.error('Error fetching access pass:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!accessPass || !confirm('Are you sure you want to cancel your access pass? You will lose access at the end of your billing period.')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch('/api/user/access-pass', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchAccessPass()
        onStatsUpdate()
        alert('Your access pass has been cancelled. You will retain access until the end of your billing period.')
      } else {
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!accessPass) return

    try {
      setActionLoading(true)
      const response = await fetch('/api/user/access-pass', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reactivate' })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchAccessPass()
        onStatsUpdate()
        alert('Your access pass has been reactivated!')
      } else {
        alert(data.error || 'Failed to reactivate subscription')
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      alert('Failed to reactivate subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount / 100)
  }

  const getPassIcon = (passType: string) => {
    switch (passType) {
      case 'monthly':
        return <Calendar className="w-5 h-5" />
      case 'yearly':
        return <Star className="w-5 h-5" />
      case 'lifetime':
        return <Infinity className="w-5 h-5" />
      default:
        return <Crown className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge className="bg-yellow-100 text-yellow-800">Cancelling</Badge>
    }

    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'past_due':
        return <Badge className="bg-red-100 text-red-800">Past Due</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      case 'paused':
        return <Badge className="bg-blue-100 text-blue-800">Paused</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!accessPass) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Access Pass</h2>
          <p className="text-gray-600">
            Get unlimited access to our entire library of premium design resources
          </p>
        </div>

        {/* No Access Pass */}
        <Card>
          <CardContent className="p-12 text-center">
            <Crown className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              No Active Access Pass
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Upgrade to an Access Pass to get unlimited downloads, early access to new releases,
              and premium support.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Monthly Pass</h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">$29</p>
                <p className="text-sm text-gray-600">Perfect for short-term projects</p>
              </div>

              <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600">Most Popular</Badge>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Yearly Pass</h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  $290 <span className="text-sm text-gray-600 line-through">$348</span>
                </p>
                <p className="text-sm text-gray-600">Save 17% with annual billing</p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Lifetime Pass</h4>
                <p className="text-2xl font-bold text-gray-900 mb-2">$999</p>
                <p className="text-sm text-gray-600">One payment, forever access</p>
              </div>
            </div>

            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/checkout?type=access_pass">
                <Crown className="w-4 h-4 mr-2" />
                Get Access Pass
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Access Pass Benefits</CardTitle>
            <CardDescription>
              What you get with an Access Pass subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Unlimited downloads</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Access to all products</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Early access to new releases</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Priority customer support</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Commercial license included</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Access Pass</h2>
        <p className="text-gray-600">
          Manage your subscription and view usage statistics
        </p>
      </div>

      {/* Access Pass Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getPassIcon(accessPass.passType)}
              <div>
                <CardTitle className="capitalize">
                  {accessPass.passType} Access Pass
                </CardTitle>
                <CardDescription>
                  {formatPrice(accessPass.pricing.amount, accessPass.pricing.currency)}
                  {accessPass.passType !== 'lifetime' && (
                    <span> / {accessPass.pricing.interval}</span>
                  )}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(accessPass.status, accessPass.cancelAtPeriodEnd)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Billing Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Billing Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current period started:</span>
                <p className="font-medium">{formatDate(accessPass.currentPeriodStart)}</p>
              </div>
              {accessPass.currentPeriodEnd && (
                <div>
                  <span className="text-gray-600">
                    {accessPass.cancelAtPeriodEnd ? 'Access ends:' : 'Next billing date:'}
                  </span>
                  <p className="font-medium">{formatDate(accessPass.currentPeriodEnd)}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Usage Statistics */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Usage Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {accessPass.usage.totalDownloads}
                </p>
                <p className="text-sm text-gray-600">Total Downloads</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {accessPass.usage.downloadsThisPeriod}
                </p>
                <p className="text-sm text-gray-600">This Period</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-600">
                  {accessPass.usage.lastDownloadAt
                    ? formatDate(accessPass.usage.lastDownloadAt)
                    : 'Never'
                  }
                </p>
                <p className="text-sm text-gray-600">Last Download</p>
              </div>
            </div>
          </div>

          {/* Cancellation Warning */}
          {accessPass.cancelAtPeriodEnd && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your access pass is scheduled to cancel on {formatDate(accessPass.currentPeriodEnd!)}.
                You'll retain access until then.
              </AlertDescription>
            </Alert>
          )}

          {/* Past Due Warning */}
          {accessPass.status === 'past_due' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your payment is past due. Please update your payment method to continue your access pass.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {accessPass.passType !== 'lifetime' && (
              <>
                {accessPass.cancelAtPeriodEnd ? (
                  <Button
                    onClick={handleReactivateSubscription}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Reactivating...' : 'Reactivate Subscription'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                )}
              </>
            )}

            {accessPass.stripeSubscriptionId && (
              <Button variant="outline" asChild>
                <Link href="/user/billing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Link>
              </Button>
            )}

            <Button variant="outline" asChild>
              <Link href="/">
                <Download className="w-4 h-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options (for monthly/yearly users) */}
      {accessPass.passType !== 'lifetime' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Options</CardTitle>
            <CardDescription>
              Get more value with our other access pass options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accessPass.passType === 'monthly' && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Yearly Pass</h4>
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    $290 <span className="text-sm text-gray-600">Save $58/year</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Switch to annual billing and save 17%
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/checkout?type=access_pass&upgrade=yearly">
                      Upgrade to Yearly
                    </Link>
                  </Button>
                </div>
              )}

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Lifetime Pass</h4>
                <p className="text-lg font-bold text-gray-900 mb-2">$999</p>
                <p className="text-sm text-gray-600 mb-3">
                  One payment, never worry about billing again
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/checkout?type=access_pass&upgrade=lifetime">
                    Upgrade to Lifetime
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
