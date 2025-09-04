'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Send, Clock, Users, BarChart3, Target, Filter,
  Calendar as CalendarIcon, Play, Pause, Eye, Copy,
  Download, Settings, AlertCircle, CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

interface EmailCampaign {
  _id: string
  name: string
  subject: string
  preheader: string
  templateId: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  scheduledAt?: Date
  sentAt?: Date
  audience: {
    segmentId?: string
    criteria: AudienceCriteria
    estimatedSize: number
  }
  settings: {
    trackOpens: boolean
    trackClicks: boolean
    enableUnsubscribe: boolean
    timezone: string
    sendRate?: number // emails per hour
  }
  metrics?: CampaignMetrics
  createdAt: Date
  updatedAt: Date
}

interface AudienceCriteria {
  userType?: 'all' | 'customers' | 'partners' | 'subscribers'
  registrationDate?: {
    from?: Date
    to?: Date
  }
  lastActivity?: {
    from?: Date
    to?: Date
  }
  location?: {
    countries?: string[]
    cities?: string[]
  }
  engagement?: {
    openRate?: { min?: number; max?: number }
    clickRate?: { min?: number; max?: number }
  }
  purchases?: {
    hasOrdered?: boolean
    totalSpent?: { min?: number; max?: number }
    lastOrder?: { from?: Date; to?: Date }
  }
  tags?: string[]
  excludeUnsubscribed?: boolean
}

interface CampaignMetrics {
  sent: number
  delivered: number
  bounced: number
  opened: number
  clicked: number
  unsubscribed: number
  complained: number
  converted: number
  revenue: number
  openRate: number
  clickRate: number
  conversionRate: number
  deliveryRate: number
}

interface EmailTemplate {
  _id: string
  name: string
  subject: string
  category: string
  thumbnail?: string
}

