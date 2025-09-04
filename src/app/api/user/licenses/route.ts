import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserLicenses, canUserDownload, DownloadLicenseWithProduct } from '@/lib/file-delivery'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'
    const licenseType = searchParams.get('licenseType') || 'all'
    const orderId = searchParams.get('order')

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Get user licenses using new file delivery system
    const licenses = await getUserLicenses(session.user.id)

    // Apply filters
    let filteredLicenses = licenses

    if (status && status !== 'all') {
      filteredLicenses = licenses.filter(license => {
        if (status === 'active') return license.isActive
        if (status === 'expired') return !license.isActive || (license.expiresAt && new Date(license.expiresAt) < new Date())
        return false
      })
    }

    if (licenseType && licenseType !== 'all') {
      filteredLicenses = filteredLicenses.filter(license => license.licenseType === licenseType)
    }

    if (orderId) {
      filteredLicenses = filteredLicenses.filter(license => license.orderId === orderId)
    }

    // Apply pagination
    const totalCount = filteredLicenses.length
    const totalPages = Math.ceil(totalCount / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedLicenses = filteredLicenses.slice(startIndex, endIndex)

    // Transform licenses to match expected format
    const transformedLicenses = paginatedLicenses.map(license => ({
      _id: license._id,
      licenseKey: license._id, // Use license ID as key for now
      licenseType: license.licenseType,
      status: license.isActive ? 'active' : 'inactive',
      downloadCount: license.downloadCount,
      downloadLimit: license.downloadLimit,
      lastDownloadAt: null, // Would need to get from download history
      issuedAt: license.createdAt,
      expiresAt: license.expiresAt,
      product: license.product || {
        _id: license.productId,
        title: 'Unknown Product',
        slug: { current: 'unknown' },
        image: null,
        freebie: false
      },
      order: {
        _id: license.orderId,
        orderNumber: `ORD-${license.orderId.slice(-8)}`, // Generate from ID
        total: 0 // Would need to fetch from order
      },
      metadata: {
        purchasePrice: 0, // Would need to fetch from order
        currency: 'USD'
      }
    }))

    return NextResponse.json({
      licenses: transformedLicenses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      stats: {
        totalLicenses: totalCount,
        activeLicenses: licenses.filter(l => l.isActive).length,
        totalDownloads: licenses.reduce((sum, l) => sum + l.downloadCount, 0),
        averageDownloadsPerLicense: licenses.length > 0 ? licenses.reduce((sum, l) => sum + l.downloadCount, 0) / licenses.length : 0
      }
    })

  } catch (error) {
    console.error('Error fetching licenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}

// Get license details with download history
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { licenseId, includeDownloadHistory = false } = await request.json()

    if (!licenseId) {
      return NextResponse.json({ error: 'License ID required' }, { status: 400 })
    }

    // Get user licenses and find the specific one
    const licenses = await getUserLicenses(session.user.id)
    const license = licenses.find(l => l._id === licenseId)

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    // Get download history if requested
    let downloadHistory: any[] = []
    if (includeDownloadHistory) {
      const { getUserDownloadHistory } = await import('@/lib/file-delivery')
      const allHistory = await getUserDownloadHistory(session.user.id)
      downloadHistory = allHistory
        .filter(activity => activity.licenseId === licenseId)
        .slice(0, 20) // Last 20 downloads
    }

    // Check if user can download
    const downloadCheck = await canUserDownload(session.user.id, license.productId)

    return NextResponse.json({
      license,
      downloadHistory,
      canDownload: downloadCheck.canDownload,
      reason: downloadCheck.reason,
      downloadMethod: 'license'
    })

  } catch (error) {
    console.error('Error fetching license details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch license details' },
      { status: 500 }
    )
  }
}
