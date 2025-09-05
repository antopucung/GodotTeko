'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Download,
  Mail,
  ArrowRight,
  Crown,
  Gift,
  FileText,
  Star
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface OrderDetails {
  orderId: string
  orderNumber: string
  total: number
  currency: string
  items: Array<{
    product: {
      _id: string
      title: string
      image?: string
    }
    quantity: number
    price: number
  }>
  licenses: Array<{
    _id: string
    licenseKey: string
    product: {
      _id: string
      title: string
    }
    licenseType: string
  }>
  status: string
  completedAt: string
}

interface AccessPassDetails {
  _id: string
  passType: 'monthly' | 'yearly' | 'lifetime'
  status: string
  currentPeriodStart: string
  currentPeriodEnd?: string
  pricing: {
    amount: number
    currency: string
    interval?: string
  }
}

function CheckoutSuccessContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [accessPassDetails, setAccessPassDetails] = useState<AccessPassDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const paymentIntentId = searchParams.get('paymentIntentId')
  const orderId = searchParams.get('orderId')
  const type = searchParams.get('type')

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!session?.user?.id) return

      try {
        setIsLoading(true)

        if (type === 'access_pass') {
          // Fetch access pass details
          const response = await fetch('/api/user/access-pass')
          const data = await response.json()

          if (response.ok && data.accessPass) {
            setAccessPassDetails(data.accessPass)
          }
        } else if (orderId) {
          // Fetch order details
          const response = await fetch(`/api/orders/${orderId}`)
          const data = await response.json()

          if (response.ok) {
            setOrderDetails(data.order)
          }
        } else if (paymentIntentId) {
          // Fetch order by payment intent
          const response = await fetch(`/api/orders/by-payment-intent/${paymentIntentId}`)
          const data = await response.json()

          if (response.ok) {
            setOrderDetails(data.order)
          }
        }
      } catch (error) {
        console.error('Error fetching order details:', error)
        setError('Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [session?.user?.id, orderId, paymentIntentId, type])

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownload = async (licenseId: string) => {
    try {
      const response = await fetch(`/api/download/${licenseId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `product-${licenseId}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {type === 'access_pass' ? 'Welcome to Access Pass!' : 'Payment Successful!'}
          </h1>
          <p className="text-gray-600">
            {type === 'access_pass'
              ? 'You now have unlimited access to our entire library'
              : 'Your order has been processed and is ready for download'
            }
          </p>
        </div>

        {/* Access Pass Details */}
        {accessPassDetails && (
          <div className="space-y-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Crown className="w-5 h-5" />
                  Your Access Pass
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Pass Type</p>
                    <p className="font-semibold text-blue-900 capitalize">
                      {accessPassDetails.passType} Pass
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Amount Paid</p>
                    <p className="font-semibold text-blue-900">
                      {formatPrice(accessPassDetails.pricing.amount / 100, accessPassDetails.pricing.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Status</p>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">
                      {accessPassDetails.passType === 'lifetime' ? 'Valid' : 'Next Billing'}
                    </p>
                    <p className="font-semibold text-blue-900">
                      {accessPassDetails.passType === 'lifetime'
                        ? 'Forever'
                        : accessPassDetails.currentPeriodEnd
                          ? formatDate(accessPassDetails.currentPeriodEnd)
                          : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Pass Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Your Benefits</CardTitle>
                <CardDescription>
                  Here's what you can do with your Access Pass
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-green-600" />
                    <span>Unlimited downloads</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-green-600" />
                    <span>Access to all products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-green-600" />
                    <span>New releases included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span>Commercial license</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Order Details */}
        {orderDetails && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>
                  Order #{orderDetails.orderNumber} • {formatDate(orderDetails.completedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.title}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                            <Download className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.title}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(orderDetails.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Licenses */}
            {orderDetails.licenses && orderDetails.licenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Downloads</CardTitle>
                  <CardDescription>
                    Click to download your licensed products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderDetails.licenses.map((license) => (
                      <div key={license._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{license.product.title}</h4>
                          <p className="text-sm text-gray-600">
                            License: {license.licenseKey}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDownload(license._id)}
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Receipt Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Receipt Sent</h4>
                <p className="text-sm text-blue-700">
                  A receipt has been sent to {session?.user?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              Continue Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/user/dashboard">
              View Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense
function CheckoutSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing your order...</h1>
        <p className="text-gray-600">Please wait while we confirm your purchase.</p>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
