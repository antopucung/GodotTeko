'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  File,
  Image,
  Video,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Camera,
  Folder,
  Smartphone
} from 'lucide-react'
import { cn } from '@/styles/component-variants'
import { toast } from 'sonner'

interface FileUpload {
  id: string
  file: File
  title: string
  description: string
  category: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  result?: any
}

interface FileUploadZoneProps {
  productId?: string
  onUploadComplete?: (assets: any[]) => void
  maxFiles?: number
  allowedCategories?: string[]
}

const fileCategories = [
  { value: 'design', label: 'Design Files', icon: Image, description: 'JPG, PNG, SVG, PDF' },
  { value: 'source', label: 'Source Files', icon: Folder, description: 'ZIP, RAR, 7Z, TXT' },
  { value: 'video', label: 'Video Files', icon: Video, description: 'MP4, WebM, MOV' },
  { value: 'document', label: 'Documents', icon: FileText, description: 'PDF, TXT, MD, DOC' }
]

const maxFileSize = 50 * 1024 * 1024 // 50MB

export function FileUploadZone({
  productId,
  onUploadComplete,
  maxFiles = 10,
  allowedCategories = ['design', 'source', 'video', 'document']
}: FileUploadZoneProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const uploadCounter = useRef(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: FileUpload[] = acceptedFiles.map(file => ({
      id: `upload-${uploadCounter.current++}`,
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: '',
      category: detectFileCategory(file.type),
      progress: 0,
      status: 'pending'
    }))

    setUploads(prev => [...prev, ...newUploads].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: maxFiles - uploads.length,
    maxSize: maxFileSize,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.svg', '.webp'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/quicktime': ['.mov']
    },
    disabled: isUploading || uploads.length >= maxFiles
  })

  function detectFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') return 'design'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'document'
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'source'
    return 'design'
  }

  const updateUpload = (id: string, updates: Partial<FileUpload>) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id ? { ...upload, ...updates } : upload
    ))
  }

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id))
  }

  const uploadFile = async (upload: FileUpload) => {
    const formData = new FormData()
    formData.append('file', upload.file)
    formData.append('title', upload.title)
    formData.append('description', upload.description)
    formData.append('category', upload.category)
    if (productId) {
      formData.append('productId', productId)
    }

    updateUpload(upload.id, { status: 'uploading', progress: 0 })

    try {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          updateUpload(upload.id, { progress })
        }
      })

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, { status: xhr.status }))
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`))
          }
        }
        xhr.onerror = () => reject(new Error('Upload failed'))

        xhr.open('POST', '/api/partner/upload')
        xhr.send(formData)
      })

      const result = await response.json()

      if (result.success) {
        updateUpload(upload.id, {
          status: 'success',
          progress: 100,
          result: result.asset
        })
        toast.success(`${upload.title} uploaded successfully!`)
        return result.asset
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      updateUpload(upload.id, {
        status: 'error',
        error: errorMessage
      })
      toast.error(`Failed to upload ${upload.title}: ${errorMessage}`)
      throw error
    }
  }

  const startUpload = async () => {
    if (uploads.length === 0) return

    setIsUploading(true)
    const pendingUploads = uploads.filter(u => u.status === 'pending')
    const results: any[] = []

    try {
      // Upload files one by one for better progress tracking
      for (const upload of pendingUploads) {
        try {
          const result = await uploadFile(upload)
          results.push(result)
        } catch (error) {
          // Continue with other uploads even if one fails
          console.error(`Upload failed for ${upload.title}:`, error)
        }
      }

      if (results.length > 0) {
        onUploadComplete?.(results)
        toast.success(`Successfully uploaded ${results.length} file(s)!`)
      }

      // Remove successful uploads after a delay
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.status !== 'success'))
      }, 3000)

    } finally {
      setIsUploading(false)
    }
  }

  const clearAll = () => {
    setUploads([])
  }

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'uploading': return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default: return <File className="w-4 h-4 text-gray-400" />
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryData = fileCategories.find(c => c.value === category)
    const Icon = categoryData?.icon || File
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="mobile-card">
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-all duration-200",
              "touch-target min-h-[200px] flex flex-col items-center justify-center",
              isDragActive && !isDragReject && "border-blue-500 bg-blue-50",
              isDragReject && "border-red-500 bg-red-50",
              !isDragActive && "border-gray-300 hover:border-gray-400",
              (isUploading || uploads.length >= maxFiles) && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />

            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center">
                {isDragActive ? (
                  <Upload className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                ) : (
                  <Camera className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="mobile-subtitle">
                  {isDragActive ? (
                    isDragReject ? 'File type not supported' : 'Drop files here'
                  ) : (
                    <>
                      <span className="mobile-only">Tap to upload files</span>
                      <span className="desktop-only">Drag & drop files or click to browse</span>
                    </>
                  )}
                </h3>

                <p className="mobile-caption text-gray-500">
                  {uploads.length >= maxFiles ? (
                    `Maximum ${maxFiles} files reached`
                  ) : (
                    `Upload up to ${maxFiles - uploads.length} more files • Max 50MB each`
                  )}
                </p>
              </div>

              {/* Mobile-friendly category info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {fileCategories
                  .filter(cat => allowedCategories.includes(cat.value))
                  .map((category) => (
                  <div key={category.value} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="flex justify-center mb-1">
                      <category.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">{category.label}</p>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploads.length > 0 && (
        <Card className="mobile-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="mobile-subtitle">Files to Upload ({uploads.length})</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={isUploading}
                  className="mobile-button"
                >
                  Clear All
                </Button>
                <Button
                  onClick={startUpload}
                  disabled={isUploading || uploads.every(u => u.status !== 'pending')}
                  className="mobile-button-primary"
                  size="sm"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload All</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(upload.status)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      {/* File info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="mobile-body font-medium truncate">{upload.file.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(upload.category)}
                            <span className="ml-1">{upload.category}</span>
                          </Badge>
                        </div>
                        <p className="mobile-caption text-gray-500">
                          {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      {/* Editable fields */}
                      <div className="space-y-3">
                        <div>
                          <Input
                            placeholder="File title"
                            value={upload.title}
                            onChange={(e) => updateUpload(upload.id, { title: e.target.value })}
                            disabled={upload.status === 'uploading'}
                            className="mobile-input"
                          />
                        </div>

                        <div className="mobile-grid mobile-grid-2">
                          <Textarea
                            placeholder="Description (optional)"
                            value={upload.description}
                            onChange={(e) => updateUpload(upload.id, { description: e.target.value })}
                            disabled={upload.status === 'uploading'}
                            className="mobile-input resize-none"
                            rows={2}
                          />

                          <Select
                            value={upload.category}
                            onValueChange={(value) => updateUpload(upload.id, { category: value })}
                            disabled={upload.status === 'uploading'}
                          >
                            <SelectTrigger className="mobile-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fileCategories
                                .filter(cat => allowedCategories.includes(cat.value))
                                .map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-2">
                                    <category.icon className="w-4 h-4" />
                                    {category.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Progress */}
                      {upload.status === 'uploading' && (
                        <div className="space-y-2">
                          <Progress value={upload.progress} className="h-2" />
                          <p className="text-xs text-gray-500">
                            Uploading... {upload.progress}%
                          </p>
                        </div>
                      )}

                      {/* Error message */}
                      {upload.status === 'error' && upload.error && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {upload.error}
                        </div>
                      )}

                      {/* Success message */}
                      {upload.status === 'success' && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                          File uploaded successfully!
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(upload.id)}
                      disabled={upload.status === 'uploading'}
                      className="touch-target w-8 h-8 p-0 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
