import { NextRequest, NextResponse } from 'next/server'
import { DownloadTokenManager } from '@/lib/download/tokenManager'
import { StorageService } from '@/lib/storage/s3Client'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const { searchParams } = new URL(request.url)
    const fileKey = searchParams.get('file')
    const inline = searchParams.get('inline') === 'true'

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get client IP and user agent for validation
    const headersList = await headers()
    const userIP = headersList.get('x-forwarded-for') ||
                   headersList.get('x-real-ip') ||
                   'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Validate the download token
    const validation = await DownloadTokenManager.validateToken(
      token,
      userIP,
      userAgent
    )

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid token',
          details: validation.error,
          code: 'TOKEN_INVALID'
        },
        { status: 403 }
      )
    }

    const downloadToken = validation.token!

    // Determine which file to download
    let targetFileKey: string

    if (fileKey) {
      // Specific file requested - validate it's in the token's allowed files
      if (!downloadToken.fileKeys.includes(fileKey)) {
        return NextResponse.json(
          {
            error: 'File not authorized for this token',
            code: 'FILE_NOT_AUTHORIZED'
          },
          { status: 403 }
        )
      }
      targetFileKey = fileKey
    } else {
      // No specific file - if only one file, use it; otherwise require specification
      if (downloadToken.fileKeys.length === 1) {
        targetFileKey = downloadToken.fileKeys[0]
      } else {
        return NextResponse.json(
          {
            error: 'Multiple files available - specify file parameter',
            availableFiles: downloadToken.fileKeys,
            code: 'FILE_SELECTION_REQUIRED'
          },
          { status: 400 }
        )
      }
    }

    // Check if file exists in storage
    const fileExists = await StorageService.fileExists(targetFileKey)
    if (!fileExists) {
      return NextResponse.json(
        {
          error: 'File not found in storage',
          code: 'FILE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Get file metadata
    const fileMetadata = await StorageService.getFileMetadata(targetFileKey)

    // Record the download
    await DownloadTokenManager.recordDownload(
      downloadToken.id,
      targetFileKey,
      {
        userIP,
        userAgent,
        downloadedAt: new Date().toISOString(),
        fileSize: fileMetadata.size,
        contentType: fileMetadata.contentType
      }
    )

    // Generate secure download URL
    const fileName = targetFileKey.split('/').pop() || 'download'
    const contentDisposition = inline
      ? `inline; filename="${fileName}"`
      : `attachment; filename="${fileName}"`

    const downloadUrl = await StorageService.generateDownloadUrl(
      targetFileKey,
      {
        expiresIn: 300, // 5 minutes
        responseContentDisposition: contentDisposition,
        responseContentType: fileMetadata.contentType
      }
    )

    // Return the download information
    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName,
      fileSize: fileMetadata.size,
      contentType: fileMetadata.contentType,
      expiresIn: 300,
      remainingDownloads: validation.remainingDownloads! - 1,
      tokenId: downloadToken.id
    })

  } catch (error) {
    console.error('Error in secure download:', error)
    return NextResponse.json(
      {
        error: 'Download failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'DOWNLOAD_ERROR'
      },
      { status: 500 }
    )
  }
}

// Handle HEAD requests for file info without downloading
export async function HEAD(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const { searchParams } = new URL(request.url)
    const fileKey = searchParams.get('file')

    // Get client IP and user agent for validation
    const headersList = await headers()
    const userIP = headersList.get('x-forwarded-for') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Validate the download token (without recording download)
    const validation = await DownloadTokenManager.validateToken(
      token,
      userIP,
      userAgent
    )

    if (!validation.isValid) {
      return new NextResponse(null, { status: 403 })
    }

    const downloadToken = validation.token!

    // Determine target file
    let targetFileKey: string
    if (fileKey) {
      if (!downloadToken.fileKeys.includes(fileKey)) {
        return new NextResponse(null, { status: 403 })
      }
      targetFileKey = fileKey
    } else {
      if (downloadToken.fileKeys.length !== 1) {
        return new NextResponse(null, { status: 400 })
      }
      targetFileKey = downloadToken.fileKeys[0]
    }

    // Get file metadata
    const fileMetadata = await StorageService.getFileMetadata(targetFileKey)
    const fileName = targetFileKey.split('/').pop() || 'download'

    // Return headers with file information
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': fileMetadata.contentType,
        'Content-Length': fileMetadata.size.toString(),
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Last-Modified': fileMetadata.lastModified.toUTCString(),
        'X-File-Name': fileName,
        'X-File-Size': fileMetadata.size.toString(),
        'X-Remaining-Downloads': (validation.remainingDownloads! - 1).toString()
      }
    })

  } catch (error) {
    console.error('Error in HEAD request:', error)
    return new NextResponse(null, { status: 500 })
  }
}
