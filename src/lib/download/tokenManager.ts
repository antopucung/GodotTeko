import { client } from '@/lib/sanity'
import { PLATFORM_CONFIG } from '@/config/platform'
import { v4 as uuidv4 } from 'uuid'
import { createHash } from 'crypto'

export interface DownloadToken {
  id: string
  token: string
  userId: string
  orderId: string
  productId: string
  fileKeys: string[]
  maxDownloads: number
  downloadCount: number
  expiresAt: Date
  createdAt: Date
  metadata: {
    userIP?: string
    userAgent?: string
    orderNumber?: string
    productTitle?: string
  }
  restrictions: {
    ipValidation: boolean
    userAgentValidation: boolean
    singleUse: boolean
  }
}

export interface DownloadActivity {
  tokenId: string
  fileKey: string
  downloadedAt: string
  userIP: string
  userAgent: string
  fileSize: number
  success: boolean
  error?: string
}

export interface TokenValidation {
  isValid: boolean
  token?: DownloadToken
  error?: string
  remainingDownloads?: number
}

export class DownloadTokenManager {
  /**
   * Create a new download token for a user's purchase
   */
  static async createToken(
    userId: string,
    orderId: string,
    productId: string,
    fileKeys: string[],
    options: {
      maxDownloads?: number
      expiresInHours?: number
      userIP?: string
      userAgent?: string
      orderNumber?: string
      productTitle?: string
      ipValidation?: boolean
      userAgentValidation?: boolean
      singleUse?: boolean
    } = {}
  ): Promise<{ success: boolean; token?: DownloadToken; error?: string }> {
    try {
      // Generate secure token
      const tokenId = uuidv4()
      const tokenString = this.generateSecureToken(userId, productId, tokenId)

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + (options.expiresInHours || 24))

      const downloadToken: DownloadToken = {
        id: tokenId,
        token: tokenString,
        userId,
        orderId,
        productId,
        fileKeys,
        maxDownloads: options.maxDownloads || PLATFORM_CONFIG.storage.maxDownloadsPerToken,
        downloadCount: 0,
        expiresAt,
        createdAt: new Date(),
        metadata: {
          userIP: options.userIP,
          userAgent: options.userAgent,
          orderNumber: options.orderNumber,
          productTitle: options.productTitle
        },
        restrictions: {
          ipValidation: options.ipValidation ?? true,
          userAgentValidation: options.userAgentValidation ?? true,
          singleUse: options.singleUse ?? false
        }
      }

      // Store in Sanity
      await client.create({
        _type: 'downloadToken',
        _id: tokenId,
        token: tokenString,
        user: { _type: 'reference', _ref: userId },
        order: { _type: 'reference', _ref: orderId },
        product: { _type: 'reference', _ref: productId },
        fileKeys,
        maxDownloads: downloadToken.maxDownloads,
        downloadCount: 0,
        expiresAt: expiresAt.toISOString(),
        createdAt: downloadToken.createdAt.toISOString(),
        metadata: downloadToken.metadata,
        restrictions: downloadToken.restrictions,
        status: 'active'
      })

      return {
        success: true,
        token: downloadToken
      }
    } catch (error) {
      console.error('Error creating download token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create token'
      }
    }
  }

  /**
   * Validate a download token
   */
  static async validateToken(
    tokenString: string,
    userIP: string,
    userAgent: string
  ): Promise<TokenValidation> {
    try {
      // Find token in database
      const tokenDoc = await client.fetch(
        `*[_type == "downloadToken" && token == $tokenString && status == "active"][0] {
          _id,
          token,
          "userId": user._ref,
          "orderId": order._ref,
          "productId": product._ref,
          fileKeys,
          maxDownloads,
          downloadCount,
          expiresAt,
          createdAt,
          metadata,
          restrictions,
          status
        }`,
        { tokenString }
      )

      if (!tokenDoc) {
        return {
          isValid: false,
          error: 'Token not found or inactive'
        }
      }

      // Check if token is expired
      const now = new Date()
      const expiresAt = new Date(tokenDoc.expiresAt)
      if (now > expiresAt) {
        // Mark token as expired
        await this.deactivateToken(tokenDoc._id, 'expired')
        return {
          isValid: false,
          error: 'Token has expired'
        }
      }

      // Check download limit
      if (tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
        await this.deactivateToken(tokenDoc._id, 'download_limit_reached')
        return {
          isValid: false,
          error: 'Download limit reached'
        }
      }

      // Validate IP if required
      if (tokenDoc.restrictions.ipValidation && tokenDoc.metadata.userIP && tokenDoc.metadata.userIP !== userIP) {
        return {
          isValid: false,
          error: 'IP address validation failed'
        }
      }

      // Validate User Agent if required (fuzzy match)
      if (tokenDoc.restrictions.userAgentValidation && tokenDoc.metadata.userAgent) {
        const similarity = this.calculateUserAgentSimilarity(tokenDoc.metadata.userAgent, userAgent)
        if (similarity < 0.8) { // 80% similarity threshold
          return {
            isValid: false,
            error: 'Browser validation failed'
          }
        }
      }

      // Convert to DownloadToken interface
      const downloadToken: DownloadToken = {
        id: tokenDoc._id,
        token: tokenDoc.token,
        userId: tokenDoc.userId,
        orderId: tokenDoc.orderId,
        productId: tokenDoc.productId,
        fileKeys: tokenDoc.fileKeys,
        maxDownloads: tokenDoc.maxDownloads,
        downloadCount: tokenDoc.downloadCount,
        expiresAt: new Date(tokenDoc.expiresAt),
        createdAt: new Date(tokenDoc.createdAt),
        metadata: tokenDoc.metadata,
        restrictions: tokenDoc.restrictions
      }

      return {
        isValid: true,
        token: downloadToken,
        remainingDownloads: tokenDoc.maxDownloads - tokenDoc.downloadCount
      }
    } catch (error) {
      console.error('Error validating token:', error)
      return {
        isValid: false,
        error: 'Token validation failed'
      }
    }
  }

  /**
   * Record a download activity
   */
  static async recordDownload(
    tokenId: string,
    fileKey: string,
    activity: {
      userIP: string
      userAgent: string
      downloadedAt: string
      fileSize: number
      contentType?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Increment download count
      await client
        .patch(tokenId)
        .inc({ downloadCount: 1 })
        .commit()

      // Create download activity record
      await client.create({
        _type: 'downloadActivity',
        token: { _type: 'reference', _ref: tokenId },
        fileKey,
        downloadedAt: activity.downloadedAt,
        userIP: activity.userIP,
        userAgent: activity.userAgent,
        fileSize: activity.fileSize,
        contentType: activity.contentType,
        success: true
      })

      // Check if this was the last allowed download
      const updatedToken = await client.fetch(
        `*[_type == "downloadToken" && _id == $tokenId][0] {
          downloadCount,
          maxDownloads,
          restrictions
        }`,
        { tokenId }
      )

      // If single-use or reached max downloads, deactivate token
      if (updatedToken?.restrictions?.singleUse ||
          (updatedToken?.downloadCount >= updatedToken?.maxDownloads)) {
        await this.deactivateToken(tokenId, 'download_completed')
      }

      return { success: true }
    } catch (error) {
      console.error('Error recording download:', error)

      // Record failed download attempt
      try {
        await client.create({
          _type: 'downloadActivity',
          token: { _type: 'reference', _ref: tokenId },
          fileKey,
          downloadedAt: activity.downloadedAt,
          userIP: activity.userIP,
          userAgent: activity.userAgent,
          fileSize: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      } catch (recordError) {
        console.error('Failed to record download failure:', recordError)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record download'
      }
    }
  }

  /**
   * Deactivate a token
   */
  static async deactivateToken(
    tokenId: string,
    reason: 'expired' | 'download_limit_reached' | 'download_completed' | 'manual' | 'security'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await client
        .patch(tokenId)
        .set({
          status: 'inactive',
          deactivatedAt: new Date().toISOString(),
          deactivationReason: reason
        })
        .commit()

      return { success: true }
    } catch (error) {
      console.error('Error deactivating token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate token'
      }
    }
  }

  /**
   * Generate a secure token string
   */
  private static generateSecureToken(userId: string, productId: string, tokenId: string): string {
    const timestamp = Date.now().toString()
    const randomBytes = Math.random().toString(36).substring(2)
    const data = `${userId}:${productId}:${tokenId}:${timestamp}:${randomBytes}`

    // Create hash using secret
    const secret = process.env.DOWNLOAD_TOKEN_SECRET || 'default-secret-change-me'
    const hash = createHash('sha256').update(data + secret).digest('hex')

    // Combine timestamp and hash for the final token
    return `dl_${timestamp}_${hash.substring(0, 32)}`
  }

  /**
   * Calculate user agent similarity for validation
   */
  private static calculateUserAgentSimilarity(original: string, current: string): number {
    if (original === current) return 1.0

    // Extract key components (browser, version, OS)
    const extractComponents = (ua: string) => {
      const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/?([\d.]+)/i)
      const os = ua.match(/(Windows|Mac OS X|Linux|Android|iOS)/i)
      return {
        browser: browser ? `${browser[1]}/${browser[2].split('.')[0]}` : '',
        os: os ? os[1] : ''
      }
    }

    const originalComponents = extractComponents(original)
    const currentComponents = extractComponents(current)

    let score = 0
    if (originalComponents.browser && originalComponents.browser === currentComponents.browser) score += 0.6
    if (originalComponents.os && originalComponents.os === currentComponents.os) score += 0.4

    return score
  }

  /**
   * Get download statistics for a user
   */
  static async getUserDownloadStats(
    userId: string,
    timeframe: 'day' | 'week' | 'month' | 'all' = 'month'
  ): Promise<{
    totalDownloads: number
    uniqueProducts: number
    dataTransferred: number
    topProducts: Array<{ productId: string; downloads: number; dataTransferred: number }>
  }> {
    try {
      let dateFilter = ''
      const now = new Date()

      if (timeframe !== 'all') {
        const daysBack = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30
        const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
        dateFilter = ` && downloadedAt > "${startDate.toISOString()}"`
      }

      const stats = await client.fetch(
        `{
          "activities": *[_type == "downloadActivity" && token->user._ref == $userId && success == true${dateFilter}] {
            "productId": token->product._ref,
            fileSize,
            downloadedAt
          },
          "totalDownloads": count(*[_type == "downloadActivity" && token->user._ref == $userId && success == true${dateFilter}]),
          "dataTransferred": math::sum(*[_type == "downloadActivity" && token->user._ref == $userId && success == true${dateFilter}].fileSize)
        }`,
        { userId }
      )

      // Calculate unique products and top products
      const productMap = new Map()
      stats.activities.forEach((activity: any) => {
        const existing = productMap.get(activity.productId) || { downloads: 0, dataTransferred: 0 }
        productMap.set(activity.productId, {
          downloads: existing.downloads + 1,
          dataTransferred: existing.dataTransferred + activity.fileSize
        })
      })

      const topProducts = Array.from(productMap.entries())
        .map(([productId, data]: [string, any]) => ({ productId, ...data }))
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 10)

      return {
        totalDownloads: stats.totalDownloads || 0,
        uniqueProducts: productMap.size,
        dataTransferred: stats.dataTransferred || 0,
        topProducts
      }
    } catch (error) {
      console.error('Error getting download stats:', error)
      return {
        totalDownloads: 0,
        uniqueProducts: 0,
        dataTransferred: 0,
        topProducts: []
      }
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<{ cleaned: number; errors: string[] }> {
    try {
      const now = new Date().toISOString()

      // Find expired tokens
      const expiredTokens = await client.fetch(
        `*[_type == "downloadToken" && status == "active" && expiresAt < $now] {
          _id
        }`,
        { now }
      )

      const errors: string[] = []
      let cleaned = 0

      for (const token of expiredTokens) {
        const result = await this.deactivateToken(token._id, 'expired')
        if (result.success) {
          cleaned++
        } else {
          errors.push(`Failed to deactivate token ${token._id}: ${result.error}`)
        }
      }

      return { cleaned, errors }
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error)
      return {
        cleaned: 0,
        errors: [`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Regenerate token for security purposes
   */
  static async regenerateToken(
    tokenId: string,
    reason: string = 'security_regeneration'
  ): Promise<{ success: boolean; newToken?: string; error?: string }> {
    try {
      // Get existing token data
      const existingToken = await client.fetch(
        `*[_type == "downloadToken" && _id == $tokenId][0] {
          _id,
          "userId": user._ref,
          "productId": product._ref,
          downloadCount,
          maxDownloads
        }`,
        { tokenId }
      )

      if (!existingToken) {
        return { success: false, error: 'Token not found' }
      }

      // Generate new token string
      const newTokenString = this.generateSecureToken(
        existingToken.userId,
        existingToken.productId,
        tokenId
      )

      // Update token with new string and reset some security fields
      await client
        .patch(tokenId)
        .set({
          token: newTokenString,
          regeneratedAt: new Date().toISOString(),
          regenerationReason: reason
        })
        .commit()

      return {
        success: true,
        newToken: newTokenString
      }
    } catch (error) {
      console.error('Error regenerating token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate token'
      }
    }
  }
}
