import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  canUserDownload,
  generateSecureDownloadUrl,
  getProductFiles
} from '@/lib/file-delivery'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { productId } = params
    const userId = session.user.id

    // Check if user can download this product
    const downloadCheck = await canUserDownload(userId, productId)

    if (!downloadCheck.canDownload) {
      let errorMessage = 'Download not allowed'
      let statusCode = 403

      switch (downloadCheck.reason) {
        case 'no_license':
          errorMessage = 'You do not have a valid license for this product. Please purchase it first.'
          statusCode = 402 // Payment required
          break
        case 'license_inactive':
          errorMessage = 'Your license for this product is inactive. Please contact support.'
          break
        case 'download_limit_exceeded':
          errorMessage = 'You have exceeded the download limit for this product.'
          break
        case 'free_product':
          // This should allow download, so we shouldn't reach here
          break
      }

      return NextResponse.json(
        {
          error: errorMessage,
          reason: downloadCheck.reason,
          canDownload: false
        },
        { status: statusCode }
      )
    }

    // Get product files info
    const productFiles = await getProductFiles(productId)

    if (!productFiles.files || productFiles.files.length === 0) {
      return NextResponse.json(
        { error: 'No files available for download' },
        { status: 404 }
      )
    }

    // Generate secure download URL
    const licenseId = downloadCheck.license?._id || 'free-product'
    const secureUrl = await generateSecureDownloadUrl(userId, productId, licenseId)

    return NextResponse.json({
      canDownload: true,
      downloadUrl: secureUrl.url,
      expiresIn: secureUrl.expiresIn,
      files: productFiles.files,
      license: downloadCheck.license ? {
        id: downloadCheck.license._id,
        type: downloadCheck.license.licenseType,
        downloadCount: downloadCheck.license.downloadCount,
        downloadLimit: downloadCheck.license.downloadLimit,
        remainingDownloads: downloadCheck.license.downloadLimit - downloadCheck.license.downloadCount
      } : null,
      message: downloadCheck.reason === 'free_product'
        ? 'This is a free product - enjoy your download!'
        : 'Download URL generated successfully'
    })

  } catch (error) {
    console.error('Error generating download URL:', error)

    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}

// Handle POST for manual license creation (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can manually create licenses
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { productId } = params
    const body = await request.json()
    const { userId, licenseType = 'standard', orderId = 'manual-admin' } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const { createLicense } = await import('@/lib/file-delivery')

    // Create license
    const license = await createLicense(userId, productId, orderId, licenseType)

    return NextResponse.json({
      message: 'License created successfully',
      license
    })

  } catch (error) {
    console.error('Error creating license:', error)

    return NextResponse.json(
      { error: 'Failed to create license' },
      { status: 500 }
    )
  }
}
