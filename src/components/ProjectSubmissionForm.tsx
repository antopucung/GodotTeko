'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Video,
  Link,
  Calendar,
  Users,
  Code,
  Gamepad2,
  Globe,
  Github,
  Youtube,
  Twitter
} from 'lucide-react'
import { toast } from 'sonner'

interface ProjectSubmissionData {
  // Basic Info
  title: string
  description: string
  longDescription: string

  // Project Details
  status: string
  releaseDate?: string
  developmentStartDate?: string
  developmentDuration: string
  teamSize: number

  // Classification
  platforms: string[]
  genres: string[]
  technologies: Array<{
    name: string
    category: string
    usage: string
  }>

  // Media
  poster?: File
  gallery: Array<{
    file?: File
    url?: string
    caption: string
    category: string
  }>
  videos: Array<{
    title: string
    url: string
    embedId: string
    platform: string
    duration: string
    category: string
    description: string
  }>

  // Post-Mortem Content
  postMortemSections: Array<{
    title: string
    content: string
    category: string
  }>

  // Assets & Downloads
  downloadableAssets: Array<{
    title: string
    description: string
    file?: File
    license: string
    requiresAuth: boolean
  }>

  // Links
  externalLinks: {
    website?: string
    steam?: string
    itchIo?: string
    github?: string
    discord?: string
    twitter?: string
    youtube?: string
  }

  // Publishing
  tags: string[]
  isPublic: boolean
  allowComments: boolean

  // Legal
  agreeToTerms: boolean
  confirmOwnership: boolean
  allowCommercialUse: boolean
}

const platformOptions = [
  'PC', 'Steam', 'Epic Games Store', 'GOG',
  'PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One',
  'Nintendo Switch', 'iOS', 'Android', 'Web Browser',
  'VR (Meta Quest)', 'VR (Steam VR)', 'Linux', 'macOS'
]

const genreOptions = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Puzzle',
  'Racing', 'Sports', 'Fighting', 'Shooter', 'Platformer',
  'Horror', 'Survival', 'Roguelike', 'Metroidvania', 'Battle Royale',
  'MMORPG', 'Casual', 'Indie', 'Arcade', 'Educational'
]

const technologyCategories = [
  'engine', 'programming', 'art', 'audio', 'tool', 'platform', 'middleware'
]

const postMortemCategories = [
  'what_worked', 'what_didnt', 'lessons_learned', 'technical_challenges',
  'design_decisions', 'marketing', 'team_dynamics'
]

const licenseOptions = [
  'MIT', 'CC BY', 'CC BY-SA', 'CC0', 'Custom', 'All Rights Reserved'
]

