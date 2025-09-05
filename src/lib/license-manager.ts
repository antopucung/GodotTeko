import { client } from './sanity'
import { generateLicenseKey } from './stripe'

export interface License {
  _id: string
  licenseKey: string
  user: {
    _id: string
    name: string
    email: string
  }
  product: {
    _id: string
    title: string
    slug: { current: string }
    image?: string
    categories?: Array<{ name: string; slug: { current: string } }>
  }
  order: {
    _id: string
    orderNumber: string
    total?: number
  }
  licenseType: 'basic' | 'extended' | 'access_pass'
  status: 'active' | 'suspended' | 'expired' | 'revoked'
  downloadCount: number
  downloadLimit?: number
  lastDownloadAt?: string
  issuedAt: string
  expiresAt?: string
  downloadHistory?: Array<{
    downloadedAt: string
    ipAddress: string
    userAgent: string
    fileSize: number
  }>
  metadata: {
    purchasePrice: number
    currency: string
    stripePaymentIntentId?: string
    deviceFingerprint?: string
  }
}

export interface AccessPass {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  passType: 'monthly' | 'yearly' | 'lifetime'
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused'
  stripeSubscriptionId?: string
  currentPeriodStart: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  pricing: {
    amount: number
    currency: string
    interval?: string
  }
  usage: {
    totalDownloads: number
    downloadsThisPeriod: number
    lastDownloadAt?: string
  }
}

export class LicenseManager {
  /**
   * Generate a license for a purchased product
   */
  static async generateLicense(params: {
    userId: string
    productId: string
    orderId: string
    licenseType: 'basic' | 'extended' | 'access_pass'
    purchasePrice: number
    currency: string
    stripePaymentIntentId?: string
    downloadLimit?: number
    expiresAt?: string
  }): Promise<License> {
    const licenseKey = generateLicenseKey()

    const licenseData = {
      _type: 'license',
      licenseKey,
      user: {
        _type: 'reference',
        _ref: params.userId
      },
      product: {
        _type: 'reference',
        _ref: params.productId
      },
      order: {
        _type: 'reference',
        _ref: params.orderId
      },
      licenseType: params.licenseType,
      status: 'active',
      downloadCount: 0,
      downloadLimit: params.downloadLimit,
      issuedAt: new Date().toISOString(),
      expiresAt: params.expiresAt,
      metadata: {
        purchasePrice: params.purchasePrice,
        currency: params.currency,
        stripePaymentIntentId: params.stripePaymentIntentId
      }
    }

    const license = await client.create(licenseData)

    // Fetch the complete license with populated references
    const fullLicense = await client.fetch(
      `*[_type == "license" && _id == $licenseId][0] {
        _id,
        licenseKey,
        licenseType,
        status,
        downloadCount,
        downloadLimit,
        lastDownloadAt,
        issuedAt,
        expiresAt,
        downloadHistory,
        metadata,
        user-> {
          _id,
          name,
          email
        },
        product-> {
          _id,
          title,
          slug,
          "image": images[0].asset->url,
          "categories": categories[]-> {
            name,
            slug
          }
        },
        order-> {
          _id,
          orderNumber,
          total
        }
      }`,
      { licenseId: license._id }
    )

    return fullLicense as License
  }

  /**
   * Generate licenses for all items in an order
   */
  static async generateOrderLicenses(params: {
    userId: string
    orderId: string
    items: Array<{
      productId: string
      quantity: number
      price: number
      licenseType?: 'basic' | 'extended'
    }>
    currency: string
    stripePaymentIntentId?: string
  }): Promise<License[]> {
    const licenses: License[] = []

    for (const item of params.items) {
      // Generate license for each quantity (though usually quantity is 1 for digital products)
      for (let i = 0; i < item.quantity; i++) {
        const license = await this.generateLicense({
          userId: params.userId,
          productId: item.productId,
          orderId: params.orderId,
          licenseType: item.licenseType || 'basic',
          purchasePrice: item.price,
          currency: params.currency,
          stripePaymentIntentId: params.stripePaymentIntentId,
          downloadLimit: item.licenseType === 'basic' ? 10 : undefined, // Basic has 10 download limit
          expiresAt: item.licenseType === 'basic' ?
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : // Basic expires in 1 year
            undefined // Extended is lifetime
        })
        licenses.push(license)
      }
    }

    return licenses
  }

