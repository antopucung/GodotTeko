import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SimplifiedLicenseManager } from '@/lib/simplified-license-manager'
import { SanityFileManager } from '@/lib/sanity-file-manager'
import { client } from '@/lib/sanity'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({
        error: 'Download ID required',
        hint: 'Provide a license ID, product ID, or access pass format'
      }, { status: 400 })
    }

    // Enhanced smart detection of download type
    const detectionResult = await detectDownloadType(id)
    const validationParams: any = { userId: session.user.id }

    // Check if this is a direct partner asset download
    if (detectionResult.type === 'partner_asset') {
      // Redirect to secure download endpoint
      const secureDownloadUrl = new URL(`/api/download/secure/${id}`, request.url)
      return NextResponse.redirect(secureDownloadUrl)
    }

    switch (detectionResult.type) {
      case 'license':
        validationParams.licenseId = id
        break
      case 'product':
        validationParams.productId = id
        break
      case 'access_pass_product':
        // Extract product ID from access pass format (ap_productId or access_pass_productId)
        const productId = extractProductIdFromAccessPassFormat(id)
        if (!productId) {
          return NextResponse.json({
            error: 'Invalid access pass format',
            hint: 'Use format: ap_[productId] or access_pass_[productId]'
          }, { status: 400 })
        }
        validationParams.productId = productId
        break
      case 'smart_hybrid':
        // Try both license and product validation
        validationParams.productId = id
        // We'll also check if it's a license ID
        break
      default:
        return NextResponse.json({
          error: 'Invalid download ID format',
          hint: 'Supported formats: license IDs, product IDs, ap_[productId], access_pass_[productId], asset_[id]',
          detectedType: detectionResult.type,
          suggestion: detectionResult.suggestion
        }, { status: 400 })
    }

    // Universal download validation using SimplifiedLicenseManager
    const validation = await SimplifiedLicenseManager.validateDownloadAccess(validationParams)

    if (!validation.canDownload) {
      return NextResponse.json({
        error: validation.reason || 'Access denied',
        suggestion: getSuggestionForUser(validation, detectionResult),
        accessMethod: validation.method,
        userId: session.user.id
      }, { status: 403 })
    }

    // Get product information for download
    const productInfo = await getProductInfo(validationParams.productId, validationParams.licenseId)

    if (!productInfo) {
      return NextResponse.json({
        error: 'Product not found',
        hint: 'The product may have been removed or the ID is invalid'
      }, { status: 404 })
    }

    // Generate download content using Sanity File Manager
    const downloadMethod = validation.method === 'none' ? 'license' : validation.method // Fallback to license for unknown methods
    const downloadContent = await SanityFileManager.generateDownloadPackage(
      productInfo._id,
      downloadMethod,
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      validation.license
    )
    const filename = await generateSmartFilename(productInfo, validation, detectionResult)

    // Record the download (only for valid methods)
    if (validation.method === 'license' || validation.method === 'access_pass') {
      await SimplifiedLicenseManager.recordDownload({
        userId: session.user.id,
        productId: productInfo._id,
        method: validation.method,
        licenseId: validation.license?._id,
        fileSize: downloadContent.length,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || ''
      })
    }

    return new NextResponse(downloadContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': downloadContent.length.toString(),
        'X-Download-Method': validation.method,
        'X-License-Type': validation.license?.licenseType || validation.accessPass?.passType || 'access_pass',
        'X-Product-Title': productInfo.title,
        'X-Download-ID': id,
        'X-Detection-Type': detectionResult.type,
        'X-Smart-API': 'v1.0'
      },
    })

  } catch (error) {
    console.error('Smart download error:', error)
    return NextResponse.json(
      {
        error: 'Download failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again or contact support if the issue persists'
      },
      { status: 500 }
    )
  }
}

