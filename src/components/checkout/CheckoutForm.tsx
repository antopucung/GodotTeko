'use client'

import { useState, useEffect } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, CheckCircle, Smartphone, Lock } from 'lucide-react'
import { cn } from '@/styles/component-variants'

interface CheckoutFormProps {
  onSuccess: () => void
  amount: number
}

export function CheckoutForm({ onSuccess, amount }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!stripe) {
      return
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    )

    if (!clientSecret) {
      return
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Payment succeeded!')
          onSuccess()
          break
        case 'processing':
          setMessage('Your payment is processing.')
          break
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.')
          break
        default:
          setMessage('Something went wrong.')
          break
      }
    })
  }, [stripe, onSuccess])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setMessage('')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    })

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An error occurred.')
      } else {
        setMessage('An unexpected error occurred.')
      }
    }

    setIsLoading(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  if (!stripe || !elements) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32 md:h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-blue-600" />
              <p className="text-sm md:text-base text-muted-foreground">Loading payment form...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
          <span className="hidden sm:inline">Payment Information</span>
          <span className="sm:hidden">Payment</span>
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Enter your payment details to complete your purchase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mobile payment notice */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Optimized for mobile payments with Apple Pay and Google Pay support
              </p>
            </div>
          </div>

          {/* Payment Element with mobile optimization */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-medium text-sm md:text-base">Payment Method</h4>
            <div className="mobile-card border-0 p-0">
              <PaymentElement
                options={{
                  layout: {
                    type: 'tabs',
                    defaultCollapsed: false,
                    radios: false,
                    spacedAccordionItems: false
                  },
                  fields: {
                    billingDetails: {
                      name: 'auto',
                      email: 'auto'
                    }
                  },
                  wallets: {
                    applePay: 'auto',
                    googlePay: 'auto'
                  }
                }}
                className="mobile-payment-element"
              />
            </div>
          </div>

          {/* Billing Address with mobile optimization */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-medium text-sm md:text-base">Billing Address</h4>
            <div className="mobile-card border-0 p-0">
              <AddressElement
                options={{
                  mode: 'billing',
                  allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE'],
                  fields: {
                    phone: 'always'
                  },
                  validation: {
                    phone: {
                      required: 'never'
                    }
                  }
                }}
                className="mobile-address-element"
              />
            </div>
          </div>

          {/* Error/Success Message */}
          {message && (
            <Alert
              variant={message.includes('succeeded') ? 'default' : 'destructive'}
              className={cn(
                "border-2",
                message.includes('succeeded') && "border-green-200 bg-green-50",
                !message.includes('succeeded') && "border-red-200"
              )}
            >
              <div className="flex items-center gap-2">
                {message.includes('succeeded') ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                <AlertDescription className="text-sm md:text-base">
                  {message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Mobile-optimized submit button */}
          <Button
            type="submit"
            disabled={isLoading || !stripe || !elements}
            className={cn(
              "w-full touch-target min-h-[50px] md:min-h-[44px]",
              "text-base md:text-lg font-semibold",
              "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                <span>Processing Payment...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                <span>Pay {formatPrice(amount)}</span>
              </div>
            )}
          </Button>

          {/* Mobile-optimized security notice */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="text-xs md:text-sm font-medium text-green-700">
                Secure Payment
              </span>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs md:text-sm text-muted-foreground">
                Your payment information is secure and encrypted.
              </p>
              <p className="text-xs text-muted-foreground">
                We use Stripe to process payments and don't store your card details.
              </p>
            </div>
          </div>

          {/* Mobile payment methods indicator */}
          <div className="md:hidden border-t pt-4">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>💳 Cards</span>
              <span>📱 Apple Pay</span>
              <span>🔵 Google Pay</span>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
