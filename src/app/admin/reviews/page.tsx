'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '../layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from '@/components/ui/star-rating'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  ThumbsUp,
  Loader2,
  AlertTriangle,
  Eye,
  Calendar,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface Review {
  _id: string
  _createdAt: string
  rating: number
  title?: string
  comment?: string
  status: 'published' | 'pending' | 'hidden'
  helpful: number
  user: {
    _id: string
    name: string
    email: string
    image?: string
    role: string
  }
  product: {
    _id: string
    title: string
    slug: { current: string }
    images?: Array<{ asset: { url: string } }>
  }
}

interface ReviewStats {
  total: number
  published: number
  pending: number
  hidden: number
  averageRating: number
  totalHelpful: number
}

export default function AdminReviewsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Check admin access
  useEffect(() => {
    if (session && session.user.role !== 'admin') {
      router.push('/admin')
      return
    }
  }, [session, router])

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(ratingFilter && { rating: ratingFilter })
      })

      const response = await fetch(`/api/admin/reviews?${params}`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
        setStats(data.stats)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        toast.error(data.error || 'Failed to fetch reviews')
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchReviews()
    }
  }, [session, currentPage, searchTerm, statusFilter, ratingFilter])

  // Handle search with debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1)
      fetchReviews()
    }, 500)

    return () => clearTimeout(debounce)
  }, [searchTerm])

  // Bulk actions
  const handleBulkAction = async (action: string, reason?: string) => {
    if (selectedReviews.length === 0) {
      toast.error('No reviews selected')
      return
    }

    try {
      setBulkLoading(true)

      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewIds: selectedReviews,
          ...(reason && { reason })
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Successfully ${action}ed ${data.summary.successful} reviews`)
        setSelectedReviews([])
        setShowRejectDialog(false)
        setRejectionReason('')
        fetchReviews()
      } else {
        toast.error(data.error || 'Bulk action failed')
      }
    } catch (error) {
      toast.error('Failed to perform bulk action')
    } finally {
      setBulkLoading(false)
    }
  }

  // Individual review actions
  const handleReviewAction = async (reviewId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewIds: [reviewId]
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Review ${action}ed successfully`)
        fetchReviews()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (error) {
      toast.error('Failed to perform action')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'hidden':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Hidden</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  if (session?.user?.role !== 'admin') {
    return (
      <AdminLayout title="Access Denied" subtitle="Admin access required">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need admin privileges to access review moderation.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Review Moderation" subtitle="Manage and moderate user reviews">
      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold">{stats.published}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hidden</p>
                    <p className="text-2xl font-bold">{stats.hidden}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold">{stats.averageRating?.toFixed(1) || '0.0'}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Reviews</CardTitle>
                <CardDescription>Moderate user reviews and ratings</CardDescription>
              </div>

              {/* Bulk Actions */}
              {selectedReviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedReviews.length} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </Button>
                  <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={bulkLoading}>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Reviews</DialogTitle>
                        <DialogDescription>
                          Provide a reason for rejecting {selectedReviews.length} reviews.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Reason for rejection (optional)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleBulkAction('reject', rejectionReason)}>
                          Reject Reviews
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviews, products, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reviews Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedReviews.length === reviews.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedReviews(reviews.map(r => r._id))
                            } else {
                              setSelectedReviews([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedReviews.includes(review._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedReviews([...selectedReviews, review._id])
                              } else {
                                setSelectedReviews(selectedReviews.filter(id => id !== review._id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div>
                            {review.title && (
                              <div className="font-medium text-sm mb-1">{review.title}</div>
                            )}
                            {review.comment && (
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {review.comment}
                              </div>
                            )}
                            {review.helpful > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <ThumbsUp className="w-3 h-3" />
                                {review.helpful} helpful
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/products/${review.product.slug.current}`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded">
                              {review.product.images?.[0] && (
                                <img
                                  src={review.product.images[0].asset.url}
                                  alt=""
                                  className="w-full h-full object-cover rounded"
                                />
                              )}
                            </div>
                            <div className="text-sm">{review.product.title}</div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={review.user.image} />
                              <AvatarFallback className="text-xs">
                                {review.user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{review.user.name}</div>
                              <div className="text-xs text-gray-500">{review.user.role}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StarRating rating={review.rating} readonly size="sm" />
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(review.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {formatDistanceToNow(new Date(review._createdAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {review.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleReviewAction(review._id, 'approve')}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReviewAction(review._id, 'reject')}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            {review.status === 'published' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewAction(review._id, 'reject')}
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            )}
                            {review.status === 'hidden' && (
                              <Button
                                size="sm"
                                onClick={() => handleReviewAction(review._id, 'approve')}
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
