'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import Footer from '@/components/Footer'
import ProjectCard, { GameProject } from '@/components/cards/ProjectCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PlayCircle,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Award,
  Users,
  Code,
  Gamepad2,
  Sparkles
} from 'lucide-react'

// Real projects are now fetched from the API

const stats = {
  totalProjects: 24,
  activeStudios: 18,
  hoursOfContent: 340,
  communityMembers: 15600
}

export default function PlayStationPage() {
  const [projects, setProjects] = useState<GameProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<GameProject[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/projects')
      const data = await response.json()

      if (data.success) {
        setProjects(data.projects)
        setFilteredProjects(data.projects)
      } else {
        console.error('Failed to fetch projects:', data.error)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    let filtered = projects

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(project => project.status === activeFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tech.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.genre.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredProjects(filtered)
  }, [projects, activeFilter, searchQuery])

  const featuredProjects = filteredProjects.filter(p => p.featured)
  const regularProjects = filteredProjects.filter(p => !p.featured)

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 bg-[radial-gradient(circle_at_center,rgba(156,146,172,0.05)_2px,transparent_2px)] bg-[length:60px_60px]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-orange-600 text-white border-orange-500 mb-6 px-4 py-2">
              <PlayCircle className="w-4 h-4 mr-2" />
              Game Development Post-Mortems
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Play.Station
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
              Learn from real game development projects. Explore behind-the-scenes content,
              post-mortems, and production insights from indie studios and professional teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-4">
                <PlayCircle className="w-5 h-5 mr-2" />
                Explore Projects
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-4"
                onClick={() => window.location.href = '/play-station/submit'}
              >
                <Code className="w-5 h-5 mr-2" />
                Submit Your Project
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-orange-400">{stats.totalProjects}</div>
                <div className="text-gray-400 text-sm">Game Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-400">{stats.activeStudios}</div>
                <div className="text-gray-400 text-sm">Active Studios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-400">{stats.hoursOfContent}h</div>
                <div className="text-gray-400 text-sm">Learning Content</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-400">{stats.communityMembers.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Community</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-4">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Game Development Showcases
              </h2>
              <p className="text-gray-400 max-w-2xl">
                Discover detailed post-mortems, production insights, and behind-the-scenes content from real game development projects
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-8">
            <TabsList className="bg-gray-800 border border-gray-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-orange-600">All Projects</TabsTrigger>
              <TabsTrigger value="released" className="data-[state=active]:bg-green-600">Released</TabsTrigger>
              <TabsTrigger value="in_development" className="data-[state=active]:bg-blue-600">In Development</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading projects...</p>
            </div>
          ) : (
            <>
              {/* Featured Projects */}
              {featuredProjects.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center gap-2 mb-8">
                    <Award className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-2xl font-bold text-white">Featured Projects</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {featuredProjects.map((project, index) => (
                      <ProjectCard
                        key={project._id}
                        project={project}
                        variant="featured"
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Projects Grid */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-8">
                  <Gamepad2 className="w-6 h-6 text-orange-500" />
                  <h3 className="text-2xl font-bold text-white">All Projects</h3>
                  <Badge className="bg-gray-800 text-gray-300">
                    {filteredProjects.length} projects
                  </Badge>
                </div>

                {filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProjects.map((project, index) => (
                      <ProjectCard
                        key={project._id}
                        project={project}
                        variant="grid"
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Gamepad2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No projects found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Share Your Game Development Journey
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Help other developers learn by sharing your project's post-mortem, development insights, and behind-the-scenes content
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-4"
              onClick={() => window.location.href = '/play-station/submit'}
            >
              Submit Your Project
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-orange-200" />
              <div className="text-sm">Community Driven</div>
            </div>
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-orange-200" />
              <div className="text-sm">Quality Content</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-200" />
              <div className="text-sm">Learn & Grow</div>
            </div>
            <div className="text-center">
              <Code className="w-8 h-8 mx-auto mb-2 text-orange-200" />
              <div className="text-sm">Open Source</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
