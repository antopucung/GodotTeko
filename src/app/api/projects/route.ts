import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/database'
import { Project } from '@/lib/models/Project'

// Project data structure for the Play Station showcase
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
  featured?: boolean
  assets?: ProjectAsset[]
  postMortem?: string
  createdAt: Date
  updatedAt: Date
}

interface ProjectAsset {
  id: string
  name: string
  type: 'image' | 'video' | 'document' | 'code'
  url: string
  description?: string
}

// Mock project database - in production, replace with real database
const mockProjects: GameProject[] = [
  {
    _id: '1',
    title: 'Cyber Runners',
    slug: { current: 'cyber-runners' },
    description: 'A cyberpunk racing game built with Godot 4. Complete post-mortem covering art pipeline, performance optimization, and multiplayer implementation.',
    year: 2024,
    status: 'released',
    poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=1200&fit=crop',
    studio: {
      name: 'Neon Games',
      slug: { current: 'neon-games' },
      id: 'neon-games-studio'
    },
    platforms: ['PC', 'Steam', 'Console'],
    genre: ['Racing', 'Cyberpunk'],
    tech: ['Godot 4', 'C#', 'Blender', 'Substance'],
    stats: {
      views: 15600,
      likes: 342,
      downloads: 1250
    },
    duration: '18 months',
    team: {
      size: 8,
      roles: ['Dev', 'Art', 'Audio', 'QA']
    },
    featured: true,
    assets: [
      {
        id: 'asset-1',
        name: 'Gameplay Trailer',
        type: 'video',
        url: 'https://example.com/trailer.mp4',
        description: 'Official gameplay trailer showcasing racing mechanics'
      },
      {
        id: 'asset-2',
        name: 'Art Pipeline Documentation',
        type: 'document',
        url: 'https://example.com/art-pipeline.pdf',
        description: 'Complete breakdown of our 3D art workflow'
      }
    ],
    postMortem: 'Building Cyber Runners taught us valuable lessons about multiplayer optimization and art pipeline efficiency...',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    _id: '2',
    title: 'Medieval Legends',
    slug: { current: 'medieval-legends' },
    description: 'Open-world RPG development insights. From concept to release, including world generation, quest systems, and narrative design.',
    year: 2024,
    status: 'released',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=1200&fit=crop',
    studio: {
      name: 'Forge Studios',
      slug: { current: 'forge-studios' },
      id: 'forge-studios-team'
    },
    platforms: ['PC', 'PlayStation', 'Xbox'],
    genre: ['RPG', 'Open World'],
    tech: ['Unity', 'C#', 'Maya', 'Houdini'],
    stats: {
      views: 28900,
      likes: 567,
      downloads: 2100
    },
    duration: '3 years',
    team: {
      size: 15,
      roles: ['Programming', 'Art', 'Design', 'QA']
    },
    featured: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    _id: '3',
    title: 'Quantum Puzzle',
    slug: { current: 'quantum-puzzle' },
    description: 'Innovative puzzle mechanics using quantum physics concepts. Learn about procedural level generation and mind-bending game design.',
    year: 2023,
    status: 'released',
    poster: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=1200&fit=crop',
    studio: {
      name: 'Mind Bender Games',
      slug: { current: 'mind-bender-games' }
    },
    platforms: ['PC', 'Mobile'],
    genre: ['Puzzle', 'Sci-Fi'],
    tech: ['Godot 3.5', 'GDScript', 'Aseprite'],
    stats: {
      views: 12400,
      likes: 289,
      downloads: 890
    },
    duration: '14 months',
    team: {
      size: 4,
      roles: ['Dev', 'Art', 'Sound']
    },
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19')
  },
  {
    _id: '4',
    title: 'Space Colony Alpha',
    slug: { current: 'space-colony-alpha' },
    description: 'Base building and resource management in space. Complete breakdown of systems design, UI/UX, and performance optimization.',
    year: 2023,
    status: 'released',
    poster: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=1200&fit=crop',
    studio: {
      name: 'Cosmic Interactive',
      slug: { current: 'cosmic-interactive' }
    },
    platforms: ['PC', 'Mac'],
    genre: ['Strategy', 'Simulation'],
    tech: ['Unity', 'C#', 'Blender'],
    stats: {
      views: 19200,
      likes: 423,
      downloads: 1560
    },
    duration: '2 years',
    team: {
      size: 10,
      roles: ['Programming', 'Art', 'Design']
    },
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-21')
  },
  {
    _id: '5',
    title: 'Neon Ninja',
    slug: { current: 'neon-ninja' },
    description: 'Fast-paced platformer with unique art style. Deep dive into animation systems, level design, and shader work.',
    year: 2024,
    status: 'in_development',
    poster: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=1200&fit=crop',
    studio: {
      name: 'Shadow Craft',
      slug: { current: 'shadow-craft' }
    },
    platforms: ['PC', 'Nintendo Switch'],
    genre: ['Platformer', 'Action'],
    tech: ['Godot 4', 'GDScript', 'Aseprite', 'Krita'],
    stats: {
      views: 8700,
      likes: 195,
      downloads: 0
    },
    duration: '16 months',
    team: {
      size: 6,
      roles: ['Dev', 'Art', 'Audio']
    },
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-23')
  },
  {
    _id: '6',
    title: 'Crystal Caverns',
    slug: { current: 'crystal-caverns' },
    description: 'Exploration-focused adventure game. Learn about cave generation algorithms, lighting systems, and atmospheric design.',
    year: 2023,
    status: 'released',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=1200&fit=crop',
    studio: {
      name: 'Underground Labs',
      slug: { current: 'underground-labs' }
    },
    platforms: ['PC', 'Steam'],
    genre: ['Adventure', 'Exploration'],
    tech: ['Unreal Engine', 'C++', 'Blender'],
    stats: {
      views: 14300,
      likes: 312,
      downloads: 980
    },
    duration: '20 months',
    team: {
      size: 7,
      roles: ['Programming', 'Art', 'Design']
    },
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-22')
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const status = searchParams.get('status')
    const genre = searchParams.get('genre')
    const tech = searchParams.get('tech')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'
    const sortBy = searchParams.get('sortBy') || 'newest' // newest, popular, views

    // Try to connect to database and fetch projects
    let allProjects = []
    const db = await connectToDatabase()

    if (db) {
      try {
        // Fetch approved projects from database
        allProjects = await Project.find({ approved: true }).lean()
        console.log(`✅ Fetched ${allProjects.length} projects from database`)
      } catch (dbError) {
        console.error('⚠️ Database query failed, falling back to mock data:', dbError)
        allProjects = [...mockProjects]
      }
    } else {
      console.log('⚠️ Database unavailable, using mock data')
      allProjects = [...mockProjects]
    }

    let filteredProjects = [...allProjects]

    // Apply filters
    if (status && status !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.status === status)
    }

    if (genre) {
      filteredProjects = filteredProjects.filter(project =>
        project.genre.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      )
    }

    if (tech) {
      filteredProjects = filteredProjects.filter(project =>
        project.tech.some(t => t.toLowerCase().includes(tech.toLowerCase()))
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredProjects = filteredProjects.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.studio.name.toLowerCase().includes(searchLower) ||
        project.genre.some(g => g.toLowerCase().includes(searchLower)) ||
        project.tech.some(t => t.toLowerCase().includes(searchLower))
      )
    }

    if (featured) {
      filteredProjects = filteredProjects.filter(project => project.featured)
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filteredProjects.sort((a, b) => b.stats.likes - a.stats.likes)
        break
      case 'views':
        filteredProjects.sort((a, b) => b.stats.views - a.stats.views)
        break
      case 'newest':
      default:
        filteredProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    // Calculate pagination
    const totalProjects = filteredProjects.length
    const totalPages = Math.ceil(totalProjects / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

    // Calculate stats for response
    const stats = {
      totalProjects: allProjects.length,
      activeProjects: filteredProjects.length,
      totalStudios: [...new Set(allProjects.map(p => p.studio.id || p.studio.name))].length,
      totalViews: allProjects.reduce((sum, project) => sum + project.stats.views, 0)
    }

    return NextResponse.json({
      success: true,
      projects: paginatedProjects,
      pagination: {
        currentPage: page,
        totalPages,
        totalProjects,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats,
      filters: {
        genres: [...new Set(allProjects.flatMap(p => p.genre))],
        technologies: [...new Set(allProjects.flatMap(p => p.tech))],
        statuses: ['released', 'in_development', 'prototype']
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      poster,
      platforms,
      genre,
      tech,
      duration,
      teamSize,
      teamRoles,
      status,
      studioName,
      postMortem,
      assets
    } = body

    // Validate required fields
    if (!title || !description || !platforms || !genre || !tech) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Create new project data
    const projectData = {
      title,
      slug: { current: slug },
      description,
      year: new Date().getFullYear(),
      status: status || 'in_development',
      poster: poster || 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&h=1200&fit=crop',
      studio: {
        name: studioName || `${session.user.name}'s Studio`,
        slug: { current: slug + '-studio' },
        id: session.user.id
      },
      platforms: platforms || ['PC'],
      genre: genre || ['Indie'],
      tech: tech || ['Unity'],
      stats: {
        views: 0,
        likes: 0,
        downloads: 0
      },
      duration: duration || '6 months',
      team: {
        size: teamSize || 1,
        roles: teamRoles || ['Developer']
      },
      featured: false,
      assets: assets || [],
      postMortem: postMortem || '',
      approved: false, // Projects need approval
      submittedBy: session.user.id
    }

    let newProject
    const db = await connectToDatabase()

    if (db) {
      try {
        // Save to database
        newProject = new Project(projectData)
        await newProject.save()
        console.log('✅ Project saved to database')
      } catch (dbError) {
        console.error('⚠️ Failed to save to database:', dbError)
        // Fallback: add to mock data
        const mockProject = {
          _id: Date.now().toString(),
          ...projectData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        mockProjects.push(mockProject)
        newProject = mockProject
      }
    } else {
      // Fallback: add to mock data
      const mockProject = {
        _id: Date.now().toString(),
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockProjects.push(mockProject)
      newProject = mockProject
    }

    return NextResponse.json({
      success: true,
      project: newProject,
      message: 'Project submitted successfully. It will be reviewed before being published.'
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
