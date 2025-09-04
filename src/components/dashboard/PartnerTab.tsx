'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  BarChart3,
  DollarSign,
  Eye,
  Download,
  Plus,
  TrendingUp,
  Users,
  Star,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit3
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface PartnerStats {
  totalProducts: number
  totalEarnings: number
  totalDownloads: number
  averageRating: number
  pendingReviews: number
  thisMonthEarnings: number
  thisMonthDownloads: number
}

interface Product {
  _id: string
  title: string
  slug: { current: string }
  price: number
  salePrice?: number
  image?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  freebie: boolean
  featured: boolean
  stats: {
    downloads: number
    views: number
    likes: number
    revenue: number
  }
  _createdAt: string
}

export function PartnerTab() {
  const [stats, setStats] = useState<PartnerStats>({
    totalProducts: 0,
    totalEarnings: 0,
    totalDownloads: 0,
    averageRating: 0,
    pendingReviews: 0,
    thisMonthEarnings: 0,
    thisMonthDownloads: 0
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    fetchPartnerData()
  }, [])

  const fetchPartnerData = async () => {
    try {
      setLoading(true)
      // Mock data - in real app, these would be API calls
      const mockStats: PartnerStats = {
        totalProducts: 12,
        totalEarnings: 2847.50,
        totalDownloads: 1428,
        averageRating: 4.7,
        pendingReviews: 3,
        thisMonthEarnings: 387.20,
        thisMonthDownloads: 156
      }

      const mockProducts: Product[] = [
        {
          _id: '1',
          title: 'Modern UI Kit for Figma',
          slug: { current: 'modern-ui-kit-figma' },
          price: 49,
          salePrice: 39,
          image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=200&fit=crop',
          status: 'approved',
          freebie: false,
          featured: true,
          stats: {
            downloads: 245,
            views: 1250,
            likes: 89,
            revenue: 1847.50
          },
          _createdAt: '2024-01-15T10:00:00Z'
        },
        {
          _id: '2',
          title: 'Dashboard Components Set',
          slug: { current: 'dashboard-components-set' },
          price: 29,
          image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=200&fit=crop',
          status: 'pending',
          freebie: false,
          featured: false,
          stats: {
            downloads: 0,
            views: 45,
            likes: 12,
            revenue: 0
          },
          _createdAt: '2024-01-20T14:30:00Z'
        },
        {
          _id: '3',
          title: 'Free Icon Pack',
          slug: { current: 'free-icon-pack' },
          price: 0,
          image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=200&fit=crop',
          status: 'approved',
          freebie: true,
          featured: false,
          stats: {
            downloads: 892,
            views: 2150,
            likes: 234,
            revenue: 0
          },
          _createdAt: '2024-01-10T09:15:00Z'
        }
      ]

      setStats(mockStats)
      setProducts(mockProducts)
    } catch (error) {
      console.error('Error fetching partner data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
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
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partner Dashboard</h2>
          <p className="text-gray-600">
            Manage your products and track your earnings
          </p>
        </div>

        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/partner/upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Product
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalEarnings)}</p>
                <p className="text-sm text-green-600">
                  +{formatPrice(stats.thisMonthEarnings)} this month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalDownloads)}</p>
                <p className="text-sm text-blue-600">
                  +{stats.thisMonthDownloads} this month
                </p>
              </div>
              <Download className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-yellow-600">
                  {stats.pendingReviews} pending review
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= stats.averageRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'earnings', label: 'Earnings', icon: DollarSign }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeSection === id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Upload className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 mb-2">Upload Product</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Share your latest design with the community
                        </p>
                        <Button asChild size="sm">
                          <Link href="/partner/upload">Upload Now</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 text-center">
                        <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 mb-2">View Analytics</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Track your performance and earnings
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setActiveSection('analytics')}>
                          View Analytics
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 text-center">
                        <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 mb-2">Earnings Report</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Download your detailed earnings report
                        </p>
                        <Button variant="outline" size="sm">
                          Download Report
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          "Modern UI Kit for Figma" was approved
                        </p>
                        <p className="text-xs text-gray-600">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Download className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Your product was downloaded 12 times today
                        </p>
                        <p className="text-xs text-gray-600">Earned {formatPrice(86.40)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          "Dashboard Components Set" is pending review
                        </p>
                        <p className="text-xs text-gray-600">Submitted 2 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Section */}
            {activeSection === 'products' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Your Products</h3>
                  <Button asChild>
                    <Link href="/partner/upload">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  {products.map((product) => (
                    <Card key={product._id}>
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <div className="w-20 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.title}
                                width={80}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900 truncate">
                                  {product.title}
                                </h4>
                                <div className="flex items-center space-x-3 mt-1">
                                  {getStatusBadge(product.status)}
                                  {product.featured && (
                                    <Badge className="bg-purple-100 text-purple-800">Featured</Badge>
                                  )}
                                  {product.freebie && (
                                    <Badge className="bg-green-100 text-green-800">Free</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {product.freebie ? 'Free' : formatPrice(product.salePrice || product.price)}
                                </p>
                                {product.salePrice && product.price !== product.salePrice && (
                                  <p className="text-sm text-gray-500 line-through">
                                    {formatPrice(product.price)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center space-x-1">
                                <Download className="w-4 h-4" />
                                <span>{formatNumber(product.stats.downloads)} downloads</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>{formatNumber(product.stats.views)} views</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4" />
                                <span>{product.stats.likes} likes</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{formatPrice(product.stats.revenue)} earned</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/products/${product.slug.current}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Link>
                              </Button>

                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/partner/edit/${product._id}`}>
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit
                                </Link>
                              </Button>

                              {product.status === 'approved' && (
                                <Button variant="outline" size="sm">
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  Analytics
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Section */}
            {activeSection === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Performance Analytics</h3>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Detailed analytics dashboard coming soon. View basic metrics in the overview section for now.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Products</CardTitle>
                      <CardDescription>Based on downloads and revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {products.slice(0, 3).map((product, index) => (
                          <div key={product._id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                              <span className="text-sm text-gray-900">{product.title}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatNumber(product.stats.downloads)}</p>
                              <p className="text-xs text-gray-600">{formatPrice(product.stats.revenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Performance</CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Downloads</span>
                          <span className="text-sm font-medium">{stats.thisMonthDownloads}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Earnings</span>
                          <span className="text-sm font-medium">{formatPrice(stats.thisMonthEarnings)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">New Followers</span>
                          <span className="text-sm font-medium">+24</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Earnings Section */}
            {activeSection === 'earnings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Earnings Overview</h3>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-green-600">{formatPrice(stats.totalEarnings)}</p>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-blue-600">{formatPrice(stats.thisMonthEarnings)}</p>
                      <p className="text-sm text-gray-600">This Month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-purple-600">70%</p>
                      <p className="text-sm text-gray-600">Commission Rate</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Payout Information</CardTitle>
                    <CardDescription>
                      Payouts are processed monthly for earnings above $50
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Next Payout Date</span>
                        <span className="text-sm font-medium">February 1, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Available for Payout</span>
                        <span className="text-sm font-medium">{formatPrice(stats.thisMonthEarnings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Method</span>
                        <span className="text-sm font-medium">PayPal</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
