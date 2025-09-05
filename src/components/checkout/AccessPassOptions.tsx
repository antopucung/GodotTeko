'use client'

import { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckoutForm } from './CheckoutForm'
import {
  Crown,
  Calendar,
  CalendarDays,
  Infinity,
  Download,
  Star,
  Users,
  Headphones,
  CheckCircle,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const stripePromise = getStripe()

const ACCESS_PASS_OPTIONS = [
  {
    id: 'monthly',
    name: 'Monthly Pass',
    price: 29,
    originalPrice: null,
    interval: 'month',
    icon: Calendar,
    badge: null,
    description: 'Perfect for short-term projects',
    features: [
      'Unlimited downloads',
      'All current products',
      'New releases included',
      'Standard support',
      'Commercial license'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Pass',
    price: 290,
    originalPrice: 348,
    interval: 'year',
    icon: CalendarDays,
    badge: 'Save 17%',
    description: 'Best value for ongoing work',
    features: [
      'Everything in Monthly',
      'Save $58 per year',
      'Priority support',
      'Early access to new features',
      'Exclusive content',
      'Advanced commercial license'
    ]
  },
  {
    id: 'lifetime',
    name: 'Lifetime Pass',
    price: 999,
    originalPrice: null,
    interval: null,
    icon: Infinity,
    badge: 'Most Popular',
    description: 'One payment, forever access',
    features: [
      'Everything in Yearly',
      'Lifetime access',
      'All future products',
      'VIP support',
      'Exclusive lifetime member benefits',
      'Resale rights for some products'
    ]
  }
]

export function AccessPassOptions() {
  const [selectedPass, setSelectedPass] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const handleSelectPass = async (passType: string) => {
    setSelectedPass(passType)
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkout/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passType })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Error creating subscription:', error)
      setError(error instanceof Error ? error.message : 'Failed to create subscription')
      setSelectedPass(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    router.push('/checkout/success?type=access_pass')
  }

  if (selectedPass && clientSecret) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedPass(null)
              setClientSecret('')
            }}
          >
            ← Choose Different Pass
          </Button>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm
            onSuccess={handlePaymentSuccess}
            amount={ACCESS_PASS_OPTIONS.find(opt => opt.id === selectedPass)?.price || 0}
          />
        </Elements>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Choose Your Access Pass</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get unlimited access to our entire library of premium design resources.
          Download as much as you want, whenever you want.
        </p>
      </div>

      {/* Pass Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ACCESS_PASS_OPTIONS.map((option) => {
          const IconComponent = option.icon
          const isPopular = option.badge === 'Most Popular'

          return (
            <Card
              key={option.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                isPopular ? 'border-blue-500 shadow-lg scale-105' : ''
              }`}
              onClick={() => handleSelectPass(option.id)}
            >
              {option.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge
                    className={
                      isPopular
                        ? 'bg-blue-500 hover:bg-blue-500'
                        : 'bg-green-500 hover:bg-green-500'
                    }
                  >
                    {option.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isPopular ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-8 h-8 ${
                      isPopular ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                </div>

                <CardTitle className="text-xl">{option.name}</CardTitle>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold">{formatPrice(option.price)}</span>
                    {option.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(option.originalPrice)}
                      </span>
                    )}
                  </div>
                  {option.interval && (
                    <p className="text-sm text-gray-600">per {option.interval}</p>
                  )}
                </div>

                <CardDescription>{option.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full mt-6 ${
                    isPopular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                  }`}
                  disabled={isLoading}
                >
                  {isLoading && selectedPass === option.id ? (
                    'Setting up...'
                  ) : (
                    `Get ${option.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-md mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800 text-center">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8 border-t">
        <div className="text-center">
          <Download className="w-8 h-8 mx-auto mb-3 text-blue-600" />
          <h4 className="font-medium mb-2">Unlimited Downloads</h4>
          <p className="text-sm text-gray-600">Download as many items as you want</p>
        </div>

        <div className="text-center">
          <Star className="w-8 h-8 mx-auto mb-3 text-blue-600" />
          <h4 className="font-medium mb-2">Premium Quality</h4>
          <p className="text-sm text-gray-600">Handpicked, high-quality resources</p>
        </div>

        <div className="text-center">
          <Users className="w-8 h-8 mx-auto mb-3 text-blue-600" />
          <h4 className="font-medium mb-2">Commercial License</h4>
          <p className="text-sm text-gray-600">Use in commercial projects</p>
        </div>

        <div className="text-center">
          <Headphones className="w-8 h-8 mx-auto mb-3 text-blue-600" />
          <h4 className="font-medium mb-2">Priority Support</h4>
          <p className="text-sm text-gray-600">Get help when you need it</p>
        </div>
      </div>
    </div>
  )
}
