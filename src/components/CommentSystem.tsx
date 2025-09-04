'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Heart,
  MessageCircle,
  Flag,
  MoreHorizontal,
  Reply,
  Edit,
  Trash2,
  Pin,
  CheckCircle,
  AlertCircle,
  Smile,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface Comment {
  _id: string
  content: string
  author: {
    _id: string
    name: string
    avatar?: string
    role?: string
    isVerified?: boolean
  }
  postedAt: string
  editedAt?: string
  isEdited: boolean
  isDeveloperComment: boolean
  isPinned: boolean
  isHighlighted: boolean
  parentComment?: string
  replies?: Comment[]
  replyCount: number
  reactions: {
    likes: number
    hearts: number
    laughs: number
    surprised: number
    thumbsUp: number
    thumbsDown: number
  }
  userReaction?: string
  commentType: 'general' | 'question' | 'feedback' | 'bug_report' | 'feature_request' | 'praise' | 'criticism' | 'technical'
  isQuestion: boolean
  isAnswered: boolean
  moderationStatus: 'published' | 'pending' | 'flagged' | 'hidden'
  attachments?: Array<{
    type: 'image' | 'video' | 'link' | 'file'
    url: string
    title?: string
    description?: string
  }>
}

interface CommentSystemProps {
  projectId: string
  productionLogId?: string
  comments: Comment[]
  totalComments: number
  onAddComment: (content: string, parentId?: string, type?: string) => Promise<void>
  onEditComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onReactToComment: (commentId: string, reaction: string) => Promise<void>
  onFlagComment: (commentId: string, reason: string) => Promise<void>
  onMarkAsAnswer: (commentId: string) => Promise<void>
  className?: string
}

const reactionEmojis = {
  likes: '👍',
  hearts: '❤️',
  laughs: '😂',
  surprised: '😮',
  thumbsUp: '👍',
  thumbsDown: '👎'
}

const commentTypeColors = {
  general: 'bg-gray-600',
  question: 'bg-blue-600',
  feedback: 'bg-green-600',
  bug_report: 'bg-red-600',
  feature_request: 'bg-purple-600',
  praise: 'bg-yellow-600',
  criticism: 'bg-orange-600',
  technical: 'bg-indigo-600'
}

const commentTypeLabels = {
  general: 'Comment',
  question: 'Question',
  feedback: 'Feedback',
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  praise: 'Praise',
  criticism: 'Criticism',
  technical: 'Technical'
}

