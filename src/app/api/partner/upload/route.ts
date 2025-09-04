import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024

// Allowed file types for design assets
const ALLOWED_FILE_TYPES = {
  design: [
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    'application/pdf'
  ],
  source: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'application/json'
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ],
  document: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}

// Flatten all allowed types
const ALL_ALLOWED_TYPES = Object.values(ALLOWED_FILE_TYPES).flat()

// POST - Upload file to Sanity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check partner access
    const partnerCheck = await fetch(`${request.nextUrl.origin}/api/partner/access-check`, {
      headers: { cookie: request.headers.get('cookie') || '' }
    })

    if (!partnerCheck.ok) {
      return NextResponse.json({ error: 'Partner access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'design'
    const title = formData.get('title') as string || file.name
    const description = formData.get('description') as string || ''
    const productId = formData.get('productId') as string || null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 })
    }

    // Validate file type
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `File type ${file.type} not allowed. Supported types: ${ALL_ALLOWED_TYPES.join(', ')}`
      }, { status: 400 })
    }

    // Determine file category based on type
    let detectedCategory = 'design'
    for (const [cat, types] of Object.entries(ALLOWED_FILE_TYPES)) {
      if (types.includes(file.type)) {
        detectedCategory = cat
        break
      }
    }

    try {
      // Upload file to Sanity
      const asset = await client.assets.upload('file', file, {
        filename: file.name,
        contentType: file.type,
        // Add metadata
        extract: ['blurhash', 'palette', 'lqip'],
        // Custom metadata
        source: {
          name: 'partner-upload',
          id: session.user.id,
          url: request.nextUrl.origin
        }
      })

      // Create asset document with metadata
      const assetDocument = await client.create({
        _type: 'partnerAsset',
        title,
        description,
        category: category || detectedCategory,
        fileType: file.type,
        originalFilename: file.name,
        fileSize: file.size,
        uploadedBy: {
          _type: 'reference',
          _ref: session.user.id
        },
        asset: {
          _type: 'reference',
          _ref: asset._id
        },
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
        // If productId provided, associate with product
        ...(productId && {
          product: {
            _type: 'reference',
            _ref: productId
          }
        })
      })

      // If productId provided, add this asset to the product
      if (productId) {
        await client
          .patch(productId)
          .setIfMissing({ assets: [] })
          .append('assets', [{
            _key: assetDocument._id,
            title,
            description,
            category: category || detectedCategory,
            fileType: file.type,
            downloadOrder: 0,
            asset: {
              _type: 'reference',
              _ref: asset._id
            }
          }])
          .commit()
      }

      // Generate response with asset info
      const response = {
        success: true,
        asset: {
          id: assetDocument._id,
          sanityAssetId: asset._id,
          title,
          description,
          category: category || detectedCategory,
          fileType: file.type,
          originalFilename: file.name,
          fileSize: file.size,
          url: asset.url,
          uploadedAt: assetDocument.uploadedAt,
          productId
        }
      }

      return NextResponse.json(response)

    } catch (uploadError) {
      console.error('Sanity upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to Sanity' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

// GET - List uploaded files for partner
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category') || 'all'
    const productId = searchParams.get('productId')

    const offset = (page - 1) * limit

    // Build query filters
    const filters = [`uploadedBy._ref == "${session.user.id}"`]

    if (category !== 'all') {
      filters.push(`category == "${category}"`)
    }

    if (productId) {
      filters.push(`product._ref == "${productId}"`)
    }

    const filterString = filters.join(' && ')

    const [assets, totalCount] = await Promise.all([
      client.fetch(
        `*[_type == "partnerAsset" && ${filterString}] | order(uploadedAt desc) [$offset...$end] {
          _id,
          title,
          description,
          category,
          fileType,
          originalFilename,
          fileSize,
          uploadedAt,
          status,
          "url": asset->url,
          "assetId": asset->_id,
          product-> {
            _id,
            title,
            slug
          }
        }`,
        { offset, end: offset + limit }
      ),
      client.fetch(`count(*[_type == "partnerAsset" && ${filterString}])`)
    ])

    // Get file statistics
    const stats = await client.fetch(
      `{
        "totalFiles": count(*[_type == "partnerAsset" && uploadedBy._ref == $userId]),
        "totalSize": sum(*[_type == "partnerAsset" && uploadedBy._ref == $userId].fileSize),
        "byCategory": {
          "design": count(*[_type == "partnerAsset" && uploadedBy._ref == $userId && category == "design"]),
          "source": count(*[_type == "partnerAsset" && uploadedBy._ref == $userId && category == "source"]),
          "video": count(*[_type == "partnerAsset" && uploadedBy._ref == $userId && category == "video"]),
          "document": count(*[_type == "partnerAsset" && uploadedBy._ref == $userId && category == "document"])
        }
      }`,
      { userId: session.user.id }
    )

    return NextResponse.json({
      assets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
        limit
      },
      stats,
      filters: {
        category,
        productId
      }
    })

  } catch (error) {
    console.error('Error fetching partner assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

// DELETE - Delete uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assetId } = await request.json()

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })
    }

    // Verify ownership
    const asset = await client.fetch(
      `*[_type == "partnerAsset" && _id == $assetId && uploadedBy._ref == $userId][0] {
        _id,
        "assetRef": asset->_id,
        product-> { _id }
      }`,
      { assetId, userId: session.user.id }
    )

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 })
    }

    // Remove from product if associated
    if (asset.product) {
      await client
        .patch(asset.product._id)
        .unset([`assets[_key == "${assetId}"]`])
        .commit()
    }

    // Delete asset document
    await client.delete(assetId)

    // Delete actual file from Sanity (optional - files will be garbage collected)
    if (asset.assetRef) {
      try {
        await client.delete(asset.assetRef)
      } catch (deleteError) {
        console.log('Note: Sanity asset deletion failed (may be referenced elsewhere):', deleteError)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
