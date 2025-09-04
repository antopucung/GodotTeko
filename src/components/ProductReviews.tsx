'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { StarRating } from '@/components/ui/star-rating'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface Review {
  _id: string
  _createdAt: string
  rating: number
  title?: string
  comment?: string
  helpful: number
  user: {
    _id: string
    name: string
    image?: string
  }
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [error, setError] = useState('')

  // Review form state
  const [newRating, setNewRating] = useState(0)
  const [newTitle, setNewTitle] = useState('')
  const [newComment, setNewComment] = useState('')

  // Fetch reviews
  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}/reviews`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
        setAverageRating(data.averageRating || 0)
        setTotalCount(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      setError('Please sign in to leave a review')
      return
    }

    if (newRating === 0) {
      setError('Please select a rating')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: newRating,
          title: newTitle,
          comment: newComment,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Reset form
        setNewRating(0)
        setNewTitle('')
        setNewComment('')
        setShowReviewForm(false)

        // Success feedback
        toast.success(
          'Review submitted successfully!',
          {
            description: 'Thank you for sharing your feedback',
            duration: 4000
          }
        )

        // Refresh reviews
        fetchReviews()
      } else {
        const errorMessage = data.error || 'Failed to submit review'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'Failed to submit review'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Reviews</span>
            {session && !showReviewForm && (
              <Button
                onClick={() => setShowReviewForm(true)}
                variant="outline"
                size="sm"
              >
                Write Review
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
              <StarRating rating={averageRating} readonly size="lg" />
              <div className="text-sm text-gray-600 mt-1">
                {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Rating *
                </label>
                <StarRating
                  rating={newRating}
                  onChange={setNewRating}
                  size="lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Review Title
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Brief summary of your review"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your Review
                </label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {newComment.length}/1000 characters
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || newRating === 0}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false)
                    setError('')
                    setNewRating(0)
                    setNewTitle('')
                    setNewComment('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.user.image} />
                    <AvatarFallback>
                      {review.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{review.user.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(review._createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      <StarRating rating={review.rating} readonly />
                    </div>

                    {review.title && (
                      <h4 className="font-medium">{review.title}</h4>
                    )}

                    {review.comment && (
                      <p className="text-gray-700">{review.comment}</p>
                    )}

                    {review.helpful > 0 && (
                      <div className="text-sm text-gray-600">
                        {review.helpful} {review.helpful === 1 ? 'person' : 'people'} found this helpful
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600">
            <p>No reviews yet. Be the first to review this product!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
