import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PLATFORM_CONFIG } from '@/config/platform'

// S3 Configuration
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  },
  endpoint: process.env.AWS_ENDPOINT, // For S3-compatible services like DigitalOcean Spaces
  forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === 'true' // For local development
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'ui8-marketplace-files'

// Initialize S3 client
const s3Client = new S3Client(s3Config)

export interface FileMetadata {
  size: number
  contentType: string
  lastModified: Date
  etag: string
  metadata?: Record<string, string>
}

export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  acl?: 'private' | 'public-read'
  cacheControl?: string
  contentDisposition?: string
}

export interface DownloadOptions {
  expiresIn?: number // seconds
  responseContentType?: string
  responseContentDisposition?: string
  versionId?: string
}

export class StorageService {
  /**
   * Upload a file to S3
   */
  static async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    options: UploadOptions = {}
  ): Promise<{ success: boolean; key: string; url?: string; error?: string }> {
    try {
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata,
        ACL: options.acl || 'private',
        CacheControl: options.cacheControl || 'max-age=31536000', // 1 year default
        ContentDisposition: options.contentDisposition
      })

      const result = await s3Client.send(putCommand)

      return {
        success: true,
        key,
        url: options.acl === 'public-read' ? this.getPublicUrl(key) : undefined
      }
    } catch (error) {
      console.error('Error uploading file to S3:', error)
      return {
        success: false,
        key,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Generate a presigned URL for uploading
   */
  static async generateUploadUrl(
    key: string,
    options: UploadOptions & { expiresIn?: number } = {}
  ): Promise<{ success: boolean; uploadUrl?: string; key: string; error?: string }> {
    try {
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: options.contentType,
        Metadata: options.metadata,
        ACL: options.acl || 'private'
      })

      const uploadUrl = await getSignedUrl(s3Client, putCommand, {
        expiresIn: options.expiresIn || 3600 // 1 hour default
      })

      return {
        success: true,
        uploadUrl,
        key
      }
    } catch (error) {
      console.error('Error generating upload URL:', error)
      return {
        success: false,
        key,
        error: error instanceof Error ? error.message : 'Failed to generate upload URL'
      }
    }
  }

  /**
   * Generate a presigned URL for downloading
   */
  static async generateDownloadUrl(
    key: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
        VersionId: options.versionId
      })

      const downloadUrl = await getSignedUrl(s3Client, getCommand, {
        expiresIn: options.expiresIn || 300 // 5 minutes default for downloads
      })

      return downloadUrl
    } catch (error) {
      console.error('Error generating download URL:', error)
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })

      const response = await s3Client.send(headCommand)

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || '',
        metadata: response.Metadata
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw new Error(`File not found or inaccessible: ${key}`)
    }
  }

  /**
   * Check if a file exists
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(key)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Delete a file
   */
  static async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })

      await s3Client.send(deleteCommand)

      return { success: true }
    } catch (error) {
      console.error('Error deleting file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  /**
   * List files with a prefix
   */
  static async listFiles(
    prefix: string,
    maxKeys: number = 100
  ): Promise<{ success: boolean; files?: Array<{ key: string; size: number; lastModified: Date }>; error?: string }> {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys
      })

      const response = await s3Client.send(listCommand)

      const files = (response.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date()
      }))

      return {
        success: true,
        files
      }
    } catch (error) {
      console.error('Error listing files:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'List failed'
      }
    }
  }

  /**
   * Get public URL for a file (if bucket allows public access)
   */
  static getPublicUrl(key: string): string {
    if (process.env.AWS_ENDPOINT) {
      // For S3-compatible services
      return `${process.env.AWS_ENDPOINT}/${BUCKET_NAME}/${key}`
    }
    // Standard S3 URL
    const region = process.env.AWS_REGION || 'us-east-1'
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
  }

  /**
   * Generate structured file key for organization
   */
  static generateFileKey(
    category: 'products' | 'avatars' | 'covers' | 'temp',
    userId: string,
    fileName: string,
    productId?: string
  ): string {
    const timestamp = new Date().getTime()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

    if (category === 'products' && productId) {
      return `products/${productId}/${userId}/${timestamp}_${sanitizedFileName}`
    }

    return `${category}/${userId}/${timestamp}_${sanitizedFileName}`
  }

  /**
   * Clean up temporary files older than specified time
   */
  static async cleanupTempFiles(olderThanHours: number = 24): Promise<{ deletedCount: number; errors: string[] }> {
    const errors: string[] = []
    let deletedCount = 0

    try {
      const { files } = await this.listFiles('temp/', 1000)

      if (!files) {
        return { deletedCount: 0, errors: ['Failed to list temp files'] }
      }

      const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000))

      for (const file of files) {
        if (file.lastModified < cutoffTime) {
          const result = await this.deleteFile(file.key)
          if (result.success) {
            deletedCount++
          } else {
            errors.push(`Failed to delete ${file.key}: ${result.error}`)
          }
        }
      }

      return { deletedCount, errors }
    } catch (error) {
      return {
        deletedCount,
        errors: [`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Copy file to new location
   */
  static async copyFile(
    sourceKey: string,
    destinationKey: string,
    options: { deleteSource?: boolean } = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For S3, we need to use CopyObjectCommand
      const { CopyObjectCommand } = await import('@aws-sdk/client-s3')

      const copyCommand = new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${sourceKey}`,
        Key: destinationKey
      })

      await s3Client.send(copyCommand)

      // Delete source if requested
      if (options.deleteSource) {
        const deleteResult = await this.deleteFile(sourceKey)
        if (!deleteResult.success) {
          console.warn(`Failed to delete source file after copy: ${deleteResult.error}`)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error copying file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Copy failed'
      }
    }
  }

  /**
   * Validate file type and size
   */
  static validateFile(
    fileName: string,
    fileSize: number,
    allowedTypes: string[] = PLATFORM_CONFIG.storage.allowedFileTypes
  ): { isValid: boolean; error?: string } {
    // Check file size
    if (fileSize > PLATFORM_CONFIG.storage.maxFileSize) {
      return {
        isValid: false,
        error: `File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds maximum allowed size of ${Math.round(PLATFORM_CONFIG.storage.maxFileSize / 1024 / 1024)}MB`
      }
    }

    // Check file type
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (!extension || !allowedTypes.includes(extension)) {
      return {
        isValid: false,
        error: `File type .${extension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    return { isValid: true }
  }
}

// Export for use in other modules
export { s3Client, BUCKET_NAME }
