'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  BookOpen,
  Gift,
  Percent,
  Tag,
  ShoppingCart,
  Users,
  Star,
  Target,
  BarChart3,
  CheckCircle,
  Lightbulb
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { toast } from 'sonner'

interface Bundle {
  _id: string
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  thumbnail: string

  // Content
  assets: BundleAsset[]
  courses: BundleCourse[]

  // Pricing
  pricing: {
    individualTotal: number
    bundlePrice: number
    discountPercentage: number
    savings: number
  }

  // Performance
  performance: {
    views: number
    purchases: number
    revenue: number
    conversionRate: number
  }

  // Settings
  settings: {
    featured: boolean
    limitedTime: boolean
    expirationDate?: string
  }

  createdAt: string
  updatedAt: string
}

interface BundleAsset {
  _id: string
  title: string
  price: number
  thumbnail: string
  type: string
}

interface BundleCourse {
  _id: string
  title: string
  price: number
  thumbnail: string
  duration: number
  difficulty: string
}

export default function BundleCreationPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockBundles: Bundle[] = [
      {
        _id: '1',
        title: 'Complete UI Design Mastery',
        description: 'Learn UI design from scratch with hands-on assets',
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop',
        assets: [
          { _id: 'a1', title: 'Mobile UI Kit', price: 25, thumbnail: '', type: 'ui-kit' },
          { _id: 'a2', title: 'Dashboard Template', price: 40, thumbnail: '', type: 'template' }
        ],
        courses: [
          { _id: 'c1', title: 'UI Design Fundamentals', price: 49, thumbnail: '', duration: 8, difficulty: 'Beginner' }
        ],
        pricing: {
          individualTotal: 114,
          bundlePrice: 79,
          discountPercentage: 31,
          savings: 35
        },
        performance: {
          views: 1247,
          purchases: 89,
          revenue: 7031,
          conversionRate: 7.1
        },
        settings: {
          featured: true,
          limitedTime: false
        },
        createdAt: '2024-01-15',
        updatedAt: '2024-01-20'
      },
      {
        _id: '2',
        title: '3D Game Asset Creation',
        description: 'Complete workflow from modeling to game-ready assets',
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=200&fit=crop',
        assets: [
          { _id: 'a3', title: 'Character Models Pack', price: 60, thumbnail: '', type: '3d-model' }
        ],
        courses: [
          { _id: 'c2', title: '3D Modeling in Blender', price: 79, thumbnail: '', duration: 12, difficulty: 'Intermediate' }
        ],
        pricing: {
          individualTotal: 139,
          bundlePrice: 99,
          discountPercentage: 29,
          savings: 40
        },
        performance: {
          views: 892,
          purchases: 67,
          revenue: 6633,
          conversionRate: 7.5
        },
        settings: {
          featured: false,
          limitedTime: true,
          expirationDate: '2024-02-29'
        },
        createdAt: '2024-01-10',
        updatedAt: '2024-01-18'
      }
    ]

    setTimeout(() => {
      setBundles(mockBundles)
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredBundles = bundles.filter(bundle => {
    const matchesSearch = bundle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bundle.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || bundle.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalStats = bundles.reduce((acc, bundle) => ({
    revenue: acc.revenue + bundle.performance.revenue,
    purchases: acc.purchases + bundle.performance.purchases,
    views: acc.views + bundle.performance.views,
    avgConversion: acc.avgConversion + bundle.performance.conversionRate
  }), { revenue: 0, purchases: 0, views: 0, avgConversion: 0 })

  totalStats.avgConversion = bundles.length > 0 ? totalStats.avgConversion / bundles.length : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bundle Creator</h1>
          <p className="text-gray-600">Package assets and courses together for maximum value</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Bundle
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Bundle Revenue</p>
                <p className="text-2xl font-bold text-green-700">${totalStats.revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Sales</p>
                <p className="text-2xl font-bold text-blue-700">{totalStats.purchases.toLocaleString()}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Bundle Views</p>
                <p className="text-2xl font-bold text-purple-700">{totalStats.views.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-700">{totalStats.avgConversion.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bundle Strategy Tips */}
      <Card className="border-2 border-dashed border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Lightbulb className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">Bundle Strategy Tips</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-orange-700">
                <div>
                  <strong>• Complementary Content:</strong> Pair related assets with learning courses (e.g., UI Kit + UI Design Course)
                </div>
                <div>
                  <strong>• Sweet Spot Pricing:</strong> Aim for 20-40% discount to create urgency while maintaining profitability
                </div>
                <div>
                  <strong>• Value Narrative:</strong> Highlight the learning journey from course to practical application with assets
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search bundles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bundles Grid */}
      {filteredBundles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'No bundles found' : 'No bundles created yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms or filters'
                : 'Create your first bundle to increase revenue by packaging complementary content'
              }
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-orange-600 to-red-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Bundle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => (
            <Card key={bundle._id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
              <div className="relative">
                <img
                  src={bundle.thumbnail}
                  alt={bundle.title}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={getStatusColor(bundle.status)}>
                    {bundle.status}
                  </Badge>
                </div>

                {/* Discount Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-red-500 text-white">
                    <Percent className="w-3 h-3 mr-1" />
                    {bundle.pricing.discountPercentage}% OFF
                  </Badge>
                </div>

                {/* Bundle Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold text-lg mb-1">{bundle.title}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span>{bundle.assets.length} assets</span>
                    <span>•</span>
                    <span>{bundle.courses.length} courses</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Bundle Pack</span>
                  </div>
                  {bundle.settings.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {bundle.description}
                </p>

                {/* Pricing Display */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500 line-through">
                      Individual: ${bundle.pricing.individualTotal}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      Save ${bundle.pricing.savings}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    Bundle: ${bundle.pricing.bundlePrice}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs text-center mb-4">
                  <div>
                    <div className="font-semibold text-gray-900">{bundle.performance.views}</div>
                    <div className="text-gray-500">Views</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600">{bundle.performance.purchases}</div>
                    <div className="text-gray-500">Sales</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-600">{bundle.performance.conversionRate.toFixed(1)}%</div>
                    <div className="text-gray-500">Conversion</div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="mb-4 text-center">
                  <div className="text-lg font-bold text-green-600">
                    ${bundle.performance.revenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Total Revenue</div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Tag className="w-4 h-4 mr-2" />
                        Promote
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="w-4 h-4 mr-2" />
                        Customer List
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Bundle Modal */}
      <CreateBundleModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          toast.success('Bundle created successfully!')
        }}
      />
    </div>
  )
}

// Simple Create Bundle Modal
function CreateBundleModal({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercentage: 25
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate bundle creation
    setTimeout(() => {
      onSuccess()
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-600" />
            Create Bundle
          </DialogTitle>
          <DialogDescription>
            Package assets and courses together for increased value
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Bundle Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Complete UI Design Mastery Pack"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what's included and the value proposition..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="discount">Discount Percentage</Label>
            <div className="flex items-center gap-4">
              <Input
                id="discount"
                type="number"
                min="5"
                max="70"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({
                  ...formData,
                  discountPercentage: parseInt(e.target.value) || 0
                })}
                className="w-32"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <Progress value={formData.discountPercentage} max={70} className="mt-2" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Bundle Best Practices</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Create a clear learning journey (course → practical assets)</li>
              <li>• Bundle complementary content that works together</li>
              <li>• Highlight the total value and savings clearly</li>
              <li>• Use compelling titles that convey completeness</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-600 to-red-600"
            >
              Create Bundle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
