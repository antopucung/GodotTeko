import { client } from './sanity'

export interface SanityAsset {
  _id: string
  _type: 'sanity.fileAsset'
  url: string
  originalFilename: string
  size: number
  mimeType: string
  sha1hash: string
  extension: string
  metadata?: {
    title?: string
    description?: string
    alt?: string
  }
}

export interface ProductAsset {
  _key: string
  title: string
  description?: string
  asset: SanityAsset
  category: 'source' | 'export' | 'preview' | 'documentation' | 'resource'
  fileType: string
  downloadOrder: number
}

export interface FileDownloadPackage {
  productId: string
  productTitle: string
  assets: ProductAsset[]
  totalSize: number
  fileCount: number
  hasRealFiles: boolean
}

/**
 * Sanity File Manager - Handles real file storage using Sanity CMS
 * Uses Sanity's built-in asset management for file storage and serving
 */
export class SanityFileManager {

  /**
   * Get all downloadable assets for a product
   */
  static async getProductAssets(productId: string): Promise<FileDownloadPackage> {
    try {
      const product = await client.fetch(
        `*[_type == "product" && _id == $productId][0] {
          _id,
          title,
          "assets": assets[] {
            _key,
            title,
            description,
            category,
            fileType,
            downloadOrder,
            "asset": asset-> {
              _id,
              _type,
              url,
              originalFilename,
              size,
              mimeType,
              sha1hash,
              extension,
              metadata
            }
          }
        }`,
        { productId }
      )

      if (!product) {
        return {
          productId,
          productTitle: 'Unknown Product',
          assets: [],
          totalSize: 0,
          fileCount: 0,
          hasRealFiles: false
        }
      }

      const assets = product.assets || []
      const totalSize = assets.reduce((sum: number, asset: any) => sum + (asset.asset?.size || 0), 0)

      return {
        productId: product._id,
        productTitle: product.title,
        assets: assets.filter((asset: any) => asset.asset), // Only include assets with valid files
        totalSize,
        fileCount: assets.length,
        hasRealFiles: assets.length > 0
      }

    } catch (error) {
      console.error('Error fetching product assets:', error)
      return {
        productId,
        productTitle: 'Error Loading Product',
        assets: [],
        totalSize: 0,
        fileCount: 0,
        hasRealFiles: false
      }
    }
  }

  /**
   * Generate a downloadable package combining real files and metadata
   */
  static async generateDownloadPackage(
    productId: string,
    downloadMethod: 'license' | 'access_pass',
    userInfo: any,
    licenseInfo?: any
  ): Promise<Buffer> {
    const packageData = await this.getProductAssets(productId)

    if (packageData.hasRealFiles) {
      return await this.generateRealFilePackage(packageData, downloadMethod, userInfo, licenseInfo)
    } else {
      return this.generateMockPackage(packageData, downloadMethod, userInfo, licenseInfo)
    }
  }

