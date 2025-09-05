import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

// Supported image formats
const ALLOWED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file format. Allowed formats: JPEG, PNG, GIF, WebP, SVG',
          allowedFormats: ALLOWED_FORMATS
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          maxSize: MAX_FILE_SIZE
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `logo-${timestamp}-${originalName}`

    console.log(`📤 Uploading image: ${filename} (${file.size} bytes, ${file.type})`)

    // Upload to Sanity
    const asset = await sanityClient.assets.upload('image', buffer, {
      filename,
      contentType: file.type
    })

    console.log(`✅ Image uploaded successfully: ${asset._id}`)

    // Return asset information
    return NextResponse.json({
      success: true,
      asset: {
        _id: asset._id,
        url: asset.url,
        originalFilename: asset.originalFilename,
        size: asset.size,
        mimeType: asset.mimeType,
        metadata: {
          dimensions: asset.metadata?.dimensions,
          hasAlpha: asset.metadata?.hasAlpha,
          isOpaque: asset.metadata?.isOpaque,
          lqip: asset.metadata?.lqip,
          palette: asset.metadata?.palette
        }
      },
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Error uploading image:', error)

    // Handle specific Sanity errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid image')) {
        return NextResponse.json(
          { error: 'Invalid image format or corrupted file' },
          { status: 400 }
        )
      }

      if (error.message.includes('Too large')) {
        return NextResponse.json(
          { error: 'File size exceeds limit' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET - List uploaded images (for admin use)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const purpose = searchParams.get('purpose') // e.g., 'logo'

    // Query assets
    let query = `*[_type == "sanity.imageAsset"${purpose ? ` && metadata.purpose == "${purpose}"` : ''}] | order(_createdAt desc)`

    const assets = await sanityClient.fetch(`
      ${query}[${offset}...${offset + limit}] {
        _id,
        _createdAt,
        url,
        originalFilename,
        size,
        mimeType,
        metadata {
          dimensions,
          hasAlpha,
          isOpaque,
          lqip,
          purpose,
          uploadedBy,
          uploadedAt
        }
      }
    `)

    // Get total count
    const total = await sanityClient.fetch(`count(${query})`)

    return NextResponse.json({
      success: true,
      assets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an uploaded image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('id')

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      )
    }

    // Check if asset is being used in any configurations
    const usageCount = await sanityClient.fetch(
      `count(*[_type == "siteConfiguration" && logo.logoImage.asset._ref == $assetId])`,
      { assetId }
    )

    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete asset that is currently in use',
          usageCount
        },
        { status: 400 }
      )
    }

    // Delete asset
    await sanityClient.delete(assetId)

    console.log(`🗑️ Asset deleted: ${assetId}`)

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
