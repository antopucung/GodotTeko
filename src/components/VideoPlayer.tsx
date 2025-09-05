'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface VideoData {
  id: string
  title: string
  url?: string
  embedId?: string
  platform?: 'youtube' | 'vimeo' | 'direct'
  thumbnail?: string
  duration?: string
  description?: string
  category?: 'gameplay' | 'dev_log' | 'tutorial' | 'timelapse' | 'trailer' | 'behind_scenes'
}

interface VideoPlayerProps {
  video: VideoData
  autoplay?: boolean
  showControls?: boolean
  showInfo?: boolean
  className?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

// Extract video ID from various URL formats
const extractVideoId = (url: string, platform: string): string => {
  if (platform === 'youtube') {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : ''
  } else if (platform === 'vimeo') {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i
    const match = url.match(regExp)
    return match ? match[1] : ''
  }
  return ''
}

// Get embed URL for different platforms
const getEmbedUrl = (video: VideoData): string => {
  const videoId = video.embedId || (video.url ? extractVideoId(video.url, video.platform || 'youtube') : '')

  switch (video.platform) {
    case 'youtube':
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`
    case 'vimeo':
      return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`
    case 'direct':
      return video.url || ''
    default:
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`
  }
}

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'gameplay': return 'bg-blue-600'
    case 'dev_log': return 'bg-green-600'
    case 'tutorial': return 'bg-purple-600'
    case 'timelapse': return 'bg-orange-600'
    case 'trailer': return 'bg-red-600'
    case 'behind_scenes': return 'bg-yellow-600'
    default: return 'bg-gray-600'
  }
}

const getCategoryLabel = (category?: string) => {
  switch (category) {
    case 'gameplay': return 'Gameplay'
    case 'dev_log': return 'Dev Log'
    case 'tutorial': return 'Tutorial'
    case 'timelapse': return 'Timelapse'
    case 'trailer': return 'Trailer'
    case 'behind_scenes': return 'Behind the Scenes'
    default: return 'Video'
  }
}

export default function VideoPlayer({
  video,
  autoplay = false,
  showControls = true,
  showInfo = true,
  className = '',
  onPlay,
  onPause,
  onEnded
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const embedUrl = getEmbedUrl(video)
  const autoplayUrl = autoplay ? `${embedUrl}&autoplay=1` : embedUrl

  const handlePlay = () => {
    setShowThumbnail(false)
    setIsPlaying(true)
    setIsLoaded(true)
    onPlay?.()
  }

  const handlePause = () => {
    setIsPlaying(false)
    onPause?.()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getThumbnailUrl = () => {
    if (video.thumbnail) return video.thumbnail

    const videoId = video.embedId || (video.url ? extractVideoId(video.url, video.platform || 'youtube') : '')

    if (video.platform === 'youtube' && videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    } else if (video.platform === 'vimeo' && videoId) {
      // For Vimeo, we'd need to make an API call to get the thumbnail
      // For now, using a placeholder
      return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=450&fit=crop'
    }

    return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=450&fit=crop'
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-900 rounded-lg overflow-hidden group ${className}`}
    >
      {/* Video Container */}
      <div className="relative aspect-video">
        {showThumbnail && !isLoaded ? (
          // Thumbnail with Play Button
          <div className="relative w-full h-full">
            <img
              src={getThumbnailUrl()}
              alt={video.title}
              className="w-full h-full object-cover"
            />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
              <Button
                onClick={handlePlay}
                className="bg-white/90 hover:bg-white text-gray-900 rounded-full w-16 h-16 p-0 shadow-lg transform hover:scale-110 transition-all duration-200"
              >
                <Play className="w-6 h-6 ml-1" fill="currentColor" />
              </Button>
            </div>

            {/* Duration Badge */}
            {video.duration && (
              <div className="absolute bottom-3 right-3">
                <Badge className="bg-black/80 text-white text-sm">
                  {video.duration}
                </Badge>
              </div>
            )}

            {/* Category Badge */}
            {video.category && (
              <div className="absolute top-3 left-3">
                <Badge className={`${getCategoryColor(video.category)} text-white text-sm`}>
                  {getCategoryLabel(video.category)}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          // Embedded Video Player
          <div className="relative w-full h-full">
            {video.platform === 'direct' ? (
              <video
                className="w-full h-full"
                controls={showControls}
                autoPlay={autoplay}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={onEnded}
              >
                <source src={video.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                ref={iframeRef}
                src={autoplayUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            )}

            {/* Custom Controls Overlay (for embedded videos) */}
            {showControls && video.platform !== 'direct' && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={toggleFullscreen}
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Info */}
      {showInfo && (
        <div className="p-4">
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
            {video.title}
          </h3>

          {video.description && (
            <p className="text-gray-300 text-sm line-clamp-3 mb-3">
              {video.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {video.category && (
                <Badge className={`${getCategoryColor(video.category)} text-white text-xs`}>
                  {getCategoryLabel(video.category)}
                </Badge>
              )}
              {video.duration && (
                <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
                  {video.duration}
                </Badge>
              )}
            </div>

            {video.url && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => window.open(video.url, '_blank')}
              >
                Watch on {video.platform === 'youtube' ? 'YouTube' : video.platform === 'vimeo' ? 'Vimeo' : 'External'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Video Playlist Component
interface VideoPlaylistProps {
  videos: VideoData[]
  currentVideo?: string
  onVideoSelect?: (video: VideoData) => void
  className?: string
}

export function VideoPlaylist({ videos, currentVideo, onVideoSelect, className = '' }: VideoPlaylistProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-white font-semibold text-lg mb-4">Video Playlist</h3>
      {videos.map((video, index) => (
        <div
          key={video.id}
          className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
            currentVideo === video.id
              ? 'bg-orange-600/20 border border-orange-600/50'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
          onClick={() => onVideoSelect?.(video)}
        >
          {/* Video Thumbnail */}
          <div className="relative w-24 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
            <img
              src={video.thumbnail || `https://img.youtube.com/vi/${video.embedId}/mqdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            {video.duration && (
              <div className="absolute bottom-1 right-1">
                <Badge className="bg-black/80 text-white text-xs px-1 py-0">
                  {video.duration}
                </Badge>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">
              {video.title}
            </h4>
            {video.description && (
              <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                {video.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              {video.category && (
                <Badge className={`${getCategoryColor(video.category)} text-white text-xs`}>
                  {getCategoryLabel(video.category)}
                </Badge>
              )}
            </div>
          </div>

          {/* Play Indicator */}
          {currentVideo === video.id && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Video Analytics Hook
export function useVideoAnalytics(videoId: string) {
  const [analytics, setAnalytics] = useState({
    views: 0,
    watchTime: 0,
    completionRate: 0,
    likes: 0
  })

  const trackView = () => {
    // Track video view
    console.log(`Tracking view for video: ${videoId}`)
    setAnalytics(prev => ({ ...prev, views: prev.views + 1 }))
  }

  const trackWatchTime = (seconds: number) => {
    // Track watch time
    setAnalytics(prev => ({ ...prev, watchTime: prev.watchTime + seconds }))
  }

  const trackCompletion = () => {
    // Track video completion
    console.log(`Video completed: ${videoId}`)
    setAnalytics(prev => ({ ...prev, completionRate: prev.completionRate + 1 }))
  }

  return {
    analytics,
    trackView,
    trackWatchTime,
    trackCompletion
  }
}