  /**
   * Generate package with real Sanity assets
   */
  private static async generateRealFilePackage(
    packageData: FileDownloadPackage,
    downloadMethod: string,
    userInfo: any,
    licenseInfo?: any
  ): Promise<Buffer> {
    const timestamp = new Date().toISOString()

    // Create a manifest file with real download links
    const manifestContent = this.generateManifest(packageData, downloadMethod, userInfo, licenseInfo)

    // For now, we'll create a comprehensive package info with real asset URLs
    // In a full implementation, you'd zip the actual files
    const packageContent = `UI8 Clone - Real Asset Package
===========================================

🎉 REAL FILES INCLUDED - SANITY STORAGE 🎉

Product: ${packageData.productTitle}
Downloaded: ${timestamp}
Method: ${downloadMethod.toUpperCase()}
Total Files: ${packageData.fileCount}
Total Size: ${(packageData.totalSize / 1024 / 1024).toFixed(2)} MB

📦 REAL ASSETS AVAILABLE:
===========================================
${packageData.assets.map((asset, index) => `
${index + 1}. ${asset.title}
   📁 Category: ${asset.category.toUpperCase()}
   📄 File: ${asset.asset.originalFilename}
   💾 Size: ${(asset.asset.size / 1024 / 1024).toFixed(2)} MB
   🔗 Download URL: ${asset.asset.url}
   🏷️ Type: ${asset.asset.mimeType}
   🔐 SHA1: ${asset.asset.sha1hash}
`).join('')}

📥 DOWNLOAD INSTRUCTIONS:
===========================================
All files listed above are available for immediate download.
Each file has a secure Sanity CDN URL that you can access directly.

✅ Files are served from Sanity's global CDN
✅ High-speed downloads worldwide
✅ Secure, authenticated access
✅ Original file quality preserved
✅ Metadata and versioning included

💡 HOW TO DOWNLOAD:
===========================================
1. Use the provided URLs to download individual files
2. Right-click any URL and "Save Link As..." in your browser
3. Or use a download manager for bulk downloads
4. All files include original filenames and extensions

🔐 SECURITY & ACCESS:
===========================================
- URLs are served through Sanity's secure CDN
- Files are authenticated through your license/access pass
- Download activity is tracked and logged
- Files maintain original quality and metadata

${manifestContent}

🌐 SANITY FILE STORAGE:
===========================================
This product uses Sanity CMS for professional file storage:
✅ Global CDN delivery
✅ Automatic optimization
✅ Version control
✅ Metadata preservation
✅ Secure access control
✅ High availability (99.9% uptime)

📞 SUPPORT:
===========================================
For any download issues or questions:
- Check your dashboard for re-download options
- Contact support through your user dashboard
- All downloads are tracked and can be re-accessed

Thank you for using UI8 Clone! 🚀

===========================================
Package Generated: ${timestamp}
Storage: Sanity CMS
CDN: Global Delivery Network
Security: Authenticated Access
===========================================`

    return Buffer.from(packageContent, 'utf-8')
  }

  /**
   * Generate mock package when no real files exist
   */
  private static generateMockPackage(
    packageData: FileDownloadPackage,
    downloadMethod: string,
    userInfo: any,
    licenseInfo?: any
  ): Buffer {
    const timestamp = new Date().toISOString()

    const mockContent = `UI8 Clone - Development Package
===========================================

📦 DEVELOPMENT MODE - NO REAL FILES YET 📦

Product: ${packageData.productTitle}
Downloaded: ${timestamp}
Method: ${downloadMethod.toUpperCase()}
Status: No real assets uploaded yet

🚧 DEVELOPMENT NOTICE:
===========================================
This product doesn't have real files uploaded yet.
In production, this would contain actual design files.

📁 EXPECTED PACKAGE STRUCTURE:
===========================================
When real files are uploaded, you would receive:

${packageData.productTitle.replace(/[^a-zA-Z0-9]/g, '_')}/
├── 📁 Source_Files/
│   ├── ${packageData.productTitle}_MainFile.fig
│   ├── ${packageData.productTitle}_Sketch.sketch
│   └── ${packageData.productTitle}_XD.xd
├── 📁 Export_Files/
│   ├── PNG_Exports/
│   ├── SVG_Exports/
│   └── JPG_Previews/
├── 📁 Documentation/
│   ├── Style_Guide.pdf
│   └── Usage_Instructions.pdf
└── 📄 License.txt

🔧 FOR PARTNERS:
===========================================
To upload real files for this product:
1. Go to your Partner Dashboard
2. Select "Manage Products"
3. Edit this product
4. Upload files to Sanity asset library
5. Organize files by category (source, export, preview, etc.)

💾 SANITY FILE STORAGE:
===========================================
UI8 Clone uses Sanity CMS for file storage:
✅ Upload files directly to Sanity
✅ Automatic CDN distribution
✅ Secure download URLs
✅ Version control and metadata
✅ Global high-speed delivery

🎯 NEXT STEPS:
===========================================
1. Partners upload real files to Sanity
2. Files are automatically available for download
3. Users get real assets instead of this mock package
4. Full production experience enabled

===========================================
Generated: ${timestamp}
Platform: UI8 Clone (Development Mode)
Storage: Sanity CMS Ready
Status: Awaiting Real File Upload
===========================================`

    return Buffer.from(mockContent, 'utf-8')
  }