// Enhanced smart download type detection with confidence scoring
async function detectDownloadType(id: string): Promise<{
  type: 'license' | 'product' | 'access_pass_product' | 'partner_asset' | 'smart_hybrid' | 'unknown'
  confidence: number
  suggestion?: string
}> {
  // High confidence detections

  // License ID formats (confidence: 95%)
  if (id.startsWith('license_') || id.startsWith('li_') || id.match(/^lic[_-]/i)) {
    return { type: 'license', confidence: 95 }
  }

  // Access pass product formats (confidence: 95%)
  if (id.startsWith('access_pass_') || id.startsWith('ap_')) {
    return { type: 'access_pass_product', confidence: 95 }
  }

  // Partner asset formats (confidence: 90%)
  if (id.startsWith('asset_') || id.startsWith('pa_') || id.match(/^partner_asset[_-]/i)) {
    return { type: 'partner_asset', confidence: 90 }
  }

  // Medium confidence detections

  // MongoDB ObjectId format (confidence: 80%)
  if (id.match(/^[a-f\d]{24}$/i)) {
    // Check if it's a valid partner asset ID first (higher priority)
    const isValidAsset = await isValidPartnerAssetId(id)
    if (isValidAsset) {
      return { type: 'partner_asset', confidence: 85 }
    }

    // Then check if it's a valid product ID in Sanity
    const isValidProduct = await isValidProductId(id)
    if (isValidProduct) {
      return { type: 'product', confidence: 80 }
    }
    return {
      type: 'unknown',
      confidence: 20,
      suggestion: 'This looks like an ObjectId but no matching product or asset was found'
    }
  }

  // UUID format (confidence: 75%)
  if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    // Check if it's a valid partner asset ID first
    const isValidAsset = await isValidPartnerAssetId(id)
    if (isValidAsset) {
      return { type: 'partner_asset', confidence: 80 }
    }

    const isValidProduct = await isValidProductId(id)
    if (isValidProduct) {
      return { type: 'product', confidence: 75 }
    }
    return {
      type: 'unknown',
      confidence: 25,
      suggestion: 'This looks like a UUID but no matching product or asset was found'
    }
  }

  // Alphanumeric strings that could be custom IDs (confidence: 60%)
  if (id.match(/^[a-zA-Z0-9_-]{8,}$/)) {
    // Check partner assets first
    const isValidAsset = await isValidPartnerAssetId(id)
    if (isValidAsset) {
      return { type: 'partner_asset', confidence: 65 }
    }

    const isValidProduct = await isValidProductId(id)
    if (isValidProduct) {
      return { type: 'smart_hybrid', confidence: 60 }
    }
    return {
      type: 'unknown',
      confidence: 30,
      suggestion: 'Try using a license ID (license_xxx), access pass format (ap_xxx), or asset ID (asset_xxx)'
    }
  }

  // Low confidence - unknown format
  return {
    type: 'unknown',
    confidence: 10,
    suggestion: 'Use format: license_[id], ap_[productId], asset_[id], or a valid product ID'
  }
}

// Extract product ID from access pass formats
function extractProductIdFromAccessPassFormat(id: string): string | null {
  if (id.startsWith('access_pass_')) {
    return id.replace('access_pass_', '')
  }
  if (id.startsWith('ap_')) {
    return id.replace('ap_', '')
  }
  return null
}

// Enhanced product ID validation with caching
const productValidationCache = new Map<string, boolean>()
const partnerAssetValidationCache = new Map<string, boolean>()

async function isValidProductId(id: string): Promise<boolean> {
  // Check cache first
  if (productValidationCache.has(id)) {
    return productValidationCache.get(id)!
  }

  try {
    const exists = await client.fetch(
      `defined(*[_type == "product" && _id == $id][0])`,
      { id }
    )

    // Cache the result for 5 minutes
    productValidationCache.set(id, !!exists)
    setTimeout(() => productValidationCache.delete(id), 5 * 60 * 1000)

    return !!exists
  } catch (error) {
    console.error('Error validating product ID:', error)
    return false
  }
}

// Enhanced partner asset ID validation with caching
async function isValidPartnerAssetId(id: string): Promise<boolean> {
  // Check cache first
  if (partnerAssetValidationCache.has(id)) {
    return partnerAssetValidationCache.get(id)!
  }

  try {
    const exists = await client.fetch(
      `defined(*[_type == "partnerAsset" && _id == $id && status in ["uploaded", "ready"]][0])`,
      { id }
    )

    // Cache the result for 5 minutes
    partnerAssetValidationCache.set(id, !!exists)
    setTimeout(() => partnerAssetValidationCache.delete(id), 5 * 60 * 1000)

    return !!exists
  } catch (error) {
    console.error('Error validating partner asset ID:', error)
    return false
  }
}

