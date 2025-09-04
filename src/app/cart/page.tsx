'use client'

import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Heart,
  Download
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CartPage() {
  const {
    items,
    total,
    itemCount,
    isLoading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart()
  const { data: session } = useSession()
  const [isClearing, setIsClearing] = useState(false)

  const handleClearCart = async () => {
    setIsClearing(true)
    try {
      await clearCart()
    } finally {
      setIsClearing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getItemPrice = (item: any) => {
    return item.product.salePrice || item.product.price
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold mb-2">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Button asChild size="lg">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearCart}
              disabled={isClearing}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isClearing ? 'Clearing...' : 'Clear Cart'}
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            <Link
                              href={`/products/${item.product.slug.current}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {item.product.title}
                            </Link>
                          </h3>
                          {item.product.freebie && (
                            <Badge variant="secondary" className="mt-1">
                              Free
                            </Badge>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>

                          <span className="min-w-[3rem] text-center font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {item.product.freebie ? 'Free' : formatPrice(getItemPrice(item) * item.quantity)}
                          </div>
                          {item.product.salePrice && item.product.price !== item.product.salePrice && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatPrice(item.product.price * item.quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <div className="space-y-3 pt-4">
                  {session ? (
                    <Button asChild size="lg" className="w-full">
                      <Link href="/checkout">
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/auth/signin?callbackUrl=/checkout">
                          Sign In to Checkout
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                      <p className="text-sm text-gray-600 text-center">
                        Or <Link href="/auth/signup" className="text-blue-600 hover:underline">create an account</Link> to continue
                      </p>
                    </div>
                  )}

                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <Link href="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Access Pass Upsell */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">💎 Upgrade to Access Pass</CardTitle>
                <CardDescription className="text-blue-700">
                  Get unlimited access to all products for one monthly price
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="w-4 h-4" />
                      Unlimited downloads
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-4 h-4" />
                      Early access to new releases
                    </div>
                    <div className="text-lg font-semibold mt-2">
                      Starting at $29/month
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
