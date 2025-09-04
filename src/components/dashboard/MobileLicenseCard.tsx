'use client'

import { useState } from 'react'
import { cn } from '@/styles/component-variants'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Download,
  Calendar,
  Package,
  ExternalLink,
  MoreVertical,
  Check,
  Clock,
  AlertTriangle,
  Infinity,
  ChevronRight,
  Share,
  Eye
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface MobileLicenseCardProps {
  license: {
    _id: string
    licenseKey: string
    licenseType: 'basic' | 'extended' | 'access_pass'
    status: 'active' | 'suspended' | 'expired' | 'revoked'
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
      categories?: Array<{ name: string; slug: { current: string } }>
    }
    order: {
      _id: string
      orderNumber: string
      total?: number
    }
    metadata: {
      purchasePrice: number
      currency: string
    }
  }
  onDownload?: (licenseId: string) => void
  onShare?: (license: any) => void
  onViewDetails?: (license: any) => void
}

export function MobileLicenseCard({
  license,
  onDownload,
  onShare,
  onViewDetails
}: MobileLicenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (onDownload && !isDownloading) {
      setIsDownloading(true)
      try {
        await onDownload(license._id)
      } finally {
        setIsDownloading(false)
      }
    }
  }

  const getStatusInfo = () => {
    switch (license.status) {
      case 'active':
        return {
          icon: Check,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Active'
        }
      case 'expired':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          label: 'Expired'
        }
      case 'suspended':
      case 'revoked':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: license.status === 'suspended' ? 'Suspended' : 'Revoked'
        }
      default:
        return {
          icon: Package,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Unknown'
        }
    }
  }

  const getLicenseTypeInfo = () => {
    switch (license.licenseType) {
      case 'extended':
        return { label: 'Extended', color: 'bg-purple-100 text-purple-800 border-purple-200' }
      case 'access_pass':
        return { label: 'Access Pass', color: 'bg-blue-100 text-blue-800 border-blue-200' }
      default:
        return { label: 'Basic', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
  }

  const getDownloadProgress = () => {
    if (!license.downloadLimit) return 100 // Unlimited
    return Math.min((license.downloadCount / license.downloadLimit) * 100, 100)
  }

  const canDownload = license.status === 'active' &&
    (!license.downloadLimit || license.downloadCount < license.downloadLimit) &&
    (!license.expiresAt || new Date(license.expiresAt) > new Date())

  const statusInfo = getStatusInfo()
  const licenseTypeInfo = getLicenseTypeInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Card className={cn(
      "mobile-card transition-all duration-200 hover:shadow-md active:scale-[0.98]",
      statusInfo.border,
      statusInfo.bg
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Product Image */}
          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {license.product.image ? (
              <Image
                src={license.product.image}
                alt={license.product.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="mobile-subtitle line-clamp-2 pr-2">
                {license.product.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="touch-target w-8 h-8 p-0 flex-shrink-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs", licenseTypeInfo.color)}>
                {licenseTypeInfo.label}
              </Badge>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                statusInfo.bg,
                statusInfo.color
              )}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusInfo.label}</span>
              </div>
            </div>

            {/* Download Progress */}
            {license.downloadLimit && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Downloads</span>
                  <span>{license.downloadCount}/{license.downloadLimit}</span>
                </div>
                <Progress value={getDownloadProgress()} className="h-1.5" />
              </div>
            )}

            {!license.downloadLimit && license.licenseType === 'access_pass' && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Infinity className="w-3 h-3" />
                <span>Unlimited downloads</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleDownload}
            disabled={!canDownload || isDownloading}
            className="mobile-button-primary flex-1"
            size="sm"
          >
            {isDownloading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Downloading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="text-xs">Download</span>
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="touch-target"
            onClick={() => onViewDetails?.(license)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="touch-target"
            onClick={() => onShare?.(license)}
          >
            <Share className="w-4 h-4" />
          </Button>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t mobile-fade-in">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">License Key</span>
                <p className="font-mono mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                  {license.licenseKey}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Order</span>
                <p className="font-medium mt-1">#{license.order.orderNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Purchased</span>
                <p className="mt-1">
                  {formatDistanceToNow(new Date(license.issuedAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Price</span>
                <p className="font-medium mt-1">
                  ${license.metadata.purchasePrice.toFixed(2)}
                </p>
              </div>
            </div>

            {license.lastDownloadAt && (
              <div>
                <span className="text-gray-500 text-xs">Last Download</span>
                <p className="text-xs mt-1">
                  {formatDistanceToNow(new Date(license.lastDownloadAt), { addSuffix: true })}
                </p>
              </div>
            )}

            {license.expiresAt && (
              <div>
                <span className="text-gray-500 text-xs">Expires</span>
                <p className="text-xs mt-1">
                  {formatDistanceToNow(new Date(license.expiresAt), { addSuffix: true })}
                </p>
              </div>
            )}

            {/* Categories */}
            {license.product.categories && license.product.categories.length > 0 && (
              <div>
                <span className="text-gray-500 text-xs">Categories</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {license.product.categories.map((category) => (
                    <Badge key={category.slug.current} variant="outline" className="text-xs">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Product Link */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mobile-button justify-between"
              asChild
            >
              <Link href={`/products/${license.product.slug.current}`}>
                <span>View Product</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Warning Messages */}
        {!canDownload && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-700 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              {license.status !== 'active' ? `License is ${license.status}` :
               license.downloadLimit && license.downloadCount >= license.downloadLimit ? 'Download limit reached' :
               'License has expired'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