  /**
   * Validate if a user can download a product
   */
  static async validateDownloadAccess(params: {
    userId: string
    productId?: string
    licenseId?: string
  }): Promise<{
    canDownload: boolean
    reason?: string
    license?: License
    accessPass?: AccessPass
    downloadMethod: 'license' | 'access_pass' | 'none'
  }> {
    // Method 1: Check specific license
    if (params.licenseId) {
      const license = await client.fetch(
        `*[_type == "license" && _id == $licenseId && user._ref == $userId][0] {
          _id,
          licenseKey,
          licenseType,
          status,
          downloadCount,
          downloadLimit,
          lastDownloadAt,
          issuedAt,
          expiresAt,
          downloadHistory,
          metadata,
          user-> {
            _id,
            name,
            email
          },
          product-> {
            _id,
            title,
            slug,
            "image": images[0].asset->url,
            "categories": categories[]-> {
              name,
              slug
            }
          },
          order-> {
            _id,
            orderNumber,
            total
          }
        }`,
        { licenseId: params.licenseId, userId: params.userId }
      )

      if (!license) {
        return { canDownload: false, reason: 'License not found', downloadMethod: 'none' }
      }

      if (license.status !== 'active') {
        return { canDownload: false, reason: `License is ${license.status}`, downloadMethod: 'none' }
      }

      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        return { canDownload: false, reason: 'License has expired', downloadMethod: 'none' }
      }

      if (license.downloadLimit && license.downloadCount >= license.downloadLimit) {
        return { canDownload: false, reason: 'Download limit exceeded', downloadMethod: 'none' }
      }

      return { canDownload: true, license, downloadMethod: 'license' }
    }

    // Method 2: Check access pass for product
    if (params.productId) {
      // First check if user has active access pass
      const accessPass = await client.fetch(
        `*[_type == "accessPass" && user._ref == $userId && status == "active"][0] {
          _id,
          passType,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          pricing,
          usage,
          user-> {
            _id,
            name,
            email
          }
        }`,
        { userId: params.userId }
      )

      if (accessPass) {
        // Check if access pass is valid
        const isValid = accessPass.passType === 'lifetime' ||
          (accessPass.currentPeriodEnd && new Date(accessPass.currentPeriodEnd) > new Date())

        if (isValid) {
          return { canDownload: true, accessPass, downloadMethod: 'access_pass' }
        }
      }

      // Method 3: Check individual product license
      const productLicense = await client.fetch(
        `*[_type == "license" && user._ref == $userId && product._ref == $productId && status == "active"][0] {
          _id,
          licenseKey,
          licenseType,
          status,
          downloadCount,
          downloadLimit,
          lastDownloadAt,
          issuedAt,
          expiresAt,
          downloadHistory,
          metadata,
          user-> {
            _id,
            name,
            email
          },
          product-> {
            _id,
            title,
            slug,
            "image": images[0].asset->url,
            "categories": categories[]-> {
              name,
              slug
            }
          },
          order-> {
            _id,
            orderNumber,
            total
          }
        }`,
        { userId: params.userId, productId: params.productId }
      )

      if (productLicense) {
        // Check license validity
        if (productLicense.expiresAt && new Date(productLicense.expiresAt) < new Date()) {
          return { canDownload: false, reason: 'License has expired', downloadMethod: 'none' }
        }

        if (productLicense.downloadLimit && productLicense.downloadCount >= productLicense.downloadLimit) {
          return { canDownload: false, reason: 'Download limit exceeded', downloadMethod: 'none' }
        }

        return { canDownload: true, license: productLicense, downloadMethod: 'license' }
      }
    }

