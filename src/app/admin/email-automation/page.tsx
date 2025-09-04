'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Mail, Play, Pause, Archive, Plus, Settings, BarChart3,
  Clock, Users, TrendingUp, RefreshCw, Eye, Edit, Trash2,
  CheckCircle, XCircle, AlertTriangle, Send, Database
} from 'lucide-react'

interface EmailTemplate {
  _id: string
  templateId: string
  name: string
  category: string
  status: string
  analytics: {
    totalSent: number
    openRate: number
    clickRate: number
  }
  metadata: {
    createdAt: string
  }
}

interface EmailWorkflow {
  _id: string
  workflowId: string
  name: string
  type: string
  status: string
  trigger: {
    type: string
  }
  analytics: {
    totalExecutions: number
    averageOpenRate: number
    completionRate: number
  }
  metadata: {
    createdAt: string
  }
}

interface EmailActivity {
  _id: string
  eventType: string
  userId: string
  planId?: string
  timestamp: string
  status: string
  eventData: any
  userName?: string
}

export default function EmailAutomationAdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [workflows, setWorkflows] = useState<EmailWorkflow[]>([])
  const [activities, setActivities] = useState<EmailActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // In a real implementation, these would be separate API calls
      // For now, we'll simulate the data
      setTemplates([
        {
          _id: '1',
          templateId: 'subscription_confirmation',
          name: 'Subscription Confirmation',
          category: 'subscription_confirmation',
          status: 'active',
          analytics: { totalSent: 150, openRate: 85, clickRate: 25 },
          metadata: { createdAt: new Date().toISOString() }
        },
        {
          _id: '2',
          templateId: 'subscription_renewal',
          name: 'Subscription Renewal',
          category: 'subscription_renewal',
          status: 'active',
          analytics: { totalSent: 45, openRate: 78, clickRate: 15 },
          metadata: { createdAt: new Date().toISOString() }
        },
        {
          _id: '3',
          templateId: 'subscription_expiring',
          name: 'Subscription Expiring',
          category: 'subscription_expiring',
          status: 'active',
          analytics: { totalSent: 32, openRate: 92, clickRate: 35 },
          metadata: { createdAt: new Date().toISOString() }
        }
      ])

      setWorkflows([
        {
          _id: '1',
          workflowId: 'subscription_welcome_series',
          name: 'Subscription Welcome Series',
          type: 'subscription',
          status: 'active',
          trigger: { type: 'subscription_started' },
          analytics: { totalExecutions: 150, averageOpenRate: 85, completionRate: 95 },
          metadata: { createdAt: new Date().toISOString() }
        },
        {
          _id: '2',
          workflowId: 'subscription_expiry_warnings',
          name: 'Subscription Expiry Warnings',
          type: 'subscription',
          status: 'active',
          trigger: { type: 'subscription_expiring' },
          analytics: { totalExecutions: 96, averageOpenRate: 92, completionRate: 88 },
          metadata: { createdAt: new Date().toISOString() }
        }
      ])

      setActivities([
        {
          _id: '1',
          eventType: 'subscription_event',
          userId: 'user1',
          planId: 'elite',
          timestamp: new Date().toISOString(),
          status: 'completed',
          eventData: { eventType: 'subscription_started', planName: 'Elite' },
          userName: 'John Doe'
        },
        {
          _id: '2',
          eventType: 'email_sent',
          userId: 'user2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'sent',
          eventData: { subject: 'Welcome to Elite Plan', templateName: 'Subscription Confirmation' },
          userName: 'Jane Smith'
        }
      ])

    } catch (error) {
      console.error('Error fetching email automation data:', error)
      toast.error('Failed to fetch email automation data')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedTemplates = async () => {
    try {
      setSeeding(true)
      const response = await fetch('/api/admin/email-templates/seed', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Created ${result.created} email templates`)
        fetchData()
      } else {
        toast.error(result.message || 'Failed to seed templates')
      }
    } catch (error) {
      console.error('Error seeding templates:', error)
      toast.error('Failed to seed email templates')
    } finally {
      setSeeding(false)
    }
  }

  const handleSeedWorkflows = async () => {
    try {
      setSeeding(true)
      const response = await fetch('/api/admin/email-workflows/seed', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Created ${result.created} email workflows`)
        fetchData()
      } else {
        toast.error(result.message || 'Failed to seed workflows')
      }
    } catch (error) {
      console.error('Error seeding workflows:', error)
      toast.error('Failed to seed email workflows')
    } finally {
      setSeeding(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />
      case 'draft': return <Edit className="w-4 h-4 text-gray-600" />
      case 'archived': return <Archive className="w-4 h-4 text-gray-400" />
      default: return <AlertTriangle className="w-4 h-4 text-orange-600" />
    }
  }

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      'subscription_started': 'Subscription Started',
      'subscription_renewed': 'Subscription Renewed',
      'subscription_expiring': 'Subscription Expiring',
      'subscription_expired': 'Subscription Expired',
      'subscription_cancelled': 'Subscription Cancelled'
    }
    return labels[triggerType] || triggerType
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading email automation data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Automation</h1>
          <p className="text-gray-600 mt-1">Manage subscription email workflows and templates</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleSeedTemplates} disabled={seeding}>
            <Database className="w-4 h-4 mr-2" />
            Seed Templates
          </Button>
          <Button variant="outline" onClick={handleSeedWorkflows} disabled={seeding}>
            <Settings className="w-4 h-4 mr-2" />
            Seed Workflows
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Templates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templates.filter(t => t.status === 'active').length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflows.filter(w => w.status === 'active').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent (Total)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templates.reduce((sum, t) => sum + t.analytics.totalSent, 0)}
                </p>
              </div>
              <Send className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(templates.reduce((sum, t) => sum + t.analytics.openRate, 0) / templates.length || 0)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Subscription Events</CardTitle>
                <CardDescription>Latest subscription-related email triggers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.userName || 'Unknown User'}</p>
                        <p className="text-sm text-gray-600">
                          {activity.eventData.eventType?.replace('_', ' ')} - {activity.eventData.planName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Performance</CardTitle>
                <CardDescription>Top performing email templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates
                    .sort((a, b) => b.analytics.openRate - a.analytics.openRate)
                    .slice(0, 5)
                    .map((template) => (
                      <div key={template._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-gray-600">{template.analytics.totalSent} sent</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{template.analytics.openRate}%</p>
                          <p className="text-xs text-gray-500">open rate</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates ({templates.length})</CardTitle>
              <CardDescription>Manage subscription email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-gray-500">{template.templateId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(template.status)}
                          <span className="capitalize">{template.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{template.analytics.totalSent} sent</p>
                          <p className="text-gray-500">
                            {template.analytics.openRate}% open • {template.analytics.clickRate}% click
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Workflows ({workflows.length})</CardTitle>
              <CardDescription>Manage automated email sequences</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{workflow.name}</p>
                          <p className="text-sm text-gray-500">{workflow.workflowId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTriggerLabel(workflow.trigger.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(workflow.status)}
                          <span className="capitalize">{workflow.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{workflow.analytics.totalExecutions} executions</p>
                          <p className="text-gray-500">
                            {workflow.analytics.averageOpenRate}% open • {workflow.analytics.completionRate}% complete
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Activity Log</CardTitle>
              <CardDescription>Recent email automation activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity._id}>
                      <TableCell>
                        <Badge variant="outline">
                          {activity.eventType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{activity.userName || 'Unknown User'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {activity.eventData.planName && (
                            <p>Plan: {activity.eventData.planName}</p>
                          )}
                          {activity.eventData.subject && (
                            <p>Subject: {activity.eventData.subject}</p>
                          )}
                          {activity.eventData.templateName && (
                            <p>Template: {activity.eventData.templateName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={activity.status === 'completed' || activity.status === 'sent' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
