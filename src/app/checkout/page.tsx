'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { AccessPassOptions } from '@/components/checkout/AccessPassOptions'
import {
  ArrowLeft,
  CreditCard,
  Shield,
  Download,
  Infinity,
  Clock,
  CheckCircle,
  AlertCircle,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/styles/component-variants'

const stripePromise = getStripe()

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [checkoutType, setCheckoutType] = useState<'cart' | 'access_pass'>('cart')
  const [clientSecret, setClientSecret] = useState('')
  const [paymentIntentId, setPaymentIntentId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/checkout')
      return
    }

    // If no items in cart, redirect to cart page
    if (status === 'authenticated' && items.length === 0) {
      router.push('/cart')
      return
    }
  }, [status, items.length, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const handleCreatePaymentIntent = async (licenseType: 'basic' | 'extended' = 'basic') => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
          })),
          licenseType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      if (data.isFree) {
        // All items are free, redirect to success
        await clearCart()
        router.push(`/checkout/success?orderId=${data.orderId}`)
        return
      }

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId)
    } catch (error) {
      console.error('Error creating payment intent:', error)
      setError(error instanceof Error ? error.message : 'Failed to create payment intent')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    await clearCart()
    router.push(`/checkout/success?paymentIntentId=${paymentIntentId}`)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">
            {/* Mobile-optimized skeleton */}
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized container with better padding */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Mobile-optimized header */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="touch-target min-h-[44px] min-w-[44px] p-2 md:p-3"
            >
              <Link href="/cart">
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Back to Cart</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <h1 className="text-xl md:text-3xl font-bold">Checkout</h1>
          </div>

          {/* Mobile-optimized development notice */}
          {process.env.NEXT_PUBLIC_STRIPE_MOCK_MODE === 'true' && (
            <Alert className="mb-6 border-purple-200 bg-purple-50">
              <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <AlertDescription className="text-purple-800">
                <div className="space-y-2">
                  <div>
                    <strong>Development Mode:</strong> Payment simulation active
                  </div>
                  <div className="text-sm space-y-1">
                    <div>✅ Test card: <code className="bg-purple-100 px-1 py-0.5 rounded text-xs">4242 4242 4242 4242</code></div>
                    <div className="hidden md:block">❌ Decline: <code className="bg-purple-100 px-1 py-0.5 rounded text-xs">4000 0000 0000 0002</code></div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mobile-optimized checkout type selection */}
          <Tabs value={checkoutType} onValueChange={(value) => setCheckoutType(value as any)} className="mb-6 md:mb-8">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1">
              <TabsTrigger
                value="cart"
                className={cn(
                  "flex items-center gap-2 py-3 px-4 touch-target",
                  "text-sm md:text-base"
                )}
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Purchase Items ({items.length})</span>
                <span className="sm:hidden">Items ({items.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="access_pass"
                className={cn(
                  "flex items-center gap-2 py-3 px-4 touch-target",
                  "text-sm md:text-base"
                )}
              >
                <Infinity className="w-4 h-4" />
                <span className="hidden sm:inline">Get Access Pass</span>
                <span className="sm:hidden">Access Pass</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cart" className="mt-6">
              {/* Mobile-first responsive layout */}
              <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
                {/* Order Summary - Mobile first, then desktop left column */}
                <div className="order-2 lg:order-1 space-y-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
                      <CardDescription>
                        Review your items before checkout
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3 md:gap-4">
                          <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0">
                            {item.product.image ? (
                              <Image
                                src={item.product.image}
                                alt={item.product.title}
                                fill
                                className="object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <Download className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm md:text-base line-clamp-2">{item.product.title}</h4>
                            <p className="text-xs md:text-sm text-gray-600">Qty: {item.quantity}</p>
                            {item.product.freebie && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Free
                              </Badge>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-sm md:text-base">
                              {item.product.freebie ? 'Free' : formatPrice((item.product.salePrice || item.product.price) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm md:text-base">
                          <span>Subtotal</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                        <div className="flex justify-between text-xs md:text-sm text-gray-600">
                          <span>Tax</span>
                          <span>Calculated at checkout</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-base md:text-lg">
                          <span>Total</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mobile-optimized license type selection */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg md:text-xl">License Type</CardTitle>
                      <CardDescription>
                        Choose the license that fits your needs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4">
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 touch-target">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm md:text-base">Basic License</h4>
                            <span className="text-sm md:text-base font-medium">{formatPrice(total)}</span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">
                            Personal and commercial use included
                          </p>
                          <ul className="text-xs text-gray-500 mt-2 space-y-1">
                            <li>• High-quality source files</li>
                            <li>• Commercial license included</li>
                            <li>• Lifetime updates</li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 touch-target">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm md:text-base">Extended License</h4>
                            <span className="text-sm md:text-base font-medium">{formatPrice(total * 3)}</span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">
                            Everything in Basic + resale rights
                          </p>
                          <ul className="text-xs text-gray-500 mt-2 space-y-1">
                            <li>• All Basic License features</li>
                            <li>• Extended commercial license</li>
                            <li>• Resale and redistribution rights</li>
                            <li>• Priority support</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Form - Mobile first, then desktop right column */}
                <div className="order-1 lg:order-2 space-y-6">
                  {!clientSecret ? (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-blue-600 md:hidden" />
                          Ready to Checkout?
                        </CardTitle>
                        <CardDescription>
                          Complete your purchase securely
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button
                          onClick={() => handleCreatePaymentIntent('basic')}
                          disabled={isLoading || items.length === 0}
                          className={cn(
                            "w-full touch-target min-h-[50px] md:min-h-[44px]",
                            "text-base md:text-lg font-medium"
                          )}
                          size="lg"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </div>
                          ) : (
                            `Pay ${formatPrice(total)}`
                          )}
                        </Button>
                        {error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm
                        onSuccess={handlePaymentSuccess}
                        amount={total}
                      />
                    </Elements>
                  )}

                  {/* Mobile-optimized security info */}
                  <Card className="border-green-200 bg-green-50 shadow-sm">
                    <CardContent className="pt-4 md:pt-6">
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-900 text-sm md:text-base">Secure Checkout</h4>
                          <p className="text-xs md:text-sm text-green-700 mt-1">
                            Your payment is processed securely by Stripe. We don't store your payment information.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access_pass" className="mt-6">
              <AccessPassOptions />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