export default function ProjectSubmissionForm({
  onSubmit,
  isSubmitting = false,
  className = ''
}: {
  onSubmit: (data: ProjectSubmissionData) => Promise<void>
  isSubmitting?: boolean
  className?: string
}) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProjectSubmissionData>({
    title: '',
    description: '',
    longDescription: '',
    status: 'released',
    developmentDuration: '',
    teamSize: 1,
    platforms: [],
    genres: [],
    technologies: [],
    gallery: [],
    videos: [],
    postMortemSections: [],
    downloadableAssets: [],
    externalLinks: {},
    tags: [],
    isPublic: true,
    allowComments: true,
    agreeToTerms: false,
    confirmOwnership: false,
    allowCommercialUse: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRefs = {
    poster: useRef<HTMLInputElement>(null),
    gallery: useRef<HTMLInputElement>(null),
    assets: useRef<HTMLInputElement>(null)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1: // Basic Info
        if (!formData.title.trim()) newErrors.title = 'Project title is required'
        if (!formData.description.trim()) newErrors.description = 'Description is required'
        if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters'
        if (!formData.status) newErrors.status = 'Project status is required'
        break

      case 2: // Details
        if (!formData.teamSize || formData.teamSize < 1) newErrors.teamSize = 'Team size must be at least 1'
        if (formData.platforms.length === 0) newErrors.platforms = 'Select at least one platform'
        if (formData.genres.length === 0) newErrors.genres = 'Select at least one genre'
        break

      case 3: // Media
        // Optional validation for media files
        break

      case 4: // Post-Mortem
        if (formData.postMortemSections.length === 0) {
          newErrors.postMortem = 'Add at least one post-mortem section'
        }
        break

      case 5: // Legal
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms'
        if (!formData.confirmOwnership) newErrors.confirmOwnership = 'You must confirm ownership'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (validateStep(5)) {
      try {
        await onSubmit(formData)
        toast.success('Project submitted successfully! We\'ll review it and get back to you.')
      } catch (error) {
        toast.error('Failed to submit project. Please try again.')
        console.error('Submission error:', error)
      }
    }
  }

  const addTechnology = () => {
    setFormData(prev => ({
      ...prev,
      technologies: [...prev.technologies, { name: '', category: 'engine', usage: '' }]
    }))
  }

  const removeTechnology = (index: number) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }))
  }

  const addPostMortemSection = () => {
    setFormData(prev => ({
      ...prev,
      postMortemSections: [...prev.postMortemSections, { title: '', content: '', category: 'what_worked' }]
    }))
  }

  const removePostMortemSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      postMortemSections: prev.postMortemSections.filter((_, i) => i !== index)
    }))
  }

  const addVideo = () => {
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, {
        title: '',
        url: '',
        embedId: '',
        platform: 'youtube',
        duration: '',
        category: 'gameplay',
        description: ''
      }]
    }))
  }

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = (type: 'poster' | 'gallery' | 'assets', files: FileList | null) => {
    if (!files) return

    if (type === 'poster') {
      setFormData(prev => ({ ...prev, poster: files[0] }))
    } else if (type === 'gallery') {
      const newImages = Array.from(files).map(file => ({
        file,
        caption: '',
        category: 'screenshot'
      }))
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...newImages] }))
    }
  }

  if (!session) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Submit Your Game Project</h3>
          <p className="text-gray-400 mb-6">Share your development journey and help other developers learn</p>
          <Button className="bg-orange-600 hover:bg-orange-700">
            Sign In to Submit Project
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step <= currentStep
                  ? 'bg-orange-600 border-orange-600 text-white'
                  : 'border-gray-600 text-gray-400'
              }`}
            >
              {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            {currentStep === 1 && 'Basic Project Information'}
            {currentStep === 2 && 'Project Details & Classification'}
            {currentStep === 3 && 'Media & Visual Assets'}
            {currentStep === 4 && 'Post-Mortem Content'}
            {currentStep === 5 && 'Review & Submit'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-white">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Enter your game's title"
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="text-white">Short Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Brief description of your project (50-500 characters)"
                  rows={3}
                />
                <p className="text-gray-400 text-sm mt-1">{formData.description.length}/500 characters</p>
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <Label htmlFor="longDescription" className="text-white">Detailed Description</Label>
                <Textarea
                  id="longDescription"
                  value={formData.longDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Detailed description of your project, its goals, and what makes it unique"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="status" className="text-white">Project Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="released">Released</SelectItem>
                      <SelectItem value="in_development">In Development</SelectItem>
                      <SelectItem value="early_access">Early Access</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-red-400 text-sm mt-1">{errors.status}</p>}
                </div>

                <div>
                  <Label htmlFor="releaseDate" className="text-white">Release Date</Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    value={formData.releaseDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="developmentDuration" className="text-white">Development Duration</Label>
                  <Input
                    id="developmentDuration"
                    value={formData.developmentDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, developmentDuration: e.target.value }))}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="e.g., 18 months, 2.5 years"
                  />
                </div>

                <div>
                  <Label htmlFor="teamSize" className="text-white">Team Size *</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    min="1"
                    value={formData.teamSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 1 }))}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  {errors.teamSize && <p className="text-red-400 text-sm mt-1">{errors.teamSize}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Project Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-white">Platforms *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {platformOptions.map(platform => (
                    <label key={platform} className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, platforms: [...prev.platforms, platform] }))
                          } else {
                            setFormData(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }))
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                      <span className="text-sm">{platform}</span>
                    </label>
                  ))}
                </div>
                {errors.platforms && <p className="text-red-400 text-sm mt-1">{errors.platforms}</p>}
              </div>

              <div>
                <Label className="text-white">Genres *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {genreOptions.map(genre => (
                    <label key={genre} className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.genres.includes(genre)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, genres: [...prev.genres, genre] }))
                          } else {
                            setFormData(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }))
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                      <span className="text-sm">{genre}</span>
                    </label>
                  ))}
                </div>
                {errors.genres && <p className="text-red-400 text-sm mt-1">{errors.genres}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-white">Technologies & Tools</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTechnology}
                    className="border-gray-600 text-gray-300"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Technology
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.technologies.map((tech, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-900 rounded border border-gray-700">
                      <Input
                        placeholder="Technology name"
                        value={tech.name}
                        onChange={(e) => {
                          const newTechs = [...formData.technologies]
                          newTechs[index].name = e.target.value
                          setFormData(prev => ({ ...prev, technologies: newTechs }))
                        }}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <Select
                        value={tech.category}
                        onValueChange={(value) => {
                          const newTechs = [...formData.technologies]
                          newTechs[index].category = value
                          setFormData(prev => ({ ...prev, technologies: newTechs }))
                        }}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {technologyCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="How it was used"
                        value={tech.usage}
                        onChange={(e) => {
                          const newTechs = [...formData.technologies]
                          newTechs[index].usage = e.target.value
                          setFormData(prev => ({ ...prev, technologies: newTechs }))
                        }}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTechnology(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Links */}
              <div>
                <Label className="text-white">External Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor="website" className="text-gray-300 text-sm">Project Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.externalLinks.website || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        externalLinks: { ...prev.externalLinks, website: e.target.value }
                      }))}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="https://yourproject.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="github" className="text-gray-300 text-sm">GitHub Repository</Label>
                    <Input
                      id="github"
                      type="url"
                      value={formData.externalLinks.github || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        externalLinks: { ...prev.externalLinks, github: e.target.value }
                      }))}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="https://github.com/user/project"
                    />
                  </div>

                  <div>
                    <Label htmlFor="steam" className="text-gray-300 text-sm">Steam Page</Label>
                    <Input
                      id="steam"
                      type="url"
                      value={formData.externalLinks.steam || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        externalLinks: { ...prev.externalLinks, steam: e.target.value }
                      }))}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="https://store.steampowered.com/app/..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="itchIo" className="text-gray-300 text-sm">itch.io Page</Label>
                    <Input
                      id="itchIo"
                      type="url"
                      value={formData.externalLinks.itchIo || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        externalLinks: { ...prev.externalLinks, itchIo: e.target.value }
                      }))}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="https://user.itch.io/project"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Project Poster */}
              <div>
                <Label className="text-white">Project Poster</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRefs.poster}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('poster', e.target.files)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRefs.poster.current?.click()}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Project Poster
                  </Button>
                  {formData.poster && (
                    <p className="text-green-400 text-sm mt-2">✓ {formData.poster.name}</p>
                  )}
                </div>
              </div>

              {/* Videos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-white">Development Videos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVideo}
                    className="border-gray-600 text-gray-300"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Video
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.videos.map((video, index) => (
                    <Card key={index} className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Video title"
                            value={video.title}
                            onChange={(e) => {
                              const newVideos = [...formData.videos]
                              newVideos[index].title = e.target.value
                              setFormData(prev => ({ ...prev, videos: newVideos }))
                            }}
                            className="bg-gray-800 border-gray-600 text-white"
                          />

                          <Input
                            placeholder="YouTube/Vimeo URL"
                            value={video.url}
                            onChange={(e) => {
                              const newVideos = [...formData.videos]
                              newVideos[index].url = e.target.value
                              setFormData(prev => ({ ...prev, videos: newVideos }))
                            }}
                            className="bg-gray-800 border-gray-600 text-white"
                          />

                          <Select
                            value={video.category}
                            onValueChange={(value) => {
                              const newVideos = [...formData.videos]
                              newVideos[index].category = value
                              setFormData(prev => ({ ...prev, videos: newVideos }))
                            }}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gameplay">Gameplay</SelectItem>
                              <SelectItem value="dev_log">Dev Log</SelectItem>
                              <SelectItem value="tutorial">Tutorial</SelectItem>
                              <SelectItem value="timelapse">Timelapse</SelectItem>
                              <SelectItem value="trailer">Trailer</SelectItem>
                              <SelectItem value="behind_scenes">Behind the Scenes</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            placeholder="Duration (e.g., 5:32)"
                            value={video.duration}
                            onChange={(e) => {
                              const newVideos = [...formData.videos]
                              newVideos[index].duration = e.target.value
                              setFormData(prev => ({ ...prev, videos: newVideos }))
                            }}
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>

                        <Textarea
                          placeholder="Video description"
                          value={video.description}
                          onChange={(e) => {
                            const newVideos = [...formData.videos]
                            newVideos[index].description = e.target.value
                            setFormData(prev => ({ ...prev, videos: newVideos }))
                          }}
                          className="bg-gray-800 border-gray-600 text-white mt-4"
                          rows={2}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVideo(index)}
                          className="text-red-400 hover:text-red-300 mt-2"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove Video
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Post-Mortem */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-2">About Post-Mortems</h4>
                    <p className="text-gray-300 text-sm">
                      Share your development journey with the community. What worked well? What didn't?
                      What would you do differently? These insights help other developers learn from your experience.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-white">Post-Mortem Sections *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPostMortemSection}
                    className="border-gray-600 text-gray-300"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Section
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.postMortemSections.map((section, index) => (
                    <Card key={index} className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <Input
                            placeholder="Section title"
                            value={section.title}
                            onChange={(e) => {
                              const newSections = [...formData.postMortemSections]
                              newSections[index].title = e.target.value
                              setFormData(prev => ({ ...prev, postMortemSections: newSections }))
                            }}
                            className="bg-gray-800 border-gray-600 text-white md:col-span-2"
                          />

                          <Select
                            value={section.category}
                            onValueChange={(value) => {
                              const newSections = [...formData.postMortemSections]
                              newSections[index].category = value
                              setFormData(prev => ({ ...prev, postMortemSections: newSections }))
                            }}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="what_worked">What Worked</SelectItem>
                              <SelectItem value="what_didnt">What Didn't Work</SelectItem>
                              <SelectItem value="lessons_learned">Lessons Learned</SelectItem>
                              <SelectItem value="technical_challenges">Technical Challenges</SelectItem>
                              <SelectItem value="design_decisions">Design Decisions</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="team_dynamics">Team Dynamics</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Textarea
                          placeholder="Share your insights and experiences..."
                          value={section.content}
                          onChange={(e) => {
                            const newSections = [...formData.postMortemSections]
                            newSections[index].content = e.target.value
                            setFormData(prev => ({ ...prev, postMortemSections: newSections }))
                          }}
                          className="bg-gray-800 border-gray-600 text-white"
                          rows={6}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePostMortemSection(index)}
                          className="text-red-400 hover:text-red-300 mt-2"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove Section
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {errors.postMortem && <p className="text-red-400 text-sm mt-1">{errors.postMortem}</p>}
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags" className="text-white">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="gamedev, unity, indie, postmortem (comma-separated)"
                />
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Review Summary */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-white text-xl font-semibold mb-4">Project Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Title:</span>
                    <span className="text-white ml-2">{formData.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white ml-2">{formData.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Team Size:</span>
                    <span className="text-white ml-2">{formData.teamSize}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Platforms:</span>
                    <span className="text-white ml-2">{formData.platforms.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Post-Mortem Sections:</span>
                    <span className="text-white ml-2">{formData.postMortemSections.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Videos:</span>
                    <span className="text-white ml-2">{formData.videos.length}</span>
                  </div>
                </div>
              </div>

              {/* Legal Agreements */}
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold">Legal Agreements</h3>

                <div className="space-y-3">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                      className="mt-1 rounded border-gray-600"
                    />
                    <span className="text-gray-300 text-sm">
                      I agree to the <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a> and
                      <a href="/privacy" className="text-blue-400 hover:underline ml-1">Privacy Policy</a>
                    </span>
                  </label>
                  {errors.agreeToTerms && <p className="text-red-400 text-sm">{errors.agreeToTerms}</p>}

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.confirmOwnership}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmOwnership: e.target.checked }))}
                      className="mt-1 rounded border-gray-600"
                    />
                    <span className="text-gray-300 text-sm">
                      I confirm that I own the rights to this project and its content, or have permission to share it
                    </span>
                  </label>
                  {errors.confirmOwnership && <p className="text-red-400 text-sm">{errors.confirmOwnership}</p>}

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.allowCommercialUse}
                      onChange={(e) => setFormData(prev => ({ ...prev, allowCommercialUse: e.target.checked }))}
                      className="mt-1 rounded border-gray-600"
                    />
                    <span className="text-gray-300 text-sm">
                      I allow educational use of this content (others can learn from and reference your work)
                    </span>
                  </label>
                </div>
              </div>

              {/* Publishing Settings */}
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold">Publishing Settings</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Make project public</span>
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Allow comments</span>
                    <Switch
                      checked={formData.allowComments}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="border-gray-600 text-gray-300"
            >
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Project'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
