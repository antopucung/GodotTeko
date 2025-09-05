import { client } from './sanity'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

export interface DownloadLicense {
  _id: string
  userId: string
  productId: string
  orderId: string
  licenseType: 'standard' | 'extended'
  downloadLimit: number
  downloadCount: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface DownloadLicenseWithProduct extends DownloadLicense {
  product?: {
    _id: string
    title: string
    slug: { current: string }
    image?: string
  }
}

export interface DownloadActivity {
  _id: string
  userId: string
  productId: string
  licenseId: string
  downloadUrl: string
  ipAddress: string
  userAgent: string
  downloadedAt: string
  success: boolean
  errorMessage?: string
}

export interface SecureDownloadUrl {
  url: string
  expiresIn: number
  token: string
}

// Generate secure download token
export function generateDownloadToken(userId: string, productId: string, licenseId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret'
  const timestamp = Date.now()
  const data = `${userId}:${productId}:${licenseId}:${timestamp}`

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(data)
  const signature = hmac.digest('hex')

  return Buffer.from(`${data}:${signature}`).toString('base64url')
}

// Verify download token
export function verifyDownloadToken(token: string): {
  valid: boolean
  userId?: string
  productId?: string
  licenseId?: string
  expired?: boolean
} {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')

    if (parts.length !== 4) {
      return { valid: false }
    }

    const [userId, productId, licenseId, timestamp, signature] = parts
    const secret = process.env.NEXTAUTH_SECRET || 'default-secret'
    const data = `${userId}:${productId}:${licenseId}:${timestamp}`

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(data)
    const expectedSignature = hmac.digest('hex')

    if (signature !== expectedSignature) {
      return { valid: false }
    }

    // Check expiration (24 hours)
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    const expired = now - tokenTime > 24 * 60 * 60 * 1000

    return {
      valid: !expired,
      userId,
      productId,
      licenseId,
      expired
    }
  } catch (error) {
    return { valid: false }
  }
}

// Create license after successful purchase
export async function createLicense(
  userId: string,
  productId: string,
  orderId: string,
  licenseType: 'standard' | 'extended' = 'standard'
): Promise<DownloadLicense> {
  const license = {
    _type: 'license',
    userId,
    productId,
    orderId,
    licenseType,
    downloadLimit: licenseType === 'extended' ? 50 : 10, // Extended allows more downloads
    downloadCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const result = await client.create(license)
  return result as DownloadLicense
}

// Get user's licenses
export async function getUserLicenses(userId: string): Promise<DownloadLicenseWithProduct[]> {
  const licenses = await client.fetch(
    `*[_type == "license" && userId == $userId] | order(_createdAt desc) {
      _id,
      userId,
      productId,
      orderId,
      licenseType,
      downloadLimit,
      downloadCount,
      isActive,
      expiresAt,
      createdAt,
      updatedAt,
      "product": *[_type == "product" && _id == ^.productId][0] {
        _id,
        title,
        slug,
        "image": images[0].asset->url
      }
    }`,
    { userId }
  )

  return licenses || []
}

// Check if user can download product
export async function canUserDownload(userId: string, productId: string): Promise<{
  canDownload: boolean
  license?: DownloadLicense
  reason?: string
}> {
  // Check if product is free
  const product = await client.fetch(
    `*[_type == "product" && _id == $productId][0] { freebie }`,
    { productId }
  )

  if (product?.freebie) {
    return { canDownload: true, reason: 'free_product' }
  }

  // Check for valid license
  const license = await client.fetch(
    `*[_type == "license" && userId == $userId && productId == $productId && isActive == true][0] {
      _id,
      userId,
      productId,
      orderId,
      licenseType,
      downloadLimit,
      downloadCount,
      isActive,
      expiresAt,
      createdAt,
      updatedAt
    }`,
    { userId, productId }
  )

  if (!license) {
    return { canDownload: false, reason: 'no_license' }
  }

  if (!license.isActive) {
    return { canDownload: false, reason: 'license_inactive' }
  }

  if (license.downloadCount >= license.downloadLimit) {
    return { canDownload: false, reason: 'download_limit_exceeded' }
  }

  return { canDownload: true, license }
}

// Generate secure download URL
export async function generateSecureDownloadUrl(
  userId: string,
  productId: string,
  licenseId: string
): Promise<SecureDownloadUrl> {
  const token = generateDownloadToken(userId, productId, licenseId)
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const url = `${baseUrl}/api/download/secure/${token}`

  return {
    url,
    token,
    expiresIn: 24 * 60 * 60 * 1000 // 24 hours
  }
}

// Log download activity
export async function logDownloadActivity(
  userId: string,
  productId: string,
  licenseId: string,
  request: NextRequest,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const activity = {
    _type: 'downloadActivity',
    userId,
    productId,
    licenseId,
    downloadUrl: request.url,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    downloadedAt: new Date().toISOString(),
    success,
    errorMessage
  }

  try {
    await client.create(activity)

    // Update license download count if successful
    if (success && licenseId) {
      await client
        .patch(licenseId)
        .inc({ downloadCount: 1 })
        .set({ updatedAt: new Date().toISOString() })
        .commit()
    }
  } catch (error) {
    console.error('Error logging download activity:', error)
  }
}

// Get user's download history
export async function getUserDownloadHistory(userId: string): Promise<DownloadActivity[]> {
  const activities = await client.fetch(
    `*[_type == "downloadActivity" && userId == $userId] | order(downloadedAt desc) {
      _id,
      userId,
      productId,
      licenseId,
      downloadedAt,
      success,
      errorMessage,
      "product": *[_type == "product" && _id == ^.productId][0] {
        _id,
        title,
        slug,
        "image": images[0].asset->url
      }
    }`,
    { userId }
  )

  return activities || []
}

// Get product download files (would be stored in Sanity or external storage)
export async function getProductFiles(productId: string): Promise<{
  files: Array<{
    name: string
    type: string
    size: number
    url: string
  }>
}> {
  // In a real implementation, this would fetch actual file URLs from Sanity or cloud storage
  // For now, we'll use placeholder files based on product type

  const product = await client.fetch(
    `*[_type == "product" && _id == $productId][0] {
      title,
      categories[0]->slug
    }`,
    { productId }
  )

  if (!product) {
    return { files: [] }
  }

  // Generate placeholder download files based on product category
  const categorySlug = product.categories?.[0]?.slug || 'general'
  const baseFileName = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const files = [
    {
      name: `${baseFileName}-main.zip`,
      type: 'application/zip',
      size: Math.floor(Math.random() * 50000000) + 10000000, // 10-60MB
      url: `https://example-storage.com/files/${productId}/${baseFileName}-main.zip`
    },
    {
      name: `${baseFileName}-preview.jpg`,
      type: 'image/jpeg',
      size: Math.floor(Math.random() * 2000000) + 500000, // 0.5-2.5MB
      url: `https://example-storage.com/files/${productId}/${baseFileName}-preview.jpg`
    }
  ]

  // Add category-specific files
  if (categorySlug === 'ui-kits' || categorySlug === 'templates') {
    files.push({
      name: `${baseFileName}.fig`,
      type: 'application/figma',
      size: Math.floor(Math.random() * 20000000) + 5000000, // 5-25MB
      url: `https://example-storage.com/files/${productId}/${baseFileName}.fig`
    })
  }

  return { files }
}
