'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Gamepad2,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Users,
  ThumbsUp,
  Search,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface GameProject {
  _id: string
  title: string
  slug: { current: string }
  description: string
  year: number
  status: 'released' | 'in_development' | 'prototype'
  poster: string
  studio: {
    name: string
    slug: { current: string }
    id?: string
  }
  platforms: string[]
  genre: string[]
  tech: string[]
  stats: {
    views: number
    likes: number
    downloads: number
  }
  duration: string
  team: {
    size: number
    roles: string[]
  }
  featured: boolean
  approved: boolean
  submittedBy: string
  createdAt: Date
  updatedAt: Date
}

export default function AdminProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<GameProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState<GameProject | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      // Check if user is admin
      const userRole = session?.user?.role || 'user'
      if (userRole !== 'admin') {
        router.push('/admin')
        return
      }
      fetchProjects()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, session])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      // Fetch all projects including unapproved ones for admin
      const response = await fetch('/api/admin/projects')
      const data = await response.json()

      if (data.success) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      // Fallback: fetch regular projects
      try {
        const fallbackResponse = await fetch('/api/projects?includeUnapproved=true')
        const fallbackData = await fallbackResponse.json()
        if (fallbackData.success) {
          setProjects(fallbackData.projects)
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveProject = async (project: GameProject) => {
    try {
      const response = await fetch(`/api/admin/projects/${project._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes })
      })

      if (response.ok) {
        fetchProjects()
        setIsReviewDialogOpen(false)
        setSelectedProject(null)
        setReviewNotes('')
      }
    } catch (error) {
      console.error('Error approving project:', error)
      // Fallback: update project status manually
      try {
        const fallbackResponse = await fetch(`/api/projects/${project._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: true })
        })
        if (fallbackResponse.ok) {
          fetchProjects()
          setIsReviewDialogOpen(false)
          setSelectedProject(null)
        }
      } catch (fallbackError) {
        console.error('Fallback approval failed:', fallbackError)
      }
    }
  }

  const handleRejectProject = async (project: GameProject) => {
    if (!reviewNotes.trim()) {
      alert('Please provide feedback for rejection')
      return
    }

    try {
      const response = await fetch(`/api/admin/projects/${project._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes })
      })

      if (response.ok) {
        fetchProjects()
        setIsReviewDialogOpen(false)
        setSelectedProject(null)
        setReviewNotes('')
      }
    } catch (error) {
      console.error('Error rejecting project:', error)
      // For now, just remove from list as fallback
      setProjects(prev => prev.filter(p => p._id !== project._id))
      setIsReviewDialogOpen(false)
      setSelectedProject(null)
    }
  }

  const handleToggleFeatured = async (project: GameProject) => {
    try {
      const response = await fetch(`/api/projects/${project._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !project.featured })
      })

      if (response.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Error toggling featured status:', error)
    }
  }

  const openReviewDialog = (project: GameProject) => {
    setSelectedProject(project)
    setReviewNotes('')
    setIsReviewDialogOpen(true)
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.studio.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'approved' && project.approved) ||
                         (statusFilter === 'pending' && !project.approved) ||
                         (statusFilter === 'featured' && project.featured)

    return matchesSearch && matchesStatus
  })

  const pendingCount = projects.filter(p => !p.approved).length
  const approvedCount = projects.filter(p => p.approved).length
  const featuredCount = projects.filter(p => p.featured).length

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Moderation</h1>
          <p className="text-gray-600">Review and approve community project submissions</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              <Clock className="w-3 h-3 mr-1" />
              {pendingCount} Pending
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              {approvedCount} Approved
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              ⭐ {featuredCount} Featured
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6">
        {filteredProjects.map((project) => (
          <Card key={project._id} className="flex">
            <div className="w-48 h-32 bg-gray-200 rounded-l-lg overflow-hidden">
              <img
                src={project.poster}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <Badge variant={project.approved ? "default" : "secondary"}>
                      {project.approved ? 'Approved' : 'Pending'}
                    </Badge>
                    {project.featured && (
                      <Badge className="bg-blue-100 text-blue-800">Featured</Badge>
                    )}
                    <Badge variant="outline">{project.status}</Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {project.studio.name}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {project.duration}
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {project.stats.views}
                    </span>
                    <span className="flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {project.stats.likes}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {project.genre.slice(0, 3).map((g) => (
                      <Badge key={g} variant="outline" className="text-xs">
                        {g}
                      </Badge>
                    ))}
                    {project.tech.slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!project.approved ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(project)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFeatured(project)}
                        className={project.featured ? "bg-blue-50 text-blue-600" : ""}
                      >
                        ⭐ {project.featured ? 'Unfeature' : 'Feature'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(project)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects found</h3>
          <p className="text-gray-500">No projects match your current filters</p>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Review project submission from {selectedProject?.studio.name}
            </DialogDescription>
          </DialogHeader>

          {selectedProject && (
            <div className="py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedProject.poster}
                    alt={selectedProject.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Project Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Status:</strong> {selectedProject.status}</div>
                      <div><strong>Year:</strong> {selectedProject.year}</div>
                      <div><strong>Duration:</strong> {selectedProject.duration}</div>
                      <div><strong>Team Size:</strong> {selectedProject.team.size}</div>
                      <div><strong>Platforms:</strong> {selectedProject.platforms.join(', ')}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProject.tech.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Genres</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProject.genre.map((genre) => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {!selectedProject.approved && (
                <div className="mt-6">
                  <Label htmlFor="review-notes">Review Notes</Label>
                  <Textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes for approval/rejection..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Close
            </Button>

            {selectedProject && !selectedProject.approved && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleRejectProject(selectedProject)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button onClick={() => handleApproveProject(selectedProject)}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
