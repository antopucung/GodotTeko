'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Award,
  Star,
  Filter,
  Search
} from 'lucide-react'
import { cn } from '@/styles/component-variants'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface PartnerApplication {
  _id: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'on_hold'
  score: number
  autoApproved: boolean
  submittedAt: string
  reviewedAt?: string
  approvedAt?: string
  rejectedAt?: string
  reviewedBy?: string
  personalInfo: {
    fullName: string
    email: string
    phone?: string
    location: string
    website?: string
    portfolio: string
  }
  professional: {
    experience: string
    specialties: string[]
    previousWork?: string
    teamSize?: string
    yearsActive?: number
  }
  business: {
    businessType: string
    expectedRevenue: string
    targetAudience?: string
    marketingStrategy?: string
  }
  technical: {
    designTools: string[]
    fileFormats: string[]
    qualityStandards: boolean
    originalWork: boolean
    licensing: boolean
  }
  reviewNotes?: string
  rejectionReason?: string
  feedback?: string
  flagged?: boolean
  priority?: string
}

export default function PartnerApplicationsPage() {
  const [applications, setApplications] = useState<PartnerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [feedback, setFeedback] = useState('')
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [filter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/partner-applications?${params}`)
      const data = await response.json()

      if (response.ok) {
        setApplications(data.applications || [])
      } else {
        toast.error(data.error || 'Failed to fetch applications')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationAction = async (
    applicationId: string,
    action: 'approve' | 'reject' | 'hold',
    notes?: string,
    feedback?: string
  ) => {
    try {
      setProcessingAction(action)

      const response = await fetch(`/api/admin/partner-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewNotes: notes,
          feedback
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || `Application ${action}d successfully`)
        setSelectedApplication(null)
        fetchApplications()
      } else {
        toast.error(result.error || `Failed to ${action} application`)
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error)
      toast.error(`Failed to ${action} application`)
    } finally {
      setProcessingAction(null)
    }
  }

  const getStatusBadge = (status: string, autoApproved?: boolean) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: Eye },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      on_hold: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config?.icon || Clock

    return (
      <div className="flex items-center gap-1">
        <Badge className={cn(config?.color)}>
          <Icon className="w-3 h-3 mr-1" />
          {status.replace('_', ' ')}
        </Badge>
        {autoApproved && (
          <Badge variant="outline" className="text-xs">
            Auto
          </Badge>
        )}
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredApplications = applications.filter(app =>
    app.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout title="Partner Applications" subtitle="Review and manage partner applications">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchApplications}>
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
          {[
            { label: 'Pending', count: applications.filter(a => a.status === 'pending').length, color: 'yellow' },
            { label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length, color: 'blue' },
            { label: 'Approved', count: applications.filter(a => a.status === 'approved').length, color: 'green' },
            { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'red' }
          ].map((stat) => (
            <Card key={stat.label} className="mobile-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mobile-caption font-medium">{stat.label}</p>
                    <p className="mobile-title">{stat.count}</p>
                  </div>
                  <Users className={`w-8 h-8 text-${stat.color}-600`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Applications List */}
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                <p className="text-gray-600">
                  {filter === 'all' ? 'No partner applications have been submitted yet.' : `No ${filter} applications found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div
                    key={application._id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{application.personalInfo.fullName}</h3>
                          {getStatusBadge(application.status, application.autoApproved)}
                          <Badge variant="outline" className={getScoreColor(application.score)}>
                            Score: {application.score}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {application.personalInfo.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {application.personalInfo.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {application.professional.experience}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Submitted {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}</span>
                          <span>{application.professional.specialties.slice(0, 3).join(', ')}</span>
                          {application.professional.specialties.length > 3 && (
                            <span>+{application.professional.specialties.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(application.personalInfo.portfolio, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Portfolio
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Review - {application.personalInfo.fullName}</DialogTitle>
                              <DialogDescription>
                                Review and manage this partner application
                              </DialogDescription>
                            </DialogHeader>

                            {selectedApplication && (
                              <div className="space-y-6">
                                {/* Application Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Personal Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                                        <p>{selectedApplication.personalInfo.fullName}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Email</label>
                                        <p>{selectedApplication.personalInfo.email}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Location</label>
                                        <p>{selectedApplication.personalInfo.location}</p>
                                      </div>
                                      {selectedApplication.personalInfo.website && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Website</label>
                                          <a
                                            href={selectedApplication.personalInfo.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center"
                                          >
                                            {selectedApplication.personalInfo.website}
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                          </a>
                                        </div>
                                      )}
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Portfolio</label>
                                        <a
                                          href={selectedApplication.personalInfo.portfolio}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center"
                                        >
                                          View Portfolio
                                          <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Professional Background</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Experience Level</label>
                                        <p className="capitalize">{selectedApplication.professional.experience}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Specialties</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {selectedApplication.professional.specialties.map((specialty) => (
                                            <Badge key={specialty} variant="secondary" className="text-xs">
                                              {specialty}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Business Type</label>
                                        <p className="capitalize">{selectedApplication.business.businessType}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Expected Revenue</label>
                                        <p>${selectedApplication.business.expectedRevenue}/month</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {selectedApplication.professional.previousWork && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Previous Work Experience</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="whitespace-pre-wrap">{selectedApplication.professional.previousWork}</p>
                                    </CardContent>
                                  </Card>
                                )}

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Technical Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Design Tools</label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedApplication.technical.designTools.map((tool) => (
                                          <Badge key={tool} variant="outline" className="text-xs">
                                            {tool}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">Quality Standards:</span>
                                        <div className="flex items-center mt-1">
                                          {selectedApplication.technical.qualityStandards ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="font-medium">Original Work:</span>
                                        <div className="flex items-center mt-1">
                                          {selectedApplication.technical.originalWork ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="font-medium">Licensing:</span>
                                        <div className="flex items-center mt-1">
                                          {selectedApplication.technical.licensing ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Review Section */}
                                {selectedApplication.status === 'pending' && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Review Application</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                                          Internal Review Notes
                                        </label>
                                        <Textarea
                                          value={reviewNotes}
                                          onChange={(e) => setReviewNotes(e.target.value)}
                                          placeholder="Add internal notes about this application..."
                                          rows={3}
                                        />
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                                          Feedback for Applicant (Optional)
                                        </label>
                                        <Textarea
                                          value={feedback}
                                          onChange={(e) => setFeedback(e.target.value)}
                                          placeholder="This will be sent to the applicant via email..."
                                          rows={3}
                                        />
                                      </div>

                                      <Separator />

                                      <div className="flex gap-3">
                                        <Button
                                          onClick={() => handleApplicationAction(
                                            selectedApplication._id,
                                            'approve',
                                            reviewNotes,
                                            feedback
                                          )}
                                          disabled={!!processingAction}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          {processingAction === 'approve' ? 'Approving...' : 'Approve'}
                                        </Button>

                                        <Button
                                          onClick={() => handleApplicationAction(
                                            selectedApplication._id,
                                            'reject',
                                            reviewNotes,
                                            feedback
                                          )}
                                          disabled={!!processingAction}
                                          variant="destructive"
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          {processingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                                        </Button>

                                        <Button
                                          onClick={() => handleApplicationAction(
                                            selectedApplication._id,
                                            'hold',
                                            reviewNotes,
                                            feedback
                                          )}
                                          disabled={!!processingAction}
                                          variant="outline"
                                        >
                                          <AlertTriangle className="w-4 h-4 mr-2" />
                                          {processingAction === 'hold' ? 'Putting on Hold...' : 'Put on Hold'}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Existing Review Notes */}
                                {selectedApplication.reviewNotes && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Review Notes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="whitespace-pre-wrap">{selectedApplication.reviewNotes}</p>
                                      {selectedApplication.reviewedBy && (
                                        <p className="text-sm text-gray-500 mt-2">
                                          Reviewed by {selectedApplication.reviewedBy}
                                        </p>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
