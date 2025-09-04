import { StorageService } from '@/lib/storage/s3Client'
import { PLATFORM_CONFIG } from '@/config/platform'
import { client } from '@/lib/sanity'

export interface UploadProgress {
  uploadId: string
  fileName: string
  fileSize: number
  uploaded: number
  percentage: number
  speed: number // bytes per second
  eta: number // estimated time remaining in seconds
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled'
  error?: string
}

export interface FileUpload {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  fileKey: string
  userId: string
  productId?: string
  category: 'products' | 'avatars' | 'covers' | 'temp'
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  uploadedAt: Date
  processedAt?: Date
  metadata: {
    width?: number
    height?: number
    duration?: number
    checksum?: string
    virusScanResult?: 'clean' | 'infected' | 'pending'
  }
  tags?: string[]
}

export interface UploadOptions {
  productId?: string
  category?: 'products' | 'avatars' | 'covers' | 'temp'
  tags?: string[]
  allowedTypes?: string[]
  maxSize?: number
  generateThumbnails?: boolean
  compressImages?: boolean
  extractMetadata?: boolean
  virusScan?: boolean
}

export class FileUploadManager {
  private static activeUploads = new Map<string, UploadProgress>()
  private static abortControllers = new Map<string, AbortController>()

  /**
   * Initialize file upload with validation
   */
  static async initializeUpload(
    file: File,
    userId: string,
    options: UploadOptions = {}
  ): Promise<{
    success: boolean
    uploadId?: string
    presignedUrl?: string
    fileKey?: string
    error?: string
  }> {
    try {
      // Validate file
      const validation = StorageService.validateFile(
        file.name,
        file.size,
        options.allowedTypes || PLATFORM_CONFIG.storage.allowedFileTypes
      )

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Generate unique upload ID and file key
      const uploadId = this.generateUploadId()
      const category = options.category || 'temp'
      const fileKey = StorageService.generateFileKey(
        category,
        userId,
        file.name,
        options.productId
      )

      // Create upload record in database
      const uploadRecord = await client.create({
        _type: 'fileUpload',
        _id: uploadId,
        fileName: this.sanitizeFileName(file.name),
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileKey,
        user: { _type: 'reference', _ref: userId },
        product: options.productId ? { _type: 'reference', _ref: options.productId } : undefined,
        category,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
        metadata: {
          checksum: await this.calculateChecksum(file)
        },
        tags: options.tags || []
      })

      // Generate presigned URL for direct upload to S3
      const presignedResult = await StorageService.generateUploadUrl(
        fileKey,
        {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadId,
            userId,
            category
          },
          expiresIn: PLATFORM_CONFIG.storage.upload.presignedUrlExpiry
        }
      )

      if (!presignedResult.success) {
        return {
          success: false,
          error: presignedResult.error
        }
      }

      // Initialize progress tracking
      this.activeUploads.set(uploadId, {
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        uploaded: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        status: 'preparing'
      })

      return {
        success: true,
        uploadId,
        presignedUrl: presignedResult.uploadUrl!,
        fileKey
      }

    } catch (error) {
      console.error('Error initializing upload:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload initialization failed'
      }
    }
  }

  /**
   * Upload file with progress tracking
   */
  static async uploadFile(
    file: File,
    presignedUrl: string,
    uploadId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    const abortController = new AbortController()
    this.abortControllers.set(uploadId, abortController)

    try {
      const progress = this.activeUploads.get(uploadId)
      if (!progress) {
        throw new Error('Upload not initialized')
      }

      progress.status = 'uploading'
      onProgress?.(progress)

      const startTime = Date.now()
      let lastProgressTime = startTime
      let lastUploaded = 0

      // Create upload promise with progress tracking
      const uploadPromise = new Promise<boolean>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const now = Date.now()
            const timeDiff = (now - lastProgressTime) / 1000
            const uploadedDiff = event.loaded - lastUploaded

            if (timeDiff > 0) {
              progress.speed = uploadedDiff / timeDiff
              progress.eta = progress.speed > 0 ? (file.size - event.loaded) / progress.speed : 0
            }

            progress.uploaded = event.loaded
            progress.percentage = Math.round((event.loaded / event.total) * 100)

            lastProgressTime = now
            lastUploaded = event.loaded

            onProgress?.(progress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            progress.status = 'completed'
            progress.percentage = 100
            onProgress?.(progress)
            resolve(true)
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed due to network error'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'))
        })

        // Handle abort signal
        abortController.signal.addEventListener('abort', () => {
          xhr.abort()
        })

        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      await uploadPromise

      // Update upload status in database
      await client
        .patch(uploadId)
        .set({
          status: 'completed',
          processedAt: new Date().toISOString()
        })
        .commit()

      // Cleanup
      this.activeUploads.delete(uploadId)
      this.abortControllers.delete(uploadId)

      return { success: true }

    } catch (error) {
      console.error('Upload error:', error)

      // Update progress with error
      const progress = this.activeUploads.get(uploadId)
      if (progress) {
        progress.status = 'error'
        progress.error = error instanceof Error ? error.message : 'Upload failed'
        onProgress?.(progress)
      }

      // Update database
      try {
        await client
          .patch(uploadId)
          .set({
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Upload failed'
          })
          .commit()
      } catch (dbError) {
        console.error('Failed to update upload error in database:', dbError)
      }

      // Cleanup
      this.activeUploads.delete(uploadId)
      this.abortControllers.delete(uploadId)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Cancel an ongoing upload
   */
  static cancelUpload(uploadId: string): boolean {
    const abortController = this.abortControllers.get(uploadId)
    if (abortController) {
      abortController.abort()

      const progress = this.activeUploads.get(uploadId)
      if (progress) {
        progress.status = 'cancelled'
      }

      this.activeUploads.delete(uploadId)
      this.abortControllers.delete(uploadId)

      // Update database
      client
        .patch(uploadId)
        .set({
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        })
        .commit()
        .catch(console.error)

      return true
    }
    return false
  }

  /**
   * Get upload progress
   */
  static getUploadProgress(uploadId: string): UploadProgress | undefined {
    return this.activeUploads.get(uploadId)
  }

  /**
   * Get all active uploads for a user
   */
  static getUserActiveUploads(userId: string): UploadProgress[] {
    return Array.from(this.activeUploads.values())
  }

  /**
   * Process uploaded file (thumbnails, metadata extraction, etc.)
   */
  static async processUploadedFile(
    uploadId: string,
    options: {
      generateThumbnails?: boolean
      extractMetadata?: boolean
      compressImages?: boolean
      virusScan?: boolean
    } = {}
  ): Promise<{ success: boolean; metadata?: any; error?: string }> {
    try {
      // Get upload record
      const uploadRecord = await client.fetch(
        `*[_type == "fileUpload" && _id == $uploadId][0]`,
        { uploadId }
      )

      if (!uploadRecord) {
        throw new Error('Upload record not found')
      }

      const metadata: any = { ...uploadRecord.metadata }

      // Extract metadata based on file type
      if (options.extractMetadata) {
        if (uploadRecord.mimeType.startsWith('image/')) {
          // For images, we could extract EXIF data, dimensions, etc.
          // This would require additional libraries like sharp or jimp
          metadata.type = 'image'
        } else if (uploadRecord.mimeType.startsWith('video/')) {
          metadata.type = 'video'
        } else if (uploadRecord.mimeType === 'application/zip') {
          metadata.type = 'archive'
        }
      }

      // Generate thumbnails for images
      if (options.generateThumbnails && uploadRecord.mimeType.startsWith('image/')) {
        // This would require image processing library
        metadata.thumbnailGenerated = true
      }

      // Virus scan (placeholder for integration with antivirus service)
      if (options.virusScan) {
        // Integrate with ClamAV or similar service
        metadata.virusScanResult = 'clean' // This would be the actual scan result
        metadata.scannedAt = new Date().toISOString()
      }

      // Update upload record with processed metadata
      await client
        .patch(uploadId)
        .set({
          status: 'completed',
          processedAt: new Date().toISOString(),
          metadata
        })
        .commit()

      return {
        success: true,
        metadata
      }

    } catch (error) {
      console.error('Error processing uploaded file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File processing failed'
      }
    }
  }

  /**
   * Get upload history for a user
   */
  static async getUserUploadHistory(
    userId: string,
    options: {
      limit?: number
      status?: string
      category?: string
    } = {}
  ): Promise<FileUpload[]> {
    try {
      let filter = `user._ref == "${userId}"`

      if (options.status) {
        filter += ` && status == "${options.status}"`
      }

      if (options.category) {
        filter += ` && category == "${options.category}"`
      }

      const uploads = await client.fetch(
        `*[_type == "fileUpload" && ${filter}] | order(uploadedAt desc) [0...${options.limit || 50}] {
          _id,
          fileName,
          originalName,
          fileSize,
          mimeType,
          fileKey,
          category,
          status,
          uploadedAt,
          processedAt,
          metadata,
          tags,
          "productTitle": product->title
        }`
      )

      return uploads || []
    } catch (error) {
      console.error('Error fetching upload history:', error)
      return []
    }
  }

  /**
   * Clean up incomplete or old uploads
   */
  static async cleanupUploads(olderThanHours: number = 24): Promise<{
    deletedUploads: number
    deletedFiles: number
    errors: string[]
  }> {
    const errors: string[] = []
    let deletedUploads = 0
    let deletedFiles = 0

    try {
      const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000))

      // Find incomplete uploads older than cutoff time
      const incompleteUploads = await client.fetch(
        `*[_type == "fileUpload" &&
           status in ["pending", "uploading", "error"] &&
           uploadedAt < $cutoffTime] {
          _id,
          fileKey,
          status
        }`,
        { cutoffTime: cutoffTime.toISOString() }
      )

      for (const upload of incompleteUploads) {
        try {
          // Delete file from S3 if it exists
          const deleteResult = await StorageService.deleteFile(upload.fileKey)
          if (deleteResult.success || deleteResult.error?.includes('not found')) {
            deletedFiles++
          } else {
            errors.push(`Failed to delete file ${upload.fileKey}: ${deleteResult.error}`)
          }

          // Delete upload record
          await client.delete(upload._id)
          deletedUploads++

        } catch (error) {
          errors.push(`Failed to cleanup upload ${upload._id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return { deletedUploads, deletedFiles, errors }

    } catch (error) {
      console.error('Error during upload cleanup:', error)
      return {
        deletedUploads,
        deletedFiles,
        errors: [`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Generate a unique upload ID
   */
  private static generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  /**
   * Sanitize file name for safe storage
   */
  private static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
  }

  /**
   * Calculate file checksum (simplified version)
   */
  private static async calculateChecksum(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.error('Error calculating checksum:', error)
      return 'unknown'
    }
  }
}
