import { client } from './sanity'

// Simplified interfaces - keep the same structure but streamlined
export interface SimplifiedLicense {
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
  }
}

export interface SimplifiedAccessPass {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  passType: 'monthly' | 'yearly' | 'lifetime'
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused'
  stripeSubscriptionId?: string
  stripeCustomerId: string
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

export interface DownloadValidation {
  canDownload: boolean
  method: 'license' | 'access_pass' | 'none'
  reason?: string
  license?: SimplifiedLicense
  accessPass?: SimplifiedAccessPass
}

export interface AccessCheck {
  hasAccess: boolean
  method: 'license' | 'access_pass' | 'none'
  expiresAt?: string
}

// Generate realistic license keys
function generateLicenseKey(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `UI8-${timestamp}-${random}`.toUpperCase()
}

/**
 * Simplified License Manager - 6 Core Methods
 * Handles all licensing and access pass functionality with reduced complexity
 */
export class SimplifiedLicenseManager {

  /**
   * 1. UNIVERSAL LICENSE GENERATION
   * Handles individual products, bulk orders, and access passes
   */
  static async generateLicense(params: {
    userId: string
    productId?: string // For individual products
    productIds?: string[] // For bulk orders
    orderId: string
    licenseType: 'basic' | 'extended' | 'access_pass'
    purchasePrice: number
    currency: string
    stripePaymentIntentId?: string
    downloadLimit?: number
    expiresAt?: string
  }): Promise<SimplifiedLicense | SimplifiedLicense[]> {

    // Handle bulk order (multiple products)
    if (params.productIds && params.productIds.length > 0) {
      const licenses: SimplifiedLicense[] = []

      for (const productId of params.productIds) {
        const license = await this.createSingleLicense({
          ...params,
          productId
        })
        licenses.push(license)
      }

      return licenses
    }

    // Handle single product
    if (params.productId) {
      return await this.createSingleLicense({
        ...params,
        productId: params.productId
      })
    }

    throw new Error('Either productId or productIds must be provided')
  }

  /**
   * 2. UNIVERSAL DOWNLOAD VALIDATION
   * Checks licenses, access passes, and returns unified result
   */
  static async validateDownloadAccess(params: {
    userId: string
    productId?: string
    licenseId?: string
  }): Promise<DownloadValidation> {

    // Method 1: Validate specific license
    if (params.licenseId) {
      const license = await this.getLicenseById(params.licenseId, params.userId)

      if (!license) {
        return { canDownload: false, method: 'none', reason: 'License not found' }
      }

      const validation = this.validateLicense(license)
      if (validation.canDownload) {
        return { canDownload: true, method: 'license', license }
      } else {
        return { canDownload: false, method: 'none', reason: validation.reason }
      }
    }

    // Method 2: Check access pass first (unlimited access)
    const accessPassCheck = await this.checkAccessPass(params.userId)
    if (accessPassCheck.hasAccess) {
      const accessPass = await this.getAccessPass(params.userId)
      return {
        canDownload: true,
        method: 'access_pass',
        accessPass: accessPass || undefined
      }
    }

    // Method 3: Check individual product license
    if (params.productId) {
      const productLicense = await this.getProductLicense(params.userId, params.productId)

      if (productLicense) {
        const validation = this.validateLicense(productLicense)
        if (validation.canDownload) {
          return { canDownload: true, method: 'license', license: productLicense }
        } else {
          return { canDownload: false, method: 'none', reason: validation.reason }
        }
      }
    }

    return {
      canDownload: false,
      method: 'none',
      reason: 'No valid license or access pass found'
    }
  }