// Enhanced product information retrieval
async function getProductInfo(productId?: string, licenseId?: string): Promise<any> {
  if (productId) {
    return await client.fetch(
      `*[_type == "product" && _id == $productId][0] {
        _id,
        title,
        slug,
        price,
        salePrice,
        freebie,
        description,
        "images": images[].asset->url,
        "categories": categories[]-> { name, slug },
        "author": author-> { name, slug },
        "downloadUrl": downloadUrl,
        "fileTypes": fileTypes,
        "assets": assets[] {
          _key,
          title,
          description,
          "url": asset->url,
          "size": asset->size,
          "mimeType": asset->mimeType
        }
      }`,
      { productId }
    )
  }

  if (licenseId) {
    const license = await client.fetch(
      `*[_type == "license" && _id == $licenseId][0] {
        product-> {
          _id,
          title,
          slug,
          price,
          salePrice,
          freebie,
          description,
          "images": images[].asset->url,
          "categories": categories[]-> { name, slug },
          "author": author-> { name, slug },
          "downloadUrl": downloadUrl,
          "fileTypes": fileTypes,
          "assets": assets[] {
            _key,
            title,
            description,
            "url": asset->url,
            "size": asset->size,
            "mimeType": asset->mimeType
          }
        }
      }`,
      { licenseId }
    )
    return license?.product
  }

  return null
}

// Enhanced user suggestions based on validation results
function getSuggestionForUser(validation: any, detectionResult: any): string {
  const baseMessage = "To download this product, you can:"

  if (validation.method === 'none') {
    if (validation.reason?.includes('expired')) {
      return `${baseMessage} 1) Purchase a new license, or 2) Get an Access Pass for unlimited downloads of all products.`
    }
    if (validation.reason?.includes('limit')) {
      return `${baseMessage} 1) Upgrade your license, or 2) Get an Access Pass for unlimited downloads.`
    }
    if (validation.reason?.includes('not found')) {
      if (detectionResult.confidence < 70) {
        return `${baseMessage} 1) Check your download ID format, 2) Purchase this product, or 3) Get an Access Pass for unlimited access.`
      }
      return `${baseMessage} 1) Purchase this product individually, or 2) Get an Access Pass for unlimited downloads of all products.`
    }
  }

  return `${baseMessage} 1) Purchase this product, or 2) Get an Access Pass for unlimited downloads.`
}

// Get client IP address with enhanced detection
function getClientIP(request: NextRequest): string {
  // Try various headers for IP detection
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
  const xClientIP = request.headers.get('x-client-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  if (realIP) {
    return realIP
  }

  if (xClientIP) {
    return xClientIP
  }

  return 'unknown'
}

// Enhanced filename generation with smart naming and real file detection
async function generateSmartFilename(product: any, validation: any, detectionResult: any): Promise<string> {
  const productName = product.title.replace(/[^a-zA-Z0-9]/g, '_')
  const timestamp = new Date().toISOString().split('T')[0]
  const method = validation.method

  // Check if product has real files
  const hasRealFiles = await SanityFileManager.hasRealFiles(product._id)
  const fileStats = hasRealFiles ? await SanityFileManager.getProductFileStats(product._id) : null

  let suffix = ''
  if (method === 'access_pass') {
    const passType = validation.accessPass?.passType || 'unlimited'
    suffix = `AccessPass_${passType}`
  } else if (method === 'license') {
    const licenseType = validation.license?.licenseType || 'basic'
    suffix = `License_${licenseType}`
  }

  // Add file info if real files exist
  const fileInfo = hasRealFiles && fileStats
    ? `_${fileStats.fileCount}files_${(fileStats.totalSize / 1024 / 1024).toFixed(0)}MB`
    : '_package'

  // Add detection info for debugging (only in development)
  const debugSuffix = process.env.NODE_ENV === 'development'
    ? `_${detectionResult.type}_${detectionResult.confidence}`
    : ''

  return `${productName}_${suffix}_${timestamp}${fileInfo}${debugSuffix}.zip`
}


// Note: File generation is now handled by SanityFileManager.generateDownloadPackage()
// This provides real file downloads when available, with fallback to enhanced mock content