    return { canDownload: false, reason: 'No valid license or access pass found', downloadMethod: 'none' }
  }

  /**
   * Record a download and update usage statistics
   */
  static async recordDownload(params: {
    userId: string
    licenseId?: string
    productId?: string
    downloadMethod: 'license' | 'access_pass'
    fileSize?: number
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    const downloadEntry = {
      downloadedAt: new Date().toISOString(),
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      fileSize: params.fileSize || 0
    }

    if (params.downloadMethod === 'license' && params.licenseId) {
      // Update license download count and history
      await client
        .patch(params.licenseId)
        .inc({ downloadCount: 1 })
        .setIfMissing({ downloadHistory: [] })
        .append('downloadHistory', [downloadEntry])
        .set({ lastDownloadAt: new Date().toISOString() })
        .commit()
    } else if (params.downloadMethod === 'access_pass') {
      // Update access pass usage
      const accessPass = await client.fetch(
        `*[_type == "accessPass" && user._ref == $userId && status == "active"][0] { _id }`,
        { userId: params.userId }
      )

      if (accessPass) {
        await client
          .patch(accessPass._id)
          .inc({ 'usage.totalDownloads': 1, 'usage.downloadsThisPeriod': 1 })
          .set({ 'usage.lastDownloadAt': new Date().toISOString() })
          .commit()
      }
    }
  }

  /**
   * Create or update access pass
   */
  static async createAccessPass(params: {
    userId: string
    passType: 'monthly' | 'yearly' | 'lifetime'
    stripeSubscriptionId?: string
    stripeCustomerId: string
    pricing: {
      amount: number
      currency: string
      interval?: string
    }
    currentPeriodStart: string
    currentPeriodEnd?: string
  }): Promise<AccessPass> {
    const accessPassData = {
      _type: 'accessPass',
      user: {
        _type: 'reference',
        _ref: params.userId
      },
      passType: params.passType,
      status: 'active',
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripeCustomerId: params.stripeCustomerId,
      currentPeriodStart: params.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd,
      cancelAtPeriodEnd: false,
      pricing: params.pricing,
      usage: {
        totalDownloads: 0,
        downloadsThisPeriod: 0
      }
    }

    const accessPass = await client.create(accessPassData)

    // Fetch the complete access pass with populated references
    const fullAccessPass = await client.fetch(
      `*[_type == "accessPass" && _id == $accessPassId][0] {
        _id,
        passType,
        status,
        stripeSubscriptionId,
        stripeCustomerId,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        pricing,
        usage,
        user-> {
          _id,
          name,
          email
        }
      }`,
      { accessPassId: accessPass._id }
    )

    return fullAccessPass as AccessPass
  }

  /**
   * Get user's active licenses
   */
  static async getUserLicenses(params: {
    userId: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<{
    licenses: License[]
    totalCount: number
  }> {
    const statusFilter = params.status && params.status !== 'all' ? ` && status == "${params.status}"` : ''
    const limitClause = params.limit ? `[${params.offset || 0}...${(params.offset || 0) + params.limit}]` : ''

    const [licenses, totalCount] = await Promise.all([
      client.fetch(
        `*[_type == "license" && user._ref == $userId${statusFilter}] | order(issuedAt desc) ${limitClause} {
          _id,
          licenseKey,
          licenseType,
          status,
          downloadCount,
          downloadLimit,
          lastDownloadAt,
          issuedAt,
          expiresAt,
          downloadHistory,
          metadata,
          user-> {
            _id,
            name,
            email
          },
          product-> {
            _id,
            title,
            slug,
            "image": images[0].asset->url,
            freebie,
            "categories": categories[]-> {
              name,
              slug
            }
          },
          order-> {
            _id,
            orderNumber,
            total
          }
        }`,
        { userId: params.userId }
      ),
      client.fetch(
        `count(*[_type == "license" && user._ref == $userId${statusFilter}])`,
        { userId: params.userId }
      )
    ])

    return { licenses, totalCount }
  }

  /**
   * Get user's access pass
   */
  static async getUserAccessPass(userId: string): Promise<AccessPass | null> {
    const accessPass = await client.fetch(
      `*[_type == "accessPass" && user._ref == $userId && status in ["active", "past_due", "cancelled"]][0] {
        _id,
        passType,
        status,
        stripeSubscriptionId,
        stripeCustomerId,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        pricing,
        usage,
        user-> {
          _id,
          name,
          email
        }
      }`,
      { userId }
    )

    return accessPass || null
  }

  /**
   * Check if user has any active access
   */
  static async hasActiveAccess(userId: string): Promise<boolean> {
    const accessPass = await this.getUserAccessPass(userId)

    if (accessPass && accessPass.status === 'active') {
      if (accessPass.passType === 'lifetime') return true
      if (accessPass.currentPeriodEnd && new Date(accessPass.currentPeriodEnd) > new Date()) return true
    }

    return false
  }

  /**
   * Get download statistics for user
   */
  static async getUserDownloadStats(userId: string): Promise<{
    totalDownloads: number
    totalLicenses: number
    activeAccessPass: boolean
    recentDownloads: Array<{
      productTitle: string
      downloadedAt: string
      method: 'license' | 'access_pass'
    }>
  }> {
    const [licenses, accessPass] = await Promise.all([
      this.getUserLicenses({ userId, limit: 1000 }),
      this.getUserAccessPass(userId)
    ])

    const totalDownloads = licenses.licenses.reduce((sum, license) => sum + license.downloadCount, 0) +
      (accessPass?.usage.totalDownloads || 0)

    const hasActiveAccess = await this.hasActiveAccess(userId)

    // Get recent downloads from license history
    const recentDownloads = licenses.licenses
      .filter(license => license.lastDownloadAt)
      .sort((a, b) => new Date(b.lastDownloadAt!).getTime() - new Date(a.lastDownloadAt!).getTime())
      .slice(0, 10)
      .map(license => ({
        productTitle: license.product.title,
        downloadedAt: license.lastDownloadAt!,
        method: 'license' as const
      }))

    return {
      totalDownloads,
      totalLicenses: licenses.totalCount,
      activeAccessPass: hasActiveAccess,
      recentDownloads
    }
  }
}