  /**
   * 3. UNIVERSAL DOWNLOAD TRACKING
   * Records downloads for both licenses and access passes
   */
  static async recordDownload(params: {
    userId: string
    productId: string
    method: 'license' | 'access_pass'
    licenseId?: string
    fileSize?: number
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {

    // Only record for valid methods
    if (params.method !== 'license' && params.method !== 'access_pass') {
      throw new Error('Invalid download method')
    }

    const downloadEntry = {
      downloadedAt: new Date().toISOString(),
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      fileSize: params.fileSize || 0
    }

    if (params.method === 'license' && params.licenseId) {
      // Update license download tracking
      await client
        .patch(params.licenseId)
        .inc({ downloadCount: 1 })
        .setIfMissing({ downloadHistory: [] })
        .append('downloadHistory', [downloadEntry])
        .set({ lastDownloadAt: new Date().toISOString() })
        .commit()

    } else if (params.method === 'access_pass') {
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
   * 4. COMPREHENSIVE USER LICENSE RETRIEVAL
   * Gets all user licenses with smart filtering and pagination
   */
  static async getUserLicenses(params: {
    userId: string
    orderId?: string
    productId?: string
    status?: string
    licenseType?: string
    limit?: number
    offset?: number
  }): Promise<{
    licenses: SimplifiedLicense[]
    totalCount: number
    stats: {
      totalLicenses: number
      activeLicenses: number
      totalDownloads: number
    }
  }> {

    // Build dynamic filter
    const filters = [`user._ref == "${params.userId}"`]

    if (params.orderId) filters.push(`order._ref == "${params.orderId}"`)
    if (params.productId) filters.push(`product._ref == "${params.productId}"`)
    if (params.status && params.status !== 'all') filters.push(`status == "${params.status}"`)
    if (params.licenseType && params.licenseType !== 'all') filters.push(`licenseType == "${params.licenseType}"`)

    const filterString = filters.join(' && ')
    const limitClause = params.limit ? `[${params.offset || 0}...${(params.offset || 0) + params.limit}]` : ''

    const [licenses, totalCount] = await Promise.all([
      client.fetch(
        `*[_type == "license" && ${filterString}] | order(issuedAt desc) ${limitClause} {
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
          user-> { _id, name, email },
          product-> {
            _id,
            title,
            slug,
            "image": images[0].asset->url,
            "categories": categories[]-> { name, slug }
          },
          order-> { _id, orderNumber, total }
        }`
      ),
      client.fetch(`count(*[_type == "license" && ${filterString}])`)
    ])

    // Calculate statistics
    const stats = {
      totalLicenses: totalCount,
      activeLicenses: licenses.filter((l: any) => l.status === 'active').length,
      totalDownloads: licenses.reduce((sum: number, l: any) => sum + l.downloadCount, 0)
    }

    return { licenses, totalCount, stats }
  }

  /**
   * 5. COMPLETE ACCESS PASS MANAGEMENT
   * Handles get, create, update, cancel operations
   */
  static async manageAccessPass(
    action: 'get' | 'create' | 'update' | 'cancel',
    params: any
  ): Promise<SimplifiedAccessPass | boolean | null> {

    switch (action) {
      case 'get':
        return await this.getAccessPass(params.userId)

      case 'create':
        return await this.createAccessPass(params)

      case 'update':
        return await this.updateAccessPass(params.userId, params.updates)

      case 'cancel':
        return await this.cancelAccessPass(params.userId)

      default:
        throw new Error('Invalid access pass action')
    }
  }

  /**
   * 6. QUICK ACCESS CHECK (Performance Optimized)
   * Fast validation for UI state and permissions
   */
  static async checkAccess(userId: string, productId?: string): Promise<AccessCheck> {

    // Quick access pass check (covers all products)
    const hasActivePass = await client.fetch(
      `defined(*[_type == "accessPass" && user._ref == $userId && status == "active" && (
        passType == "lifetime" ||
        (passType != "lifetime" && currentPeriodEnd > now())
      )][0])`,
      { userId }
    )

    if (hasActivePass) {
      return { hasAccess: true, method: 'access_pass' }
    }

    // Quick product license check
    if (productId) {
      const hasProductLicense = await client.fetch(
        `defined(*[_type == "license" && user._ref == $userId && product._ref == $productId && status == "active" && (
          !defined(expiresAt) || expiresAt > now()
        )][0])`,
        { userId, productId }
      )

      if (hasProductLicense) {
        return { hasAccess: true, method: 'license' }
      }
    }

    return { hasAccess: false, method: 'none' }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static async createSingleLicense(params: {
    userId: string
    productId: string
    orderId: string
    licenseType: 'basic' | 'extended' | 'access_pass'
    purchasePrice: number
    currency: string
    stripePaymentIntentId?: string
    downloadLimit?: number
    expiresAt?: string
  }): Promise<SimplifiedLicense> {

    const licenseKey = generateLicenseKey()

    const licenseData = {
      _type: 'license',
      licenseKey,
      user: { _type: 'reference', _ref: params.userId },
      product: { _type: 'reference', _ref: params.productId },
      order: { _type: 'reference', _ref: params.orderId },
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

    // Fetch complete license with populated references
    return await this.getLicenseById(license._id, params.userId) as SimplifiedLicense
  }

  private static async getLicenseById(licenseId: string, userId: string): Promise<SimplifiedLicense | null> {
    return await client.fetch(
      `*[_type == "license" && _id == $licenseId && user._ref == $userId][0] {
        _id, licenseKey, licenseType, status, downloadCount, downloadLimit,
        lastDownloadAt, issuedAt, expiresAt, downloadHistory, metadata,
        user-> { _id, name, email },
        product-> {
          _id, title, slug,
          "image": images[0].asset->url,
          "categories": categories[]-> { name, slug }
        },
        order-> { _id, orderNumber, total }
      }`,
      { licenseId, userId }
    )
  }

  private static async getProductLicense(userId: string, productId: string): Promise<SimplifiedLicense | null> {
    return await client.fetch(
      `*[_type == "license" && user._ref == $userId && product._ref == $productId && status == "active"][0] {
        _id, licenseKey, licenseType, status, downloadCount, downloadLimit,
        lastDownloadAt, issuedAt, expiresAt, downloadHistory, metadata,
        user-> { _id, name, email },
        product-> {
          _id, title, slug,
          "image": images[0].asset->url,
          "categories": categories[]-> { name, slug }
        },
        order-> { _id, orderNumber, total }
      }`,
      { userId, productId }
    )
  }

  private static validateLicense(license: SimplifiedLicense): { canDownload: boolean; reason?: string } {
    if (license.status !== 'active') {
      return { canDownload: false, reason: `License is ${license.status}` }
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return { canDownload: false, reason: 'License has expired' }
    }

    if (license.downloadLimit && license.downloadCount >= license.downloadLimit) {
      return { canDownload: false, reason: 'Download limit exceeded' }
    }

    return { canDownload: true }
  }

  private static async checkAccessPass(userId: string): Promise<{ hasAccess: boolean }> {
    const activePass = await client.fetch(
      `defined(*[_type == "accessPass" && user._ref == $userId && status == "active" && (
        passType == "lifetime" ||
        (passType != "lifetime" && currentPeriodEnd > now())
      )][0])`,
      { userId }
    )

    return { hasAccess: !!activePass }
  }

  private static async getAccessPass(userId: string): Promise<SimplifiedAccessPass | null> {
    return await client.fetch(
      `*[_type == "accessPass" && user._ref == $userId && status in ["active", "past_due", "cancelled"]][0] {
        _id, passType, status, stripeSubscriptionId, stripeCustomerId,
        currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, pricing, usage,
        user-> { _id, name, email }
      }`,
      { userId }
    )
  }

  private static async createAccessPass(params: {
    userId: string
    passType: 'monthly' | 'yearly' | 'lifetime'
    stripeSubscriptionId?: string
    stripeCustomerId: string
    pricing: { amount: number; currency: string; interval?: string }
    currentPeriodStart: string
    currentPeriodEnd?: string
  }): Promise<SimplifiedAccessPass> {

    const accessPassData = {
      _type: 'accessPass',
      user: { _type: 'reference', _ref: params.userId },
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
    return await this.getAccessPass(params.userId) as SimplifiedAccessPass
  }

  private static async updateAccessPass(userId: string, updates: any): Promise<boolean> {
    const accessPass = await client.fetch(
      `*[_type == "accessPass" && user._ref == $userId][0] { _id }`,
      { userId }
    )

    if (!accessPass) return false

    await client.patch(accessPass._id).set(updates).commit()
    return true
  }

  private static async cancelAccessPass(userId: string): Promise<boolean> {
    return await this.updateAccessPass(userId, {
      status: 'cancelled',
      cancelAtPeriodEnd: true,
      cancelledAt: new Date().toISOString()
    })
  }
}
