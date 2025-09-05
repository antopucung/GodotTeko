'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  Eye,
  Calendar,
  Key,
  FileText,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface License {
  _id: string
  licenseKey: string
  licenseType: string
  status: string
  downloadCount: number
  downloadLimit?: number
  lastDownloadAt?: string
  issuedAt: string
  expiresAt?: string
  product: {
    _id: string
    title: string
    slug: { current: string }
    image?: string
    freebie: boolean
  }
  order: {
    _id: string
    orderNumber: string
    total: number
  }
  metadata?: {
    purchasePrice: number
    currency: string
  }
}

interface LicensesTabProps {
  onStatsUpdate: () => void
}

export function LicensesTab({ onStatsUpdate }: LicensesTabProps) {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  })

  useEffect(() => {
    fetchLicenses()
  }, [filter, pagination.currentPage])

  const fetchLicenses = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filter !== 'all' && { status: filter })
      })

      const response = await fetch(`/api/user/licenses?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLicenses(data.licenses || [])
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0
        })
      }
    } catch (error) {
      console.error('Error fetching licenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (license: License) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(license._id))

      // First get the secure download URL
      const response = await fetch(`/api/download/${license.product._id}`)

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to generate download URL')
        return
      }

      const downloadData = await response.json()

      if (!downloadData.canDownload) {
        alert(downloadData.error || 'Download not allowed')
        return
      }

      // Use the secure download URL
      const downloadResponse = await fetch(downloadData.downloadUrl)

      if (downloadResponse.ok) {
        // For demo purposes, we'll show the download info
        // In production, this would be an actual file download
        const downloadInfo = await downloadResponse.json()

        if (downloadInfo.demoNote) {
          // This is a demo response
          alert(`✅ Download initiated successfully!\n\n${downloadInfo.demoNote}\n\nFiles: ${downloadInfo.files.map((f: any) => f.name).join(', ')}`)
        } else {
          // Handle actual file download
          const blob = await downloadResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${license.product.title}.zip`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }

        // Refresh licenses to update download count
        fetchLicenses(pagination.currentPage)
        onStatsUpdate()
      } else {
        const error = await downloadResponse.json()
        alert(error.error || 'Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(license._id)
        return newSet
      })
    }
  }

  const getLicenseStatus = (license: License) => {
    if (license.status !== 'active') return license.status
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) return 'expired'
    return 'active'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Licenses</h2>
          <p className="text-gray-600">
            {pagination.totalCount} license{pagination.totalCount !== 1 ? 's' : ''} purchased
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {['all', 'active', 'expired'].map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter(filterOption as any)
                setPagination(prev => ({ ...prev, currentPage: 1 }))
              }}
              className="capitalize"
            >
              {filterOption}
            </Button>
          ))}
        </div>
      </div>

      {/* Licenses List */}
      {licenses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No licenses found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't purchased any products yet."
                : `No ${filter} licenses found.`
              }
            </p>
            <Button asChild>
              <Link href="/">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {licenses.map((license) => {
            const status = getLicenseStatus(license)
            const isDownloading = downloadingIds.has(license._id)
            const canDownload = status === 'active' && (!license.downloadLimit || license.downloadCount < license.downloadLimit)

            return (
              <Card key={license._id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {license.product.image ? (
                          <Image
                            src={license.product.image}
                            alt={license.product.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* License Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {license.product.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            License: {license.licenseKey}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(status)}
                          <Badge variant="outline" className="capitalize">
                            {license.licenseType}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Purchased {formatDate(license.issuedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="w-4 h-4" />
                          <span>
                            {license.downloadCount} download{license.downloadCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>Order #{license.order.orderNumber}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>
                            {license.metadata?.purchasePrice
                              ? formatPrice(license.metadata.purchasePrice, license.metadata.currency)
                              : formatPrice(license.order.total)
                            }
                          </span>
                        </div>
                      </div>

                      {/* Download Limits Warning */}
                      {license.downloadLimit && license.downloadCount >= license.downloadLimit && (
                        <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            Download limit reached ({license.downloadLimit} downloads)
                          </span>
                        </div>
                      )}

                      {/* Expiry Warning */}
                      {license.expiresAt && status === 'active' && (
                        <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            Expires on {formatDate(license.expiresAt)}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-3">
                        <Button
                          onClick={() => handleDownload(license)}
                          disabled={!canDownload || isDownloading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {isDownloading ? 'Downloading...' : 'Download'}
                        </Button>

                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/products/${license.product.slug.current}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Product
                          </Link>
                        </Button>

                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/user/orders/${license.order._id}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Order
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} licenses
          </p>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === 1}
              onClick={() => {
                setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))
                fetchLicenses(pagination.currentPage - 1)
              }}
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => {
                setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))
                fetchLicenses(pagination.currentPage + 1)
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
