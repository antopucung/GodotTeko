'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingBag,
  Calendar,
  CreditCard,
  Download,
  FileText,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface OrderItem {
  product: {
    _id: string
    title: string
    image?: string
    slug: { current: string }
  }
  quantity: number
  price: number
  discount: number
}

interface Order {
  _id: string
  orderNumber: string
  items: OrderItem[]
  orderType: 'individual' | 'access_pass'
  subtotal: number
  tax: number
  total: number
  currency: string
  status: string
  paymentDetails?: {
    stripePaymentIntentId: string
    paymentMethod: string
    last4?: string
    brand?: string
  }
  completedAt?: string
  _createdAt: string
}

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  })

  useEffect(() => {
    fetchOrders()
  }, [filter, pagination.currentPage])

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filter !== 'all' && { status: filter })
      })

      const response = await fetch(`/api/user/orders?${params}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders || [])
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0
        })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-800">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getOrderTypeLabel = (orderType: string) => {
    switch (orderType) {
      case 'access_pass':
        return 'Access Pass'
      case 'individual':
        return 'Products'
      default:
        return orderType
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <p className="text-gray-600">
            {pagination.totalCount} order{pagination.totalCount !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {['all', 'completed', 'pending', 'failed'].map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter(filterOption as any)
                setPagination(prev => ({ ...prev, currentPage: 1 }))
              }}
              className="capitalize"
            >
              {filterOption}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't placed any orders yet."
                : `No ${filter} orders found.`
              }
            </p>
            <Button asChild>
              <Link href="/">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.orderNumber}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(order.completedAt || order._createdAt)} • {getOrderTypeLabel(order.orderType)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatPrice(order.total, order.currency)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(item.price * item.quantity, order.currency)}
                        </p>
                        {item.discount > 0 && (
                          <p className="text-xs text-green-600">
                            -{formatPrice(item.discount, order.currency)} discount
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Order Summary */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatPrice(order.subtotal, order.currency)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span>{formatPrice(order.tax, order.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatPrice(order.total, order.currency)}</span>
                  </div>
                </div>

                {/* Payment Details */}
                {order.paymentDetails && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment Details
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Method: {order.paymentDetails.paymentMethod?.toUpperCase() || 'Card'}
                        {order.paymentDetails.brand && order.paymentDetails.last4 && (
                          <span> ({order.paymentDetails.brand} •••• {order.paymentDetails.last4})</span>
                        )}
                      </p>
                      {order.paymentDetails.stripePaymentIntentId && (
                        <p>
                          Payment ID: {order.paymentDetails.stripePaymentIntentId}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  {order.status === 'completed' && (
                    <Button asChild>
                      <Link href={`/user/licenses?order=${order._id}`}>
                        <Download className="w-4 h-4 mr-2" />
                        View Licenses
                      </Link>
                    </Button>
                  )}

                  <Button variant="outline" asChild>
                    <Link href={`/checkout/success?orderId=${order._id}`}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Receipt
                    </Link>
                  </Button>

                  {order.orderType === 'individual' && order.items.length === 1 && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${order.items[0].product.slug.current}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Product
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} orders
          </p>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === 1}
              onClick={() => {
                setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))
                fetchOrders(pagination.currentPage - 1)
              }}
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => {
                setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))
                fetchOrders(pagination.currentPage + 1)
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