export default function EmailCampaignManager() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)
  const [audienceSize, setAudienceSize] = useState(0)
  const [activeTab, setActiveTab] = useState('campaigns')

  const [newCampaign, setNewCampaign] = useState<Partial<EmailCampaign>>({
    name: '',
    subject: '',
    preheader: '',
    templateId: '',
    status: 'draft',
    audience: {
      criteria: {
        userType: 'all',
        excludeUnsubscribed: true
      },
      estimatedSize: 0
    },
    settings: {
      trackOpens: true,
      trackClicks: true,
      enableUnsubscribe: true,
      timezone: 'UTC'
    }
  })

  useEffect(() => {
    fetchCampaigns()
    fetchTemplates()
  }, [])

  useEffect(() => {
    // Estimate audience size based on criteria
    estimateAudienceSize(newCampaign.audience?.criteria || {})
  }, [newCampaign.audience?.criteria])

  const fetchCampaigns = async () => {
    // Mock data - replace with actual API call
    const mockCampaigns: EmailCampaign[] = [
      {
        _id: '1',
        name: 'Black Friday 2024',
        subject: '🔥 Exclusive Black Friday Deals - Up to 70% Off!',
        preheader: 'Limited time offers on premium design resources',
        templateId: 'template1',
        status: 'sent',
        sentAt: new Date('2024-01-25T10:00:00Z'),
        audience: {
          criteria: { userType: 'all', excludeUnsubscribed: true },
          estimatedSize: 15420
        },
        settings: {
          trackOpens: true,
          trackClicks: true,
          enableUnsubscribe: true,
          timezone: 'UTC'
        },
        metrics: {
          sent: 15420,
          delivered: 14892,
          bounced: 528,
          opened: 8950,
          clicked: 2680,
          unsubscribed: 45,
          complained: 12,
          converted: 340,
          revenue: 45600,
          openRate: 60.1,
          clickRate: 29.9,
          conversionRate: 2.2,
          deliveryRate: 96.6
        },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25')
      },
      {
        _id: '2',
        name: 'Welcome Series - Week 1',
        subject: '👋 Welcome to UI8! Here\'s what you need to know',
        preheader: 'Your journey to better design starts here',
        templateId: 'template2',
        status: 'scheduled',
        scheduledAt: new Date('2024-02-01T09:00:00Z'),
        audience: {
          criteria: { userType: 'customers', excludeUnsubscribed: true },
          estimatedSize: 1240
        },
        settings: {
          trackOpens: true,
          trackClicks: true,
          enableUnsubscribe: true,
          timezone: 'UTC'
        },
        createdAt: new Date('2024-01-28'),
        updatedAt: new Date('2024-01-28')
      }
    ]
    setCampaigns(mockCampaigns)
  }

  const fetchTemplates = async () => {
    // Mock data - replace with actual API call
    const mockTemplates: EmailTemplate[] = [
      {
        _id: 'template1',
        name: 'Promotional Email',
        subject: 'Special Offer Template',
        category: 'marketing'
      },
      {
        _id: 'template2',
        name: 'Welcome Email',
        subject: 'Welcome Template',
        category: 'welcome'
      },
      {
        _id: 'template3',
        name: 'Newsletter Template',
        subject: 'Newsletter Template',
        category: 'newsletter'
      }
    ]
    setTemplates(mockTemplates)
  }

  const estimateAudienceSize = async (criteria: AudienceCriteria) => {
    // Mock estimation logic - replace with actual API call
    let size = 18500 // base user count

    if (criteria.userType === 'customers') size *= 0.65
    if (criteria.userType === 'partners') size *= 0.15
    if (criteria.userType === 'subscribers') size *= 0.85
    if (criteria.excludeUnsubscribed) size *= 0.92

    const estimatedSize = Math.round(size)
    setAudienceSize(estimatedSize)
    setNewCampaign(prev => ({
      ...prev,
      audience: {
        ...prev.audience!,
        estimatedSize
      }
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500'
      case 'sending': return 'bg-blue-500'
      case 'scheduled': return 'bg-yellow-500'
      case 'paused': return 'bg-orange-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4" />
      case 'sending': return <Send className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Eye className="w-4 h-4" />
    }
  }

  const handleCreateCampaign = async () => {
    try {
      // API call to create campaign
      const createdCampaign = {
        ...newCampaign,
        _id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as EmailCampaign

      setCampaigns([createdCampaign, ...campaigns])
      setIsCreateModalOpen(false)
      setNewCampaign({
        name: '',
        subject: '',
        preheader: '',
        templateId: '',
        status: 'draft',
        audience: {
          criteria: {
            userType: 'all',
            excludeUnsubscribed: true
          },
          estimatedSize: 0
        },
        settings: {
          trackOpens: true,
          trackClicks: true,
          enableUnsubscribe: true,
          timezone: 'UTC'
        }
      })
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const performanceData = campaigns
    .filter(c => c.metrics)
    .map(campaign => ({
      name: campaign.name.slice(0, 15) + '...',
      sent: campaign.metrics!.sent,
      opened: campaign.metrics!.opened,
      clicked: campaign.metrics!.clicked,
      converted: campaign.metrics!.converted,
      revenue: campaign.metrics!.revenue
    }))

  const revenueData = campaigns
    .filter(c => c.metrics && c.sentAt)
    .map(campaign => ({
      date: format(campaign.sentAt!, 'MMM dd'),
      revenue: campaign.metrics!.revenue,
      conversions: campaign.metrics!.converted
    }))

  const audienceDistribution = [
    { name: 'All Users', value: 18500, color: '#3b82f6' },
    { name: 'Customers', value: 12025, color: '#10b981' },
    { name: 'Partners', value: 2775, color: '#8b5cf6' },
    { name: 'Subscribers', value: 15725, color: '#f59e0b' }
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-gray-600 mt-1">Create, schedule, and manage email campaigns</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
              <Send className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {campaigns.filter(c => c.status === 'sent').length} sent, {campaigns.filter(c => c.status === 'scheduled').length} scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Avg. {Math.round(campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0) / Math.max(campaigns.filter(c => c.metrics).length, 1)).toLocaleString()} per campaign
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(campaigns.reduce((sum, c) => sum + (c.metrics?.openRate || 0), 0) / Math.max(campaigns.filter(c => c.metrics).length, 1)).toFixed(1)}%
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Industry avg: 21.3%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${campaigns.reduce((sum, c) => sum + (c.metrics?.revenue || 0), 0).toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              From email campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </div>
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{campaign.subject}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Audience: {campaign.audience.estimatedSize.toLocaleString()} recipients |
                        {campaign.sentAt && ` Sent: ${format(campaign.sentAt, 'MMM dd, yyyy HH:mm')}`}
                        {campaign.scheduledAt && ` Scheduled: ${format(campaign.scheduledAt, 'MMM dd, yyyy HH:mm')}`}
                      </p>

                      {campaign.metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Delivery Rate</p>
                            <p className="font-semibold">{campaign.metrics.deliveryRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Open Rate</p>
                            <p className="font-semibold">{campaign.metrics.openRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Click Rate</p>
                            <p className="font-semibold">{campaign.metrics.clickRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Conversion Rate</p>
                            <p className="font-semibold">{campaign.metrics.conversionRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Unsubscribes</p>
                            <p className="font-semibold text-red-600">{campaign.metrics.unsubscribed}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Revenue</p>
                            <p className="font-semibold text-green-600">${campaign.metrics.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>
                  Compare metrics across campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                    <Bar dataKey="opened" fill="#10b981" name="Opened" />
                    <Bar dataKey="clicked" fill="#8b5cf6" name="Clicked" />
                    <Bar dataKey="converted" fill="#f59e0b" name="Converted" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Revenue generated by campaigns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Audience Distribution</CardTitle>
                <CardDescription>
                  Breakdown of your email audience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={audienceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {audienceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience Insights</CardTitle>
                <CardDescription>
                  Key metrics about your audience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Subscribers</p>
                    <p className="text-2xl font-bold">18,500</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Users</p>
                    <p className="text-2xl font-bold">15,725</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Growth Rate</p>
                    <p className="text-2xl font-bold text-green-600">+12.3%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unsubscribe Rate</p>
                    <p className="text-2xl font-bold text-red-600">0.8%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new email campaign with audience targeting and scheduling
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Details */}
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Enter campaign name"
                />
              </div>

              <div>
                <Label>Email Subject</Label>
                <Input
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <Label>Preheader Text</Label>
                <Input
                  value={newCampaign.preheader}
                  onChange={(e) => setNewCampaign({ ...newCampaign, preheader: e.target.value })}
                  placeholder="Preview text that appears after subject"
                />
              </div>

              <div>
                <Label>Email Template</Label>
                <Select
                  value={newCampaign.templateId}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        {template.name} ({template.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Campaign Settings</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Track email opens</span>
                  <Switch
                    checked={newCampaign.settings?.trackOpens}
                    onCheckedChange={(checked) =>
                      setNewCampaign({
                        ...newCampaign,
                        settings: { ...newCampaign.settings!, trackOpens: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Track email clicks</span>
                  <Switch
                    checked={newCampaign.settings?.trackClicks}
                    onCheckedChange={(checked) =>
                      setNewCampaign({
                        ...newCampaign,
                        settings: { ...newCampaign.settings!, trackClicks: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enable unsubscribe link</span>
                  <Switch
                    checked={newCampaign.settings?.enableUnsubscribe}
                    onCheckedChange={(checked) =>
                      setNewCampaign({
                        ...newCampaign,
                        settings: { ...newCampaign.settings!, enableUnsubscribe: checked }
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Audience Targeting */}
            <div className="space-y-4">
              <div>
                <Label>Target Audience</Label>
                <Select
                  value={newCampaign.audience?.criteria.userType}
                  onValueChange={(value: any) =>
                    setNewCampaign({
                      ...newCampaign,
                      audience: {
                        ...newCampaign.audience!,
                        criteria: { ...newCampaign.audience!.criteria, userType: value }
                      }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="customers">Customers Only</SelectItem>
                    <SelectItem value="partners">Partners Only</SelectItem>
                    <SelectItem value="subscribers">Subscribers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Exclude unsubscribed users</span>
                <Switch
                  checked={newCampaign.audience?.criteria.excludeUnsubscribed}
                  onCheckedChange={(checked) =>
                    setNewCampaign({
                      ...newCampaign,
                      audience: {
                        ...newCampaign.audience!,
                        criteria: { ...newCampaign.audience!.criteria, excludeUnsubscribed: checked }
                      }
                    })
                  }
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Estimated Audience</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{audienceSize.toLocaleString()}</p>
                <p className="text-sm text-blue-700">recipients will receive this campaign</p>
              </div>

              <div>
                <Label>Send Options</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sendOption"
                      value="now"
                      checked={!newCampaign.scheduledAt}
                      onChange={() => setNewCampaign({ ...newCampaign, scheduledAt: undefined })}
                    />
                    <span className="text-sm">Send immediately</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sendOption"
                      value="scheduled"
                      checked={!!newCampaign.scheduledAt}
                      onChange={() => setNewCampaign({ ...newCampaign, scheduledAt: new Date() })}
                    />
                    <span className="text-sm">Schedule for later</span>
                  </div>
                </div>

                {newCampaign.scheduledAt && (
                  <div className="mt-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newCampaign.scheduledAt, 'PPP HH:mm')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newCampaign.scheduledAt}
                          onSelect={(date) =>
                            setNewCampaign({
                              ...newCampaign,
                              scheduledAt: date || new Date()
                            })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              <Send className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
