'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Heart,
  DollarSign,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  Star,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { toast } from 'sonner'

interface ContentItem {
  _id: string
  title: string
  type: 'asset' | 'course'
  status: 'published' | 'draft' | 'pending'
  thumbnail?: string
  price: number
  views: number
  likes: number
  sales: number
  revenue: number
  createdAt: string
  updatedAt: string
  // Course specific
  enrollments?: number
  rating?: number
  // Asset specific
  downloads?: number
}

export default function CreatorContentPage() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadContent()
  }, [])

  useEffect(() => {
    filterContent()
  }, [content, activeTab, searchQuery, statusFilter])

  const loadContent = async () => {
    try {
      setIsLoading(true)

      // Load both assets and courses
      const [assetsResponse, coursesResponse] = await Promise.all([
        fetch('/api/creator/assets'),
        fetch('/api/courses?instructor=' + 'current') // Will be replaced with actual creator ID
      ])

      const assetsData = await assetsResponse.json()
      const coursesData = await coursesResponse.json()

      // Transform and combine data
      const assets: ContentItem[] = (assetsData.assets || []).map((asset: any) => ({
        _id: asset._id,
        title: asset.title,
        type: 'asset' as const,
        status: asset.published ? 'published' : 'draft',
        thumbnail: asset.thumbnail,
        price: asset.price,
        views: asset.stats?.views || 0,
        likes: asset.stats?.likes || 0,
        sales: asset.stats?.sales || 0,
        downloads: asset.stats?.downloads || 0,
        revenue: asset.stats?.revenue || 0,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      }))

      const courses: ContentItem[] = (coursesData.courses || []).map((course: any) => ({
        _id: course._id,
        title: course.title,
        type: 'course' as const,
        status: course.published ? 'published' : 'draft',
        thumbnail: course.thumbnail,
        price: course.price?.amount || 0,
        views: course.stats?.views || 0,
        likes: course.stats?.likes || 0,
        sales: course.enrollmentCount || 0,
        enrollments: course.enrollmentCount || 0,
        rating: course.averageRating || 0,
        revenue: (course.enrollmentCount || 0) * (course.price?.amount || 0),
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }))

      const allContent = [...assets, ...courses].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      setContent(allContent)
    } catch (error) {
      console.error('Failed to load content:', error)
      toast.error('Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }

  const filterContent = () => {
    let filtered = content

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.type === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    setFilteredContent(filtered)
  }

  const handleDeleteContent = async (contentId: string, type: 'asset' | 'course') => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const endpoint = type === 'asset' ? `/api/assets/${contentId}` : `/api/courses/${contentId}`
      const response = await fetch(endpoint, { method: 'DELETE' })

      if (response.ok) {
        setContent(content.filter(item => item._id !== contentId))
        toast.success('Content deleted successfully')
      } else {
        toast.error('Failed to delete content')
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('Failed to delete content')
    }
  }

  const handleToggleStatus = async (contentId: string, type: 'asset' | 'course', currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published'
      const endpoint = type === 'asset'
        ? `/api/assets/${contentId}/publish`
        : `/api/courses/${contentId}/publish`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newStatus === 'published' })
      })

      if (response.ok) {
        setContent(content.map(item =>
          item._id === contentId
            ? { ...item, status: newStatus as 'published' | 'draft' }
            : item
        ))
        toast.success(`Content ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`)
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'asset' ? Package : BookOpen
  }

  const getContentStats = (type: 'all' | 'asset' | 'course') => {
    const filtered = type === 'all' ? content : content.filter(item => item.type === type)
    return {
      total: filtered.length,
      published: filtered.filter(item => item.status === 'published').length,
      revenue: filtered.reduce((sum, item) => sum + item.revenue, 0)
    }
  }

  const allStats = getContentStats('all')
  const assetStats = getContentStats('asset')
  const courseStats = getContentStats('course')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
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
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Content</p>
                <p className="text-2xl font-bold">{allStats.total}</p>
                <p className="text-xs text-gray-500">{allStats.published} published</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${allStats.revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">All-time earnings</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className="text-2xl font-bold">
                  {content.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total views</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Content</CardTitle>
              <CardDescription>Manage your assets, courses, and projects</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href="/creator/assets/new">
                <Button variant="outline" size="sm">
                  <Package className="w-4 h-4 mr-2" />
                  Upload Asset
                </Button>
              </Link>
              <Link href="/creator/courses/new">
                <Button size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All Content ({allStats.total})
              </TabsTrigger>
              <TabsTrigger value="asset">
                Assets ({assetStats.total})
              </TabsTrigger>
              <TabsTrigger value="course">
                Courses ({courseStats.total})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredContent.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchQuery ? 'No content found' : 'No content yet'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery ? 'Try adjusting your search terms' : 'Start creating content to build your creator portfolio'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/creator/assets/new">
                      <Button variant="outline">
                        <Package className="w-4 h-4 mr-2" />
                        Upload Asset
                      </Button>
                    </Link>
                    <Link href="/creator/courses/new">
                      <Button>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Create Course
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContent.map((item) => {
                    const TypeIcon = getTypeIcon(item.type)
                    return (
                      <Card key={item._id} className="group hover:shadow-md transition-shadow">
                        <div className="relative">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-40 object-cover rounded-t-lg"
                            />
                          ) : (
                            <div className="w-full h-40 bg-gray-100 rounded-t-lg flex items-center justify-center">
                              <TypeIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/creator/${item.type}s/${item._id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(item._id, item.type, item.status)}
                                >
                                  {item.status === 'published' ? (
                                    <>
                                      <Pause className="w-4 h-4 mr-2" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      Publish
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteContent(item._id, item.type)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                              {item.title}
                            </h3>
                            <Badge variant="outline" className="ml-2">
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {item.type}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                            <span>${item.price || 'Free'}</span>
                            <span className="text-green-600 font-medium">
                              ${item.revenue.toLocaleString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">{item.views}</div>
                              <div>Views</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900">{item.likes}</div>
                              <div>Likes</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {item.type === 'course' ? item.enrollments : item.downloads}
                              </div>
                              <div>{item.type === 'course' ? 'Students' : 'Downloads'}</div>
                            </div>
                          </div>

                          {item.type === 'course' && item.rating && (
                            <div className="flex items-center justify-center mt-3 pt-3 border-t">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
