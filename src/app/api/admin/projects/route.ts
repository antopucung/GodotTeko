import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/database'
import { Project } from '@/lib/models/Project'

// Mock project data - fallback when database is unavailable
const mockProjects = [
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
    approved: true,
    submittedBy: 'user1',
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
    approved: true,
    submittedBy: 'user2',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    _id: '3',
    title: 'Indie Puzzle Game',
    slug: { current: 'indie-puzzle-game' },
    description: 'A small indie puzzle game submission waiting for approval. Created by a solo developer as their first game project.',
    year: 2024,
    status: 'in_development',
    poster: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=1200&fit=crop',
    studio: {
      name: 'Solo Dev Studio',
      slug: { current: 'solo-dev-studio' },
      id: 'user3'
    },
    platforms: ['PC', 'Mobile'],
    genre: ['Puzzle', 'Indie'],
    tech: ['Godot 3.5', 'GDScript'],
    stats: {
      views: 0,
      likes: 0,
      downloads: 0
    },
    duration: '6 months',
    team: {
      size: 1,
      roles: ['Developer']
    },
    featured: false,
    approved: false, // Pending approval
    submittedBy: 'user3',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const userRole = session.user.role || 'user'
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Try to connect to database and fetch all projects (including unapproved)
    let allProjects = []
    const db = await connectToDatabase()

    if (db) {
      try {
        // Fetch all projects from database (no approval filter for admin)
        allProjects = await Project.find({}).sort({ createdAt: -1 }).lean()
        console.log(`✅ Admin fetched ${allProjects.length} projects from database`)
      } catch (dbError) {
        console.error('⚠️ Database query failed, falling back to mock data:', dbError)
        allProjects = [...mockProjects]
      }
    } else {
      console.log('⚠️ Database unavailable, using mock data')
      allProjects = [...mockProjects]
    }

    // Calculate admin stats
    const stats = {
      totalProjects: allProjects.length,
      pendingProjects: allProjects.filter(p => !p.approved).length,
      approvedProjects: allProjects.filter(p => p.approved).length,
      featuredProjects: allProjects.filter(p => p.featured).length
    }

    return NextResponse.json({
      success: true,
      projects: allProjects,
      stats
    })
  } catch (error) {
    console.error('Error fetching projects for admin:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
