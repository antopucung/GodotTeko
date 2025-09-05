'use client'

import { useState, useEffect } from 'react'
import {
  Play,
  Plus,
  Search,
  Filter,
  Eye,
  Heart,
  Download,
  Share,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Image,
  Video,
  FileText,
  Star,
  Lock,
  Unlock,
  Camera,
  Palette,
  Code,
  Layers,
  Zap,
  Crown
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

interface VIPProject {
  _id: string
  title: string
  subtitle: string
  description: string
  status: 'development' | 'completed' | 'released'
  category: string
  thumbnail: string
  heroImage: string
  createdAt: string
  updatedAt: string

  // Media content
  media: {
    trailer?: {
      url: string
      thumbnail: string
      duration: number
    }
    gallery: GalleryItem[]
    downloads: DownloadableAsset[]
  }

  // VIP features
  vipFeatures: {
    vipSubscribers: number
    totalViews: number
    likes: number
    downloads: number
  }

  // Project details
  timeline: TimelineEvent[]
  technicalSpecs: {
    software: string[]
    renderEngine: string
    targetPlatform: string[]
  }
  credits: ProjectCredit[]
}

interface GalleryItem {
  _id: string
  image: string
  caption: string
  category: 'concept' | 'wip' | 'final' | 'bts' | 'character' | 'environment'
  vipOnly?: boolean
}

interface DownloadableAsset {
  _id: string
  title: string
  description: string
  fileUrl: string
  fileSize: number
  fileType: string
  accessLevel: 'free' | 'student' | 'individual' | 'professional' | 'team'
  vipOnly?: boolean
}

interface TimelineEvent {
  _id: string
  date: string
  title: string
  description: string
  type: 'milestone' | 'update' | 'release'
  media?: string[]
  vipOnly?: boolean
}

interface ProjectCredit {
  name: string
  role: string
  user?: string
}

const PROJECT_CATEGORIES = [
  'Game Project',
  '3D Animation',
  'Short Film',
  'Architectural Visualization',
  'Character Design',
  'Environment Art',
  'VFX Project',
  'Product Visualization'
]

const SOFTWARE_OPTIONS = [
  'Blender',
  'Unity',
  'Unreal Engine',
  'Godot',
  'Maya',
  '3ds Max',
  'Substance Painter',
  'Photoshop',
  'After Effects'
]

export default function VIPProjectGallery() {
  const [projects, setProjects] = useState<VIPProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<VIPProject | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/creator/projects')
      const data = await response.json()

      if (data.success) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || project.category === filterCategory
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'released': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Game Project': return Play
      case '3D Animation': return Video
      case 'Character Design': return Users
      case 'Environment Art': return Layers
      default: return Image
    }
  }

  const totalStats = projects.reduce((acc, project) => ({
    views: acc.views + project.vipFeatures.totalViews,
    likes: acc.likes + project.vipFeatures.likes,
    subscribers: acc.subscribers + project.vipFeatures.vipSubscribers,
    downloads: acc.downloads + project.vipFeatures.downloads
  }), { views: 0, likes: 0, subscribers: 0, downloads: 0 })

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
          <h1 className="text-2xl font-bold text-gray-900">VIP Project Gallery</h1>
          <p className="text-gray-600">Showcase your creative process and monetize behind-the-scenes content</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Plus className="w-4 h-4 mr-2" />
          New VIP Project
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Views</p>
                <p className="text-2xl font-bold text-blue-700">{totalStats.views.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-600">Total Likes</p>
                <p className="text-2xl font-bold text-pink-700">{totalStats.likes.toLocaleString()}</p>
              </div>
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">VIP Subscribers</p>
                <p className="text-2xl font-bold text-purple-700">{totalStats.subscribers.toLocaleString()}</p>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Downloads</p>
                <p className="text-2xl font-bold text-green-700">{totalStats.downloads.toLocaleString()}</p>
              </div>
              <Download className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Categories</option>
              {PROJECT_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="development">In Development</option>
              <option value="completed">Completed</option>
              <option value="released">Released</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'No projects found' : 'No VIP projects yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms or filters'
                : 'Create your first VIP project to showcase your creative process'
              }
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Create VIP Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const CategoryIcon = getCategoryIcon(project.category)

            return (
              <Card key={project._id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
                <div className="relative">
                  <img
                    src={project.heroImage || project.thumbnail}
                    alt={project.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>

                  {/* VIP Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  </div>

                  {/* Play Button Overlay */}
                  {project.media.trailer && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Project Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-bold text-lg mb-1">{project.title}</h3>
                    {project.subtitle && (
                      <p className="text-sm text-gray-200">{project.subtitle}</p>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CategoryIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{project.category}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 text-xs text-center mb-4">
                    <div>
                      <div className="font-semibold text-gray-900">{project.vipFeatures.totalViews}</div>
                      <div className="text-gray-500">Views</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{project.vipFeatures.likes}</div>
                      <div className="text-gray-500">Likes</div>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-600">{project.vipFeatures.vipSubscribers}</div>
                      <div className="text-gray-500">VIP</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{project.vipFeatures.downloads}</div>
                      <div className="text-gray-500">Downloads</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Link href={`/creator/projects/${project._id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/creator/projects/${project._id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Export
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
            )
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateVIPProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newProject) => {
          setProjects([newProject, ...projects])
          setShowCreateModal(false)
          toast.success('VIP project created successfully!')
        }}
      />
    </div>
  )
}

// Create VIP Project Modal
function CreateVIPProjectModal({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess: (project: VIPProject) => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    software: [] as string[],
    renderEngine: '',
    targetPlatform: [] as string[]
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      const response = await fetch('/api/creator/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        onSuccess(result.project)
      } else {
        toast.error('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            Create VIP Project
          </DialogTitle>
          <DialogDescription>
            Showcase your creative process and build a following with behind-the-scenes content
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Cyberpunk City Environment"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                placeholder="Brief tagline or description"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your project, creative vision, and what VIP subscribers will get..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select a category</option>
              {PROJECT_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Software Used</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {SOFTWARE_OPTIONS.map(software => (
                  <label key={software} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.software.includes(software)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            software: [...formData.software, software]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            software: formData.software.filter(s => s !== software)
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{software}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="renderEngine">Render Engine</Label>
              <Input
                id="renderEngine"
                placeholder="e.g., Cycles, Eevee, Arnold"
                value={formData.renderEngine}
                onChange={(e) => setFormData({ ...formData, renderEngine: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              VIP Project Features
            </h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Behind-the-scenes content and process documentation</li>
              <li>• Exclusive downloads for VIP subscribers</li>
              <li>• Creator commentary and insights</li>
              <li>• Development timeline with milestones</li>
              <li>• Premium project files and assets</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? 'Creating...' : 'Create VIP Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