function CommentCard({
  comment,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onFlag,
  onMarkAsAnswer,
  isReply = false,
  currentUserId
}: {
  comment: Comment
  onReply: (parentId: string) => void
  onEdit: (commentId: string, content: string) => void
  onDelete: (commentId: string) => void
  onReact: (commentId: string, reaction: string) => void
  onFlag: (commentId: string, reason: string) => void
  onMarkAsAnswer: (commentId: string) => void
  isReply?: boolean
  currentUserId?: string
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showReactions, setShowReactions] = useState(false)

  const isOwnComment = currentUserId === comment.author._id
  const timeSince = formatDistanceToNow(new Date(comment.postedAt), { addSuffix: true })

  const handleReaction = (reactionType: string) => {
    onReact(comment._id, reactionType)
    setShowReactions(false)
  }

  const handleEdit = () => {
    if (editContent.trim()) {
      onEdit(comment._id, editContent)
      setIsEditing(false)
    }
  }

  const getTotalReactions = () => {
    return Object.values(comment.reactions).reduce((sum, count) => sum + count, 0)
  }

  return (
    <Card
      className={`${
        comment.isPinned ? 'border-orange-500 bg-orange-50/5' :
        comment.isHighlighted ? 'border-blue-500 bg-blue-50/5' :
        comment.isDeveloperComment ? 'border-green-500 bg-green-50/5' :
        'border-gray-700'
      } bg-gray-800/50 ${isReply ? 'ml-8 mt-3' : 'mb-4'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Author Avatar */}
            <div className="relative">
              {comment.author.avatar ? (
                <Image
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {comment.author.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-semibold">{comment.author.name}</h4>

                {/* Role Badge */}
                {comment.author.role && (
                  <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                    {comment.author.role}
                  </Badge>
                )}

                {/* Developer Badge */}
                {comment.isDeveloperComment && (
                  <Badge className="bg-green-600 text-white text-xs">
                    Developer
                  </Badge>
                )}

                {/* Comment Type Badge */}
                {comment.commentType !== 'general' && (
                  <Badge className={`${commentTypeColors[comment.commentType]} text-white text-xs`}>
                    {commentTypeLabels[comment.commentType]}
                  </Badge>
                )}

                {/* Answered Badge */}
                {comment.isQuestion && comment.isAnswered && (
                  <Badge className="bg-green-600 text-white text-xs">
                    ✓ Answered
                  </Badge>
                )}

                {/* Pinned Badge */}
                {comment.isPinned && (
                  <Badge className="bg-orange-600 text-white text-xs">
                    <Pin className="w-3 h-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>{timeSince}</span>
                {comment.isEdited && (
                  <>
                    <span>•</span>
                    <span className="text-xs">edited</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => setShowReactions(!showReactions)}
            >
              <Smile className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEdit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(comment.content)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-gray-300 mb-4 whitespace-pre-wrap">
            {comment.content}
          </div>
        )}

        {/* Attachments */}
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="space-y-2 mb-4">
            {comment.attachments.map((attachment, index) => (
              <div key={index} className="border border-gray-700 rounded p-2">
                {attachment.type === 'image' && (
                  <img
                    src={attachment.url}
                    alt={attachment.title || 'Attachment'}
                    className="max-w-md rounded"
                  />
                )}
                {attachment.type === 'link' && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {attachment.title || attachment.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reaction Buttons Popup */}
        {showReactions && (
          <div className="flex gap-1 mb-4 p-2 bg-gray-900 rounded-lg border border-gray-700">
            {Object.entries(reactionEmojis).map(([type, emoji]) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className="text-lg hover:bg-gray-700"
                onClick={() => handleReaction(type)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}

        {/* Comment Actions & Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-4">
            {/* Reactions Summary */}
            {getTotalReactions() > 0 && (
              <div className="flex items-center gap-1">
                {Object.entries(comment.reactions).map(([type, count]) =>
                  count > 0 && (
                    <span key={type} className="flex items-center gap-1 text-sm text-gray-400">
                      {reactionEmojis[type as keyof typeof reactionEmojis]} {count}
                    </span>
                  )
                )}
              </div>
            )}

            {/* Reply Count */}
            {comment.replyCount > 0 && (
              <span className="text-sm text-gray-400">
                {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Reply Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => onReply(comment._id)}
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>

            {/* Edit Button (own comments) */}
            {isOwnComment && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}

            {/* Mark as Answer (for questions) */}
            {comment.isQuestion && !comment.isAnswered && comment.isDeveloperComment && (
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300"
                onClick={() => onMarkAsAnswer(comment._id)}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}

            {/* Flag Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-400"
              onClick={() => onFlag(comment._id, 'inappropriate')}
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CommentSystem({
  projectId,
  productionLogId,
  comments,
  totalComments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReactToComment,
  onFlagComment,
  onMarkAsAnswer,
  className = ''
}: CommentSystemProps) {
  const { data: session } = useSession()
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<string>('general')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [filterBy, setFilterBy] = useState<string>('all')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !session) return

    try {
      await onAddComment(newComment, replyingTo || undefined, commentType)
      setNewComment('')
      setReplyingTo(null)
      setCommentType('general')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId)
    textareaRef.current?.focus()
  }

  const organizeComments = (comments: Comment[]) => {
    const topLevel = comments.filter(c => !c.parentComment)
    const replies = comments.filter(c => c.parentComment)

    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parentComment === comment._id)
    }))
  }

  const organizedComments = organizeComments(comments)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comment Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">
          Discussion ({totalComments})
        </h3>

        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>

          {/* Filter Options */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1 text-sm"
          >
            <option value="all">All Comments</option>
            <option value="questions">Questions Only</option>
            <option value="developer">Developer Comments</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>
      </div>

      {/* Add Comment Form */}
      {session ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            {replyingTo && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-gray-400 text-sm">Replying to comment</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="general">General Comment</option>
                  <option value="question">Question</option>
                  <option value="feedback">Feedback</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="feature_request">Feature Request</option>
                </select>
              </div>

              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Write your reply..." : "Share your thoughts about this project..."}
                className="bg-gray-900 border-gray-700 text-white resize-none"
                rows={4}
              />

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  {newComment.length}/1000 characters
                </span>

                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {replyingTo ? 'Reply' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-gray-400 mb-4">Sign in to join the discussion</p>
            <Button className="bg-orange-600 hover:bg-orange-700">
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {organizedComments.length > 0 ? (
          organizedComments.map((comment) => (
            <div key={comment._id}>
              <CommentCard
                comment={comment}
                onReply={handleReply}
                onEdit={onEditComment}
                onDelete={onDeleteComment}
                onReact={onReactToComment}
                onFlag={onFlagComment}
                onMarkAsAnswer={onMarkAsAnswer}
                currentUserId={session?.user?.id}
              />

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-2">
                  {comment.replies.map((reply) => (
                    <CommentCard
                      key={reply._id}
                      comment={reply}
                      onReply={handleReply}
                      onEdit={onEditComment}
                      onDelete={onDeleteComment}
                      onReact={onReactToComment}
                      onFlag={onFlagComment}
                      onMarkAsAnswer={onMarkAsAnswer}
                      isReply={true}
                      currentUserId={session?.user?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No comments yet</h3>
              <p className="text-gray-500">Be the first to share your thoughts about this project!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
