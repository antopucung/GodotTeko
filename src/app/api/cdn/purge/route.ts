import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cdnManager } from '@/lib/cdn-integration'
import { reportServerMessage } from '@/sentry.server.config'

interface PurgeRequest {
  urls?: string[]
  tags?: string[]
  files?: string[]
  purgeEverything?: boolean
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession()

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const purgeRequest: PurgeRequest = await request.json()

    // Validate request
    if (!purgeRequest.urls && !purgeRequest.tags && !purgeRequest.files && !purgeRequest.purgeEverything) {
      return NextResponse.json(
        { error: 'Must specify urls, tags, files, or purgeEverything' },
        { status: 400 }
      )
    }

    // Perform CDN cache purge
    const result = await cdnManager.purgeCache({
      urls: purgeRequest.urls,
      tags: purgeRequest.tags,
      files: purgeRequest.files,
      purgeEverything: purgeRequest.purgeEverything
    })

    // Log the purge operation
    reportServerMessage(
      'CDN cache purge initiated',
      'info',
      {
        adminUserId: session.user.id,
        adminUserName: session.user.name,
        purgeType: purgeRequest.purgeEverything ? 'everything' : 'selective',
        urlsCount: purgeRequest.urls?.length || 0,
        tagsCount: purgeRequest.tags?.length || 0,
        filesCount: purgeRequest.files?.length || 0,
        reason: purgeRequest.reason || 'No reason provided',
        success: result
      }
    )

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'CDN cache purged successfully',
        purgedAt: new Date().toISOString(),
        purgedBy: session.user.name || session.user.email
      })
    } else {
      return NextResponse.json(
        { error: 'CDN cache purge failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('CDN purge error:', error)

    reportServerMessage(
      'CDN cache purge failed',
      'error',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    )

    return NextResponse.json(
      { error: 'Failed to purge CDN cache' },
      { status: 500 }
    )
  }
}

// Get purge history (if stored)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // In a real implementation, this would fetch from a database
    // For now, return mock purge history
    const mockHistory = [
      {
        id: 'purge_1',
        type: 'selective',
        urls: ['/products', '/api/products'],
        initiatedBy: 'admin@example.com',
        reason: 'Product updates',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        status: 'completed'
      },
      {
        id: 'purge_2',
        type: 'tags',
        tags: ['product-images'],
        initiatedBy: 'admin@example.com',
        reason: 'Image optimization',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        status: 'completed'
      }
    ]

    return NextResponse.json({
      history: mockHistory,
      count: mockHistory.length
    })

  } catch (error) {
    console.error('Error fetching purge history:', error)

    return NextResponse.json(
      { error: 'Failed to fetch purge history' },
      { status: 500 }
    )
  }
}
