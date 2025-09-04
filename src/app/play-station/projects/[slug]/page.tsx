'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PlayCircle,
  Calendar,
  Users,
  Code,
  Eye,
  Star,
  Download,
  ExternalLink,
  Clock,
  Award,
  Gamepad2,
  Monitor,
  Smartphone,
  ArrowLeft,
  Share2,
  BookOpen,
  FileText,
  Video,
  Image as ImageIcon,
  ChevronRight,
  MessageCircle
} from 'lucide-react'
import VideoPlayer, { VideoPlaylist } from '@/components/VideoPlayer'
import CommentSystem from '@/components/CommentSystem'
import { GameProject } from '@/components/cards/ProjectCard'

interface ProjectPageProps {
  params: {
    slug: string
  }
}

interface Article {
  _id: string
  title: string
  description: string
  publishedAt: string
  readTime: string
  type: 'article' | 'video' | 'tutorial'
  slug: { current: string }
}

interface ProductionLog {
  _id: string
  title: string
  publishedAt: string
  author: {
    name: string
    role: string
    avatar?: string
  }
  content: string
  media: Array<{
    type: 'image' | 'video'
    url: string
    title: string
    duration?: string
  }>
}

interface GalleryItem {
  _id: string
  title: string
  type: 'concept_art' | 'screenshot' | 'video' | 'asset' | 'dev_log'
  url: string
  thumbnail?: string
  description?: string
  category: string
  tags: string[]
  vipOnly?: boolean
}

// Mock data (in production, fetch from API)
const mockProject: GameProject = {
  _id: '1',
  title: 'Cyber Runners',
  slug: { current: 'cyber-runners' },
  description: 'A cyberpunk racing game built with Godot 4. Complete post-mortem covering art pipeline, performance optimization, and multiplayer implementation.',
  year: 2024,
  status: 'released',
  poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=1080&fit=crop',
  studio: {
    name: 'Neon Games',
    slug: { current: 'neon-games' }
  },
  platforms: ['PC', 'Steam', 'PlayStation', 'Xbox'],
  genre: ['Racing', 'Cyberpunk', 'Multiplayer'],
  tech: ['Godot 4', 'GDScript', 'C#', 'Blender', 'Substance Painter', 'Audacity'],
  stats: {
    views: 15600,
    likes: 342,
    downloads: 1250
  },
  duration: '18 months',
  team: {
    size: 8,
    roles: ['Programming', 'Art', 'Game Design', 'Audio', 'QA']
  },
  featured: true
}

const mockVideos = [
  {
    id: '1',
    title: 'Cyber Runners - Gameplay Trailer',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedId: 'dQw4w9WgXcQ',
    platform: 'youtube' as const,
    duration: '2:34',
    category: 'trailer' as const,
    description: 'Official gameplay trailer showcasing the cyberpunk racing experience and neon-lit environments.'
  },
  {
    id: '2',
    title: 'Development Log #5: Art Pipeline',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedId: 'dQw4w9WgXcQ',
    platform: 'youtube' as const,
    duration: '12:45',
    category: 'dev_log' as const,
    description: 'Deep dive into our art pipeline using Blender and Substance Painter for creating the cyberpunk aesthetic.'
  },
  {
    id: '3',
    title: 'Multiplayer Netcode Implementation',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedId: 'dQw4w9WgXcQ',
    platform: 'youtube' as const,
    duration: '18:22',
    category: 'tutorial' as const,
    description: 'Technical tutorial on implementing smooth multiplayer racing with client-side prediction and lag compensation.'
  },
  {
    id: '4',
    title: '2 Years of Development - Timelapse',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedId: 'dQw4w9WgXcQ',
    platform: 'youtube' as const,
    duration: '4:12',
    category: 'timelapse' as const,
    description: 'Watch the entire development journey from prototype to final release in 4 minutes.'
  }
]

