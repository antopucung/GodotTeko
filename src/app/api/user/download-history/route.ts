import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserDownloadHistory } from '@/lib/file-delivery'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const success = searchParams.get('success') // filter by success status

    // Get download history
    const downloadHistory = await getUserDownloadHistory(session.user.id)

    // Apply filters
    let filteredHistory = downloadHistory
    if (success !== null) {
      const successBool = success === 'true'
      filteredHistory = downloadHistory.filter(activity => activity.success === successBool)
    }

    // Apply pagination
    const totalCount = filteredHistory.length
    const totalPages = Math.ceil(totalCount / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex)

    return NextResponse.json({
      downloadHistory: paginatedHistory,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching download history:', error)

    return NextResponse.json(
      { error: 'Failed to fetch download history' },
      { status: 500 }
    )
  }
}
