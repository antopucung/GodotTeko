import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.json()

    // Validate required fields
    const requiredFields = ['title', 'description', 'status', 'platforms', 'genres']
    const missingFields = requiredFields.filter(field => !formData[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missingFields
        },
        { status: 400 }
      )
    }

    // Validate agreements
    if (!formData.agreeToTerms || !formData.confirmOwnership) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must agree to the terms and confirm ownership'
        },
        { status: 400 }
      )
    }

    // Create slug from title
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check if project with similar slug exists
    const existingProject = await sanityClient.fetch(
      `*[_type == "gameProject" && slug.current == $slug][0]`,
      { slug }
    )

    let finalSlug = slug
    if (existingProject) {
      finalSlug = `${slug}-${Date.now()}`
    }

    // Create studio if it doesn't exist
    let studioRef
    const existingStudio = await sanityClient.fetch(
      `*[_type == "gameStudio" && name == $studioName][0]`,
      { studioName: formData.studioName || `${session.user.name}'s Studio` }
    )

    if (existingStudio) {
      studioRef = { _type: 'reference', _ref: existingStudio._id }
    } else {
      const newStudio = await sanityClient.create({
        _type: 'gameStudio',
        name: formData.studioName || `${session.user.name}'s Studio`,
        slug: {
          _type: 'slug',
          current: (formData.studioName || `${session.user.name}-studio`)
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
        },
        bio: `Studio created by ${session.user.name}`,
        foundedYear: new Date().getFullYear(),
        teamSize: formData.teamSize || 1,
        isActive: true,
        joinedAt: new Date().toISOString()
      })
      studioRef = { _type: 'reference', _ref: newStudio._id }
    }

    // Prepare project data for Sanity
    const projectData = {
      _type: 'gameProject',
      title: formData.title,
      slug: {
        _type: 'slug',
        current: finalSlug
      },
      description: formData.description,
      longDescription: formData.longDescription ? [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: formData.longDescription
            }
          ]
        }
      ] : undefined,
      studio: studioRef,
      status: formData.status,
      releaseDate: formData.releaseDate || undefined,
      developmentStartDate: formData.developmentStartDate || undefined,
      platforms: formData.platforms || [],
      genres: formData.genres || [],
      technologies: formData.technologies?.map((tech: any) => ({
        name: tech.name,
        category: tech.category,
        usage: tech.usage
      })) || [],
      teamSize: formData.teamSize || 1,
      developmentDuration: formData.developmentDuration || undefined,
      postMortemSections: formData.postMortemSections?.map((section: any) => ({
        title: section.title,
        content: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: section.content
              }
            ]
          }
        ],
        category: section.category
      })) || [],
      videos: formData.videos?.map((video: any) => ({
        title: video.title,
        url: video.url,
        embedId: video.embedId || extractVideoId(video.url, video.platform),
        platform: video.platform || 'youtube',
        duration: video.duration,
        category: video.category,
        description: video.description
      })) || [],
      downloadableAssets: formData.downloadableAssets?.map((asset: any) => ({
        title: asset.title,
        description: asset.description,
        license: asset.license,
        requiresAuth: asset.requiresAuth || false
        // Note: File uploads would need separate handling with Sanity's asset management
      })) || [],
      externalLinks: {
        website: formData.externalLinks?.website || undefined,
        steam: formData.externalLinks?.steam || undefined,
        itchIo: formData.externalLinks?.itchIo || undefined,
        github: formData.externalLinks?.github || undefined,
        discord: formData.externalLinks?.discord || undefined,
        twitter: formData.externalLinks?.twitter || undefined,
        youtube: formData.externalLinks?.youtube || undefined
      },
      tags: formData.tags || [],
      stats: {
        views: 0,
        likes: 0,
        downloads: 0,
        comments: 0
      },
      featured: false,
      submittedBy: {
        _type: 'reference',
        _ref: session.user.id
      },
      moderationStatus: 'pending',
      publishedAt: formData.isPublic ? new Date().toISOString() : undefined,
      _createdAt: new Date().toISOString()
    }

    // Create the project in Sanity
    const createdProject = await sanityClient.create(projectData)

    // Log the submission for analytics
    console.log('New game project submitted:', {
      projectId: createdProject._id,
      userId: session.user.id,
      title: formData.title,
      status: formData.status,
      submittedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Project submitted successfully',
      project: {
        id: createdProject._id,
        title: createdProject.title,
        slug: createdProject.slug.current,
        status: 'pending'
      }
    })

  } catch (error) {
    console.error('Error submitting project:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit project. Please try again.'
      },
      { status: 500 }
    )
  }
}

// Helper function to extract video ID from URL
function extractVideoId(url: string, platform: string): string {
  if (!url) return ''

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

// GET endpoint to fetch submission guidelines
export async function GET() {
  try {
    const guidelines = {
      requirements: [
        'Your project must be your own work or you must have permission to share it',
        'Project must be game development related',
        'Post-mortem content should provide educational value',
        'All content must comply with our community guidelines'
      ],
      supportedFormats: {
        images: ['JPEG', 'PNG', 'WebP'],
        videos: ['YouTube', 'Vimeo embeds'],
        files: ['ZIP', 'PDF', 'TXT']
      },
      reviewProcess: [
        'Submission received',
        'Content review (1-3 business days)',
        'Approval or feedback',
        'Publication to Play.Station'
      ],
      tips: [
        'Include detailed post-mortem sections with lessons learned',
        'Add development videos showing your process',
        'Use high-quality screenshots and concept art',
        'Be honest about what worked and what didn\'t',
        'Include technical details that others can learn from'
      ]
    }

    return NextResponse.json({
      success: true,
      guidelines
    })

  } catch (error) {
    console.error('Error fetching guidelines:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch submission guidelines'
      },
      { status: 500 }
    )
  }
}
