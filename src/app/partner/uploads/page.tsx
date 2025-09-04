'use client'

import { useState, useEffect } from 'react'
import PartnerLayout from '../layout'
import { FileUploadZone } from '@/components/partner/FileUploadZone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Upload,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  ImageIcon,
  Video,
  FileText,
  Folder,
  MoreHorizontal,
  Calendar,
  HardDrive,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/styles/component-variants'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface PartnerAsset {
  _id: string
  title: string
  description: string
  category: string
  fileType: string
  originalFilename: string
  fileSize: number
  uploadedAt: string
  status: string
  url: string
  assetId: string
  product?: {
    _id: string
    title: string
    slug: { current: string }
  }
}

interface AssetFilters {
  search: string
  category: string
  productId: string
}

const categoryIcons = {
  design: ImageIcon,
  source: Folder,
  video: Video,
  document: FileText
}

export default function UploadsPage() {
  const [assets, setAssets] = useState<PartnerAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [filters, setFilters] = useState<AssetFilters>({
    search: '',
    category: 'all',
    productId: 'all'
  })
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMoreAssets, setHasMoreAssets] = useState(false)

  const fetchAssets = async (page = 1, resetData = false) => {
    try {
      if (resetData) {
        setIsLoading(true)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        category: filters.category,
        productId: filters.productId
      })

      if (filters.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`/api/partner/upload?${params}`)
      if (!response.ok) throw new Error('Failed to fetch assets')

      const data = await response.json()

      if (resetData || page === 1) {
        setAssets(data.assets)
        setStats(data.stats)
      } else {
        setAssets(prev => [...prev, ...data.assets])
      }

      setTotalCount(data.pagination.totalCount)
      setHasMoreAssets(data.pagination.hasNextPage)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching assets:', error)
      toast.error('Failed to load assets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets(1, true)
  }, [filters])

  const handleUploadComplete = (newAssets: any[]) => {
    // Refresh the asset list
    fetchAssets(1, true)
    toast.success(`Successfully uploaded ${newAssets.length} file(s)!`)
  }

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const response = await fetch('/api/partner/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId })
      })

      if (!response.ok) throw new Error('Failed to delete asset')

      setAssets(prev => prev.filter(asset => asset._id !== assetId))
      setSelectedAssets(prev => {
        const newSet = new Set(prev)
        newSet.delete(assetId)
        return newSet
      })

      toast.success('Asset deleted successfully')
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast.error('Failed to delete asset')
    }
  }

  const handleBulkDelete = async () => {
    const assetsToDelete = Array.from(selectedAssets)

    try {
      await Promise.all(
        assetsToDelete.map(assetId =>
          fetch('/api/partner/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId })
          })
        )
      )

      setAssets(prev => prev.filter(asset => !selectedAssets.has(asset._id)))
      setSelectedAssets(new Set())
      toast.success(`Deleted ${assetsToDelete.length} asset(s)`)
    } catch (error) {
      console.error('Error bulk deleting assets:', error)
      toast.error('Failed to delete assets')
    }
  }

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assetId)) {
        newSet.delete(assetId)
      } else {
        newSet.add(assetId)
      }
      return newSet
    })
  }

  const selectAllAssets = () => {
    if (selectedAssets.size === assets.length) {
      setSelectedAssets(new Set())
    } else {
      setSelectedAssets(new Set(assets.map(asset => asset._id)))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      productId: 'all'
    })
  }

  return (
    <PartnerLayout title="File Manager" subtitle="Upload and manage your design assets">
      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Total Files</p>
                    <p className="mobile-title">{stats.totalFiles}</p>
                  </div>
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Storage Used</p>
                    <p className="mobile-title text-sm md:text-lg">
                      {formatFileSize(stats.totalSize)}
                    </p>
                  </div>
                  <HardDrive className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Design Files</p>
                    <p className="mobile-title">{stats.byCategory.design}</p>
                  </div>
                  <ImageIcon className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Source Files</p>
                    <p className="mobile-title">{stats.byCategory.source}</p>
                  </div>
                  <Folder className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload and Library Tabs */}
        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger
              value="upload"
              className="mobile-button py-3 data-[state=active]:bg-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span>Upload Files</span>
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="mobile-button py-3 data-[state=active]:bg-white"
            >
              <Folder className="w-4 h-4 mr-2" />
              <span>Asset Library</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <FileUploadZone
              onUploadComplete={handleUploadComplete}
              maxFiles={10}
              allowedCategories={['design', 'source', 'video', 'document']}
            />

            {/* Upload Tips */}
            <Card className="mobile-card border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <h3 className="mobile-subtitle text-blue-900 mb-3">Upload Tips</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="space-y-2">
                    <p>• <strong>Design Files:</strong> High-quality images, vectors, PDFs</p>
                    <p>• <strong>Source Files:</strong> Original design files (ZIP/RAR)</p>
                  </div>
                  <div className="space-y-2">
                    <p>• <strong>Max File Size:</strong> 50MB per file</p>
                    <p>• <strong>Batch Upload:</strong> Up to 10 files at once</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            {/* Search and Filters */}
            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search assets..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="mobile-input pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="mobile-grid mobile-grid-2">
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="mobile-input">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="design">Design Files</SelectItem>
                        <SelectItem value="source">Source Files</SelectItem>
                        <SelectItem value="video">Video Files</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="mobile-button"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>

                  {/* Bulk Actions */}
                  {selectedAssets.size > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="mobile-body font-medium text-blue-900">
                        {selectedAssets.size} asset(s) selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAssets(new Set())}
                          className="mobile-button"
                        >
                          Clear
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="mobile-button"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Assets</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {selectedAssets.size} asset(s)?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleBulkDelete}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asset Grid */}
            {isLoading ? (
              <div className="mobile-grid md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="mobile-card">
                    <div className="animate-pulse">
                      <div className="mobile-skeleton aspect-square rounded-t-lg"></div>
                      <div className="p-4 space-y-3">
                        <div className="mobile-skeleton-title"></div>
                        <div className="mobile-skeleton-text"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : assets.length > 0 ? (
              <>
                {/* Select All */}
                <div className="flex items-center justify-between">
                  <p className="mobile-body text-gray-600">
                    Showing {assets.length} of {totalCount} assets
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllAssets}
                    className="mobile-button"
                  >
                    {selectedAssets.size === assets.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="mobile-grid md:grid-cols-2 lg:grid-cols-3">
                  {assets.map((asset) => {
                    const CategoryIcon = categoryIcons[asset.category as keyof typeof categoryIcons] || FileText
                    const isSelected = selectedAssets.has(asset._id)

                    return (
                      <Card
                        key={asset._id}
                        className={cn(
                          "mobile-card hover:shadow-md transition-all duration-200 cursor-pointer",
                          isSelected && "ring-2 ring-blue-500"
                        )}
                        onClick={() => toggleAssetSelection(asset._id)}
                      >
                        <div className="aspect-square relative bg-gray-100 rounded-t-lg overflow-hidden">
                          {asset.category === 'design' && asset.url ? (
                            <Image
                              src={asset.url}
                              alt={asset.title}
                              width={200}
                              height={200}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <CategoryIcon className="w-16 h-16 text-gray-400" />
                            </div>
                          )}

                          {/* Selection indicator */}
                          <div className={cn(
                            "absolute top-2 left-2 w-6 h-6 rounded-full border-2 transition-all",
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-300"
                          )}>
                            {isSelected && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>

                          {/* Category badge */}
                          <Badge
                            className={cn(
                              "absolute top-2 right-2 text-xs",
                              asset.category === 'design' && "bg-purple-100 text-purple-800",
                              asset.category === 'source' && "bg-orange-100 text-orange-800",
                              asset.category === 'video' && "bg-blue-100 text-blue-800",
                              asset.category === 'document' && "bg-green-100 text-green-800"
                            )}
                          >
                            {asset.category}
                          </Badge>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="mobile-body font-semibold line-clamp-1">{asset.title}</h3>
                            <p className="mobile-caption text-gray-500 line-clamp-1">
                              {asset.originalFilename}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="mobile-caption text-gray-500">
                              {formatFileSize(asset.fileSize)}
                            </span>
                            <span className="mobile-caption text-gray-500">
                              {formatDistanceToNow(new Date(asset.uploadedAt), { addSuffix: true })}
                            </span>
                          </div>

                          {asset.product && (
                            <div className="p-2 bg-gray-50 rounded text-xs">
                              <span className="text-gray-600">Used in: </span>
                              <Link
                                href={`/partner/products/${asset.product._id}`}
                                className="text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {asset.product.title}
                              </Link>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 mobile-button text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(asset.url, '_blank')
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 mobile-button text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                const link = document.createElement('a')
                                link.href = asset.url
                                link.download = asset.originalFilename
                                link.click()
                              }}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="touch-target w-8 h-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{asset.title}"?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAsset(asset._id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {/* Load More */}
                {hasMoreAssets && (
                  <div className="text-center">
                    <Button
                      onClick={() => fetchAssets(currentPage + 1, false)}
                      variant="outline"
                      className="mobile-button"
                    >
                      Load More Assets
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="mobile-card">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="mobile-subtitle mb-2">No assets found</h3>
                    <p className="mobile-body text-gray-600 mb-6">
                      {filters.search || filters.category !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Upload your first design assets to get started'}
                    </p>
                    <Button onClick={() => resetFilters()}>
                      {filters.search || filters.category !== 'all'
                        ? 'Clear Filters'
                        : 'Upload Files'
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  )
}