const mockComments = [
  {
    _id: '1',
    content: 'This is incredible! The art style is absolutely stunning. How did you achieve the neon glow effects?',
    author: {
      _id: 'user1',
      name: 'Alex DevGamer',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      role: 'Indie Developer',
      isVerified: true
    },
    postedAt: '2024-08-25T10:30:00Z',
    isEdited: false,
    isDeveloperComment: false,
    isPinned: false,
    isHighlighted: false,
    replyCount: 2,
    reactions: {
      likes: 15,
      hearts: 8,
      laughs: 0,
      surprised: 2,
      thumbsUp: 12,
      thumbsDown: 0
    },
    commentType: 'question' as const,
    isQuestion: true,
    isAnswered: true,
    moderationStatus: 'published' as const
  },
  {
    _id: '2',
    content: 'Thanks for the question! We used a combination of bloom post-processing and custom shaders. The key was layering multiple emission sources and carefully balancing the intensity. I\'ll be posting a detailed tutorial on this soon!',
    author: {
      _id: 'dev1',
      name: 'Maya Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332db85?w=100&h=100&fit=crop&crop=face',
      role: 'Technical Artist',
      isVerified: true
    },
    postedAt: '2024-08-25T14:20:00Z',
    isEdited: false,
    isDeveloperComment: true,
    isPinned: false,
    isHighlighted: true,
    parentComment: '1',
    replyCount: 0,
    reactions: {
      likes: 28,
      hearts: 15,
      laughs: 0,
      surprised: 0,
      thumbsUp: 25,
      thumbsDown: 0
    },
    commentType: 'general' as const,
    isQuestion: false,
    isAnswered: false,
    moderationStatus: 'published' as const
  },
  {
    _id: '3',
    content: 'The multiplayer implementation looks solid! Any plans to open-source parts of the netcode? The racing community could really benefit from this.',
    author: {
      _id: 'user2',
      name: 'CodeMaster3000',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      role: 'Engine Developer'
    },
    postedAt: '2024-08-26T09:15:00Z',
    isEdited: false,
    isDeveloperComment: false,
    isPinned: false,
    isHighlighted: false,
    replyCount: 1,
    reactions: {
      likes: 22,
      hearts: 3,
      laughs: 0,
      surprised: 0,
      thumbsUp: 18,
      thumbsDown: 0
    },
    commentType: 'feature_request' as const,
    isQuestion: false,
    isAnswered: false,
    moderationStatus: 'published' as const
  },
  {
    _id: '4',
    content: 'Absolutely amazing work! The attention to detail in every frame is just incredible. This has inspired me to start my own cyberpunk project. Keep up the fantastic work! 🚀',
    author: {
      _id: 'user3',
      name: 'PixelArtist',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      role: '2D Artist'
    },
    postedAt: '2024-08-27T16:45:00Z',
    isEdited: false,
    isDeveloperComment: false,
    isPinned: true,
    isHighlighted: false,
    replyCount: 0,
    reactions: {
      likes: 45,
      hearts: 32,
      laughs: 0,
      surprised: 8,
      thumbsUp: 38,
      thumbsDown: 0
    },
    commentType: 'praise' as const,
    isQuestion: false,
    isAnswered: false,
    moderationStatus: 'published' as const
  }
]

const mockArticles: Article[] = [
  {
    _id: '1',
    title: 'The Art Pipeline of Cyber Runners',
    description: 'How we created the cyberpunk aesthetic using Blender and Substance Painter, including our complete workflow and optimization techniques.',
    publishedAt: '2024-08-20',
    readTime: '8 min read',
    type: 'article',
    slug: { current: 'art-pipeline-cyber-runners' }
  },
  {
    _id: '2',
    title: 'Announcing Cyber Runners',
    description: 'Our journey from concept to Steam release. Learn about our development philosophy and what inspired this cyberpunk racing experience.',
    publishedAt: '2024-06-15',
    readTime: '5 min read',
    type: 'article',
    slug: { current: 'announcing-cyber-runners' }
  }
]