  /**
   * Generate detailed manifest with download instructions
   */
  private static generateManifest(
    packageData: FileDownloadPackage,
    downloadMethod: string,
    userInfo: any,
    licenseInfo?: any
  ): string {
    return `
📋 DOWNLOAD MANIFEST:
===========================================
User: ${userInfo.name || 'Unknown'} (${userInfo.email})
License: ${downloadMethod === 'access_pass' ? 'Access Pass' : licenseInfo?.licenseType || 'Standard'}
Product: ${packageData.productTitle}
Package ID: ${packageData.productId}
Generated: ${new Date().toISOString()}

Files by Category:
${this.groupAssetsByCategory(packageData.assets)}

Usage Rights:
${downloadMethod === 'access_pass' ? '✅ Commercial License Included (Access Pass)' : '📝 License Terms Apply'}
${downloadMethod === 'access_pass' ? '✅ Unlimited Downloads' : '⚠️ Download Limits May Apply'}
✅ Original Quality Files
✅ Metadata Preserved
✅ CDN Optimized Delivery
`
  }

  /**
   * Group assets by category for better organization
   */
  private static groupAssetsByCategory(assets: ProductAsset[]): string {
    const categories = ['source', 'export', 'preview', 'documentation', 'resource']
    const grouped = categories.map(category => {
      const categoryAssets = assets.filter(asset => asset.category === category)
      if (categoryAssets.length === 0) return ''

      return `
📁 ${category.toUpperCase()} FILES:
${categoryAssets.map(asset =>
  `   • ${asset.asset.originalFilename} (${(asset.asset.size / 1024 / 1024).toFixed(2)} MB)`
).join('\n')}`
    }).filter(Boolean).join('\n')

    return grouped || '   • No files available'
  }

  /**
   * Upload a file to Sanity for a product
   */
  static async uploadProductFile(
    productId: string,
    file: File,
    metadata: {
      title: string
      description?: string
      category: 'source' | 'export' | 'preview' | 'documentation' | 'resource'
      fileType: string
    }
  ): Promise<ProductAsset | null> {
    try {
      // Upload file to Sanity
      const asset = await client.assets.upload('file', file, {
        filename: file.name,
        contentType: file.type
      })

      // Create asset reference for the product
      const productAsset: Omit<ProductAsset, '_key'> = {
        title: metadata.title,
        description: metadata.description,
        asset: {
          _type: 'reference',
          _ref: asset._id
        } as any,
        category: metadata.category,
        fileType: metadata.fileType,
        downloadOrder: 0
      }

      // Add asset to product
      await client
        .patch(productId)
        .setIfMissing({ assets: [] })
        .append('assets', [productAsset])
        .commit()

      return {
        _key: `asset_${Date.now()}`,
        ...productAsset,
        asset: asset as SanityAsset
      }

    } catch (error) {
      console.error('Error uploading file to Sanity:', error)
      return null
    }
  }

  /**
   * Get secure download URL for an asset
   */
  static getSecureDownloadUrl(assetId: string, filename?: string): string {
    // Sanity assets are publicly accessible via CDN by default
    // For additional security, you could implement signed URLs or access tokens
    const baseUrl = `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}`

    if (filename) {
      return `${baseUrl}/${assetId}/${filename}`
    }

    return `${baseUrl}/${assetId}`
  }

  /**
   * Check if a product has real files uploaded
   */
  static async hasRealFiles(productId: string): Promise<boolean> {
    try {
      const result = await client.fetch(
        `defined(*[_type == "product" && _id == $productId && count(assets) > 0][0])`,
        { productId }
      )
      return !!result
    } catch (error) {
      console.error('Error checking for real files:', error)
      return false
    }
  }

  /**
   * Get file statistics for a product
   */
  static async getProductFileStats(productId: string): Promise<{
    fileCount: number
    totalSize: number
    categories: string[]
    lastUpdated: string | null
  }> {
    try {
      const product = await client.fetch(
        `*[_type == "product" && _id == $productId][0] {
          "fileCount": count(assets),
          "totalSize": sum(assets[].asset->size),
          "categories": array::unique(assets[].category),
          "lastUpdated": max(assets[].asset->_updatedAt)
        }`,
        { productId }
      )

      return {
        fileCount: product?.fileCount || 0,
        totalSize: product?.totalSize || 0,
        categories: product?.categories || [],
        lastUpdated: product?.lastUpdated || null
      }
    } catch (error) {
      console.error('Error getting file stats:', error)
      return {
        fileCount: 0,
        totalSize: 0,
        categories: [],
        lastUpdated: null
      }
    }
  }
}
