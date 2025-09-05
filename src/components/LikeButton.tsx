'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LikeButtonProps {
  productId: string
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

export function LikeButton({
  productId,
  size = 'md',
  showCount = true,
  className
}: LikeButtonProps) {
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  // Fetch initial like status
  useEffect(() => {
    fetchLikeStatus()
  }, [productId, session])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/like`)
      const data = await response.json()

      if (response.ok) {
        setIsLiked(data.isLiked)
        setLikes(data.likes)
      }
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const handleLike = async () => {
    if (!session) {
      toast.error('Please sign in to like products')
      window.location.href = '/auth/signin'
      return
    }

    if (loading) return

    const previousState = { isLiked, likes }

    try {
      setLoading(true)
      setAnimating(true)

      // Optimistic update for better UX
      setIsLiked(!isLiked)
      setLikes(prev => isLiked ? prev - 1 : prev + 1)

      const response = await fetch(`/api/products/${productId}/like`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setIsLiked(data.isLiked)
        setLikes(data.likes)

        // Success feedback
        toast.success(
          data.isLiked ? 'Added to your likes!' : 'Removed from your likes',
          {
            description: data.isLiked
              ? 'Product saved to your liked items'
              : 'Product removed from your liked items',
            duration: 2000
          }
        )
      } else {
        // Revert optimistic update on error
        setIsLiked(previousState.isLiked)
        setLikes(previousState.likes)
        toast.error(data.error || 'Failed to update like status')
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousState.isLiked)
      setLikes(previousState.likes)
      console.error('Error toggling like:', error)
      toast.error('Failed to update like status')
    } finally {
      setLoading(false)
      setTimeout(() => setAnimating(false), 300)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors',
        isLiked && 'text-red-600',
        className
      )}
    >
      <Heart
        className={cn(
          sizes[size],
          'transition-all duration-300',
          isLiked ? 'fill-current text-red-600' : 'text-gray-600',
          animating && 'scale-125',
          loading && 'opacity-50'
        )}
      />
      {showCount && likes > 0 && (
        <span className={cn(
          'text-sm',
          isLiked ? 'text-red-600' : 'text-gray-600'
        )}>
          {likes}
        </span>
      )}
    </Button>
  )
}