const mockProductionLogs: ProductionLog[] = [
  {
    _id: '1',
    title: 'Racing into the Future!',
    publishedAt: '2024-08-25',
    author: {
      name: 'Alex Chen',
      role: 'Lead Developer',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    content: 'This week we finalized the multiplayer netcode and polished the final racing tracks. The cyberpunk atmosphere is really coming together with our new shader work.',
    media: [
      {
        type: 'video',
        url: '#',
        title: 'Multiplayer Race Demo',
        duration: '2:34'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop',
        title: 'Neon City Track'
      }
    ]
  },
  {
    _id: '2',
    title: 'Shader Magic & Performance',
    publishedAt: '2024-08-18',
    author: {
      name: 'Maya Rodriguez',
      role: 'Technical Artist',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332db85?w=100&h=100&fit=crop&crop=face'
    },
    content: 'We\'ve been working on optimizing our neon glow effects and rain shaders. The performance improvements are significant while maintaining the visual quality.',
    media: [
      {
        type: 'video',
        url: '#',
        title: 'Shader Breakdown',
        duration: '1:45'
      }
    ]
  }
]

const mockGalleryItems: GalleryItem[] = [
  {
    _id: '1',
    title: 'Neon City Concept Art',
    type: 'concept_art',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=800&fit=crop',
    category: 'Environment',
    tags: ['concept', 'city', 'neon'],
    description: 'Early concept art for the main racing environment'
  },
  {
    _id: '2',
    title: 'Character Design Sheet',
    type: 'concept_art',
    url: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1200&h=800&fit=crop',
    category: 'Characters',
    tags: ['character', 'design', 'cyberpunk'],
    description: 'Main character design iterations'
  },
  {
    _id: '3',
    title: 'Gameplay Trailer',
    type: 'video',
    url: '#',
    thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=800&fit=crop',
    category: 'Marketing',
    tags: ['trailer', 'gameplay'],
    description: 'Official gameplay reveal trailer'
  },
  {
    _id: '4',
    title: 'Car Models Pack',
    type: 'asset',
    url: '#',
    thumbnail: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1200&h=800&fit=crop',
    category: 'Assets',
    tags: ['3d', 'models', 'vehicles'],
    description: 'Complete vehicle asset pack with textures'
  }
]

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const [project, setProject] = useState<GameProject | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [currentVideo, setCurrentVideo] = useState<string | undefined>(mockVideos[0]?.id)
  const [selectedVideo, setSelectedVideo] = useState(mockVideos[0])

  // Mock comment handlers (in production, these would call APIs)
  const handleAddComment = async (content: string, parentId?: string, type?: string) => {
    console.log('Adding comment:', { content, parentId, type })
    // API call would go here
  }

  const handleEditComment = async (commentId: string, content: string) => {
    console.log('Editing comment:', { commentId, content })
    // API call would go here
  }

  const handleDeleteComment = async (commentId: string) => {
    console.log('Deleting comment:', commentId)
    // API call would go here
  }

  const handleReactToComment = async (commentId: string, reaction: string) => {
    console.log('Reacting to comment:', { commentId, reaction })
    // API call would go here
  }

  const handleFlagComment = async (commentId: string, reason: string) => {
    console.log('Flagging comment:', { commentId, reason })
    // API call would go here
  }

  const handleMarkAsAnswer = async (commentId: string) => {
    console.log('Marking as answer:', commentId)
    // API call would go here
  }

  const handleVideoSelect = (video: typeof mockVideos[0]) => {
    setSelectedVideo(video)
    setCurrentVideo(video.id)
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // In production, fetch based on params.slug
      setProject(mockProject)
      setArticles(mockArticles)
      setProductionLogs(mockProductionLogs)
      setGalleryItems(mockGalleryItems)
      setIsLoading(false)
    }, 1000)
  }, [params.slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-800 rounded-lg mb-8"></div>
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-2/3"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!project) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'released': return 'bg-green-100 text-green-800'
      case 'in_development': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    if (platform.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/play-station" className="text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Play.Station
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">{project.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={project.poster}
            alt={project.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-gray-900/20" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Badge className={getStatusColor(project.status)}>
                {project.status === 'released' ? 'Released' :
                 project.status === 'in_development' ? 'In Development' : 'Cancelled'}
              </Badge>
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{project.year}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {project.title}
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <PlayCircle className="w-4 h-4 mr-2" />
                Explore Content Gallery
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <Download className="w-4 h-4 mr-2" />
                Download Assets
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <Share2 className="w-4 h-4 mr-2" />
                Share Project
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{(project.stats.views / 1000).toFixed(1)}K</div>
                <div className="text-gray-400 text-sm">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{project.stats.likes}</div>
                <div className="text-gray-400 text-sm">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{project.team?.size}</div>
                <div className="text-gray-400 text-sm">Team Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{project.duration}</div>
                <div className="text-gray-400 text-sm">Dev Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="bg-gray-900">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-800">
              <TabsList className="bg-transparent border-none h-auto p-0">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
                >
                  Project Overview
                </TabsTrigger>
                <TabsTrigger
                  value="gallery"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
                >
                  Content Gallery
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
                >
                  Development Videos
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-6 py-4"
                >
                  Production Logs
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="py-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                  {/* Articles */}
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                      <BookOpen className="w-8 h-8 text-orange-500" />
                      Articles & Insights
                    </h2>
                    <div className="space-y-6">
                      {articles.map((article) => (
                        <Card key={article._id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2 hover:text-orange-400 transition-colors">
                                  <Link href={`/blog/${article.slug.current}`}>
                                    {article.title}
                                  </Link>
                                </h3>
                                <p className="text-gray-300 mb-4">{article.description}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{article.readTime}</span>
                                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                                    {article.type}
                                  </Badge>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300">
                                Read More →
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                  {/* Project Details */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Studio</h4>
                        <p className="text-white">{project.studio.name}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Platforms</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.platforms.map((platform) => (
                            <Badge key={platform} variant="outline" className="text-gray-300 border-gray-600">
                              {getPlatformIcon(platform)}
                              <span className="ml-1">{platform}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Genre</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.genre.map((genre) => (
                            <Badge key={genre} className="bg-purple-600 text-white">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.tech.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-blue-400 border-blue-400">
                              <Code className="w-3 h-3 mr-1" />
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Team</h4>
                        <div className="flex items-center gap-2 text-white">
                          <Users className="w-4 h-4" />
                          <span>{project.team?.size} developers</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.team?.roles.map((role) => (
                            <Badge key={role} variant="outline" className="text-xs text-gray-400 border-gray-600">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Stats */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Community Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Eye className="w-4 h-4" />
                          <span>Views</span>
                        </div>
                        <span className="font-semibold text-white">{project.stats.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Star className="w-4 h-4" />
                          <span>Likes</span>
                        </div>
                        <span className="font-semibold text-white">{project.stats.likes}</span>
                      </div>
                      {project.stats.downloads && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Download className="w-4 h-4" />
                            <span>Downloads</span>
                          </div>
                          <span className="font-semibold text-white">{project.stats.downloads}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="py-16">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Gallery Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['All', 'Concept Art', 'Screenshots', 'Videos', 'Assets', 'Development'].map((category) => (
                          <button
                            key={category}
                            className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gallery Grid */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {galleryItems.map((item) => (
                      <Card key={item._id} className="bg-gray-800 border-gray-700 group cursor-pointer overflow-hidden">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={item.thumbnail || item.url}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                                <PlayCircle className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-black/60 text-white text-xs">
                              {item.type === 'concept_art' && <ImageIcon className="w-3 h-3 mr-1" />}
                              {item.type === 'video' && <Video className="w-3 h-3 mr-1" />}
                              {item.type === 'asset' && <Download className="w-3 h-3 mr-1" />}
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-white mb-1 line-clamp-1">{item.title}</h3>
                          {item.description && (
                            <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs text-gray-400 border-gray-600">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Production Logs Tab */}
            <TabsContent value="logs" className="py-16">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">Production Logs</h2>
                  <p className="text-gray-400">
                    Check out the latest updates from the development team.
                    <Link href="#" className="text-orange-400 hover:text-orange-300 ml-1">
                      See all production logs
                    </Link>
                  </p>
                </div>

                <div className="space-y-12">
                  {productionLogs.map((log) => (
                    <div key={log._id} className="border-b border-gray-800 pb-12 last:border-b-0">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{log.title}</h3>
                        <div className="text-gray-400 text-sm">
                          {new Date(log.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-gray-300 leading-relaxed">{log.content}</p>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          {log.author.avatar ? (
                            <Image
                              src={log.author.avatar}
                              alt={log.author.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-white font-semibold">
                              {log.author.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{log.author.name}</div>
                          <div className="text-sm text-gray-400">{log.author.role}</div>
                        </div>
                      </div>

                      {/* Media */}
                      {log.media.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {log.media.map((media, index) => (
                            <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                              <div className="relative aspect-video">
                                {media.type === 'video' ? (
                                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                    <div className="text-center">
                                      <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                      <p className="text-gray-400 text-sm">Subscribe to view</p>
                                      {media.duration && (
                                        <p className="text-gray-500 text-xs">{media.duration}</p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <Image
                                    src={media.url}
                                    alt={media.title}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div className="p-3">
                                <h4 className="text-white font-medium text-sm">{media.title}</h4>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-center mt-12">
                  <p className="text-gray-400 mb-4">But wait, there's more!</p>
                  <Button variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white">
                    See all production logs
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="py-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Video Player */}
                <div className="lg:col-span-2">
                  {selectedVideo && (
                    <VideoPlayer
                      video={selectedVideo}
                      showControls={true}
                      showInfo={true}
                      className="mb-6"
                    />
                  )}

                  {/* Video Description */}
                  {selectedVideo && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">About This Video</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                          {selectedVideo.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <Badge className="bg-orange-600 text-white">
                            {selectedVideo.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <span className="text-gray-400 text-sm">{selectedVideo.duration}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedVideo.url, '_blank')}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Watch on YouTube
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Video Playlist */}
                <div className="lg:col-span-1">
                  <VideoPlaylist
                    videos={mockVideos}
                    currentVideo={currentVideo}
                    onVideoSelect={handleVideoSelect}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Comments Section */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <CommentSystem
            projectId={project?._id || ''}
            comments={mockComments}
            totalComments={mockComments.length}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onReactToComment={handleReactToComment}
            onFlagComment={handleFlagComment}
            onMarkAsAnswer={handleMarkAsAnswer}
            className="max-w-4xl mx-auto"
          />
        </div>
      </section>

      <Footer />
    </div>
  )
}
