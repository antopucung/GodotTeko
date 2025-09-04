'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { MobileLicenseCard } from '@/components/dashboard/MobileLicenseCard'
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
  Download,
  Search,
  Filter,
  SortAsc,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Share
} from 'lucide-react'
import { cn } from '@/styles/component-variants'
import { toast } from 'sonner'

interface DownloadFilters {
  search: string
  status: 'all' | 'active' | 'expired' | 'suspended'
  licenseType: 'all' | 'basic' | 'extended' | 'access_pass'
  sortBy: 'newest' | 'oldest' | 'downloads' | 'alphabetical'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
}

export default function DownloadsPage() {
  const { data: session } = useSession()
  const [licenses, setLicenses] = useState<any[]>([])
  const [filteredLicenses, setFilteredLicenses] = useState<any[]>([])
  const [downloadHistory, setDownloadHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreLicenses, setHasMoreLicenses] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [filters, setFilters] = useState<DownloadFilters>({
    search: '',
    status: 'all',
    licenseType: 'all',
    sortBy: 'newest',
    dateRange: 'all'
  })
  const [activeTab, setActiveTab] = useState('licenses')

  const fetchLicenses = async (page = 1, resetData = false) => {
    try {
      if (resetData) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: filters.status,
        licenseType: filters.licenseType,
        sortBy: filters.sortBy
      })

      if (filters.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`/api/user/licenses?${params}`)
      if (!response.ok) throw new Error('Failed to fetch licenses')

      const data = await response.json()

      if (resetData || page === 1) {
        setLicenses(data.licenses)
        setStats(data.stats)
      } else {
        setLicenses(prev => [...prev, ...data.licenses])
      }

      setHasMoreLicenses(data.pagination.hasNextPage)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching licenses:', error)
      toast.error('Failed to load licenses')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const fetchDownloadHistory = async () => {
    try {
      const response = await fetch('/api/user/download-history?limit=20')
      if (!response.ok) throw new Error('Failed to fetch download history')

      const data = await response.json()
      setDownloadHistory(data.downloadHistory || [])
    } catch (error) {
      console.error('Error fetching download history:', error)
    }
  }

  useEffect(() => {
    fetchLicenses(1, true)
    if (activeTab === 'history') {
      fetchDownloadHistory()
    }
  }, [filters, activeTab])

  // Apply client-side filtering for search
  useEffect(() => {
    let filtered = [...licenses]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(license =>
        license.product.title.toLowerCase().includes(searchLower) ||
        license.licenseKey.toLowerCase().includes(searchLower)
      )
    }

    setFilteredLicenses(filtered)
  }, [licenses, filters.search])

  const handleDownload = async (licenseId: string) => {
    try {
      toast.loading('Preparing download...', { id: 'download' })

      const response = await fetch(`/api/download/smart/${licenseId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Download failed')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download.zip'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download completed!', { id: 'download' })

      // Refresh licenses to update download count
      fetchLicenses(1, true)
    } catch (error) {
      console.error('Download error:', error)
      toast.error(error instanceof Error ? error.message : 'Download failed', { id: 'download' })
    }
  }

  const handleShare = (license: any) => {
    if (navigator.share) {
      navigator.share({
        title: license.product.title,
        text: `Check out this design: ${license.product.title}`,
        url: `/products/${license.product.slug.current}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/products/${license.product.slug.current}`)
      toast.success('Product link copied to clipboard!')
    }
  }

  const handleViewDetails = (license: any) => {
    // Navigate to license details or open modal
    toast.info('License details feature coming soon!')
  }

  const loadMore = () => {
    if (!isLoadingMore && hasMoreLicenses) {
      fetchLicenses(currentPage + 1, false)
    }
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      licenseType: 'all',
      sortBy: 'newest',
      dateRange: 'all'
    })
  }

  const getStatusStats = () => {
    if (!stats) return null

    return {
      total: stats.totalLicenses,
      active: stats.activeLicenses,
      expired: licenses.filter(l => l.status === 'expired').length,
      suspended: licenses.filter(l => l.status === 'suspended').length
    }
  }

  const statusStats = getStatusStats()

  return (
    <DashboardLayout title="Downloads & Licenses" subtitle="Manage your digital assets">
      <div className="space-y-6">
        {/* Mobile-first stats overview */}
        {statusStats && (
          <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Total</p>
                    <p className="mobile-title">{statusStats.total}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Active</p>
                    <p className="mobile-title text-green-600">{statusStats.active}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Downloads</p>
                    <p className="mobile-title">{stats.totalDownloads}</p>
                  </div>
                  <Download className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">Issues</p>
                    <p className="mobile-title text-orange-600">
                      {statusStats.expired + statusStats.suspended}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mobile-optimized tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger
              value="licenses"
              className="mobile-button py-3 data-[state=active]:bg-white"
            >
              <Package className="w-4 h-4 mr-2" />
              <span>Licenses</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="mobile-button py-3 data-[state=active]:bg-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="licenses" className="space-y-4">
            {/* Mobile-first search and filters */}
            <Card className="mobile-card">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search licenses or products..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="mobile-input pl-10"
                    />
                  </div>

                  {/* Mobile filter row */}
                  <div className="mobile-grid mobile-grid-2">
                    <Select
                      value={filters.status}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="mobile-input">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.licenseType}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, licenseType: value }))}
                    >
                      <SelectTrigger className="mobile-input">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="extended">Extended</SelectItem>
                        <SelectItem value="access_pass">Access Pass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mobile-grid mobile-grid-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger className="mobile-input">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="downloads">Most Downloads</SelectItem>
                        <SelectItem value="alphabetical">A-Z</SelectItem>
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

                  {/* Active filters */}
                  {(filters.search || filters.status !== 'all' || filters.licenseType !== 'all') && (
                    <div className="flex flex-wrap gap-2">
                      {filters.search && (
                        <Badge variant="secondary" className="text-xs">
                          Search: "{filters.search}"
                        </Badge>
                      )}
                      {filters.status !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {filters.status}
                        </Badge>
                      )}
                      {filters.licenseType !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Type: {filters.licenseType}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* License cards */}
            <div className="space-y-4">
              {isLoading ? (
                // Mobile loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="mobile-card">
                    <CardContent className="pt-6">
                      <div className="animate-pulse space-y-4">
                        <div className="flex gap-3">
                          <div className="mobile-skeleton w-16 h-16 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="mobile-skeleton-title"></div>
                            <div className="mobile-skeleton-text"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredLicenses.length > 0 ? (
                <>
                  {filteredLicenses.map((license) => (
                    <MobileLicenseCard
                      key={license._id}
                      license={license}
                      onDownload={handleDownload}
                      onShare={handleShare}
                      onViewDetails={handleViewDetails}
                    />
                  ))}

                  {/* Load More Button */}
                  {hasMoreLicenses && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        className="mobile-button w-full"
                      >
                        {isLoadingMore ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Loading...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <MoreHorizontal className="w-4 h-4" />
                            Load More
                          </div>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="mobile-card">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="mobile-subtitle mb-2">No licenses found</h3>
                      <p className="mobile-body text-gray-600 mb-4">
                        {filters.search || filters.status !== 'all' || filters.licenseType !== 'all'
                          ? 'Try adjusting your filters'
                          : 'You haven\'t purchased any products yet'}
                      </p>
                      <Button asChild>
                        <Link href="/products">Browse Products</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="mobile-subtitle">Download History</CardTitle>
                <CardDescription>
                  Track all your downloads and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {downloadHistory.length > 0 ? (
                  <div className="space-y-3">
                    {downloadHistory.map((download) => (
                      <div key={download.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Download className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="mobile-body font-medium line-clamp-1">
                            {download.productTitle}
                          </p>
                          <p className="mobile-caption">
                            {new Date(download.downloadedAt).toLocaleDateString()} via {download.type}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {download.type === 'license' ? 'License' : 'Access Pass'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="mobile-subtitle mb-2">No download history</h3>
                    <p className="mobile-body text-gray-600">
                      Your download activity will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
