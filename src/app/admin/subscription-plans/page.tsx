'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Plus, Edit, Trash2, Save, X, DollarSign, Users, Eye, EyeOff,
  ArrowUp, ArrowDown, RefreshCw, Copy, Settings, AlertTriangle
} from 'lucide-react'

interface SubscriptionPlan {
  _id: string
  planId: string
  name: string
  description?: string
  price: number
  originalPrice: number
  period: string
  downloads: number
  duration: string
  features: Array<{ feature: string; enabled: boolean }>
  highlighted: boolean
  badge?: string
  enabled: boolean
  sortOrder: number
  metadata?: any
  _createdAt?: string
  _updatedAt?: string
}

interface PlanFormData {
  planId: string
  name: string
  description: string
  price: number
  originalPrice: number
  period: string
  downloads: number
  duration: string
  features: Array<{ feature: string; enabled: boolean }>
  highlighted: boolean
  badge: string
  enabled: boolean
  sortOrder: number
}

const defaultFormData: PlanFormData = {
  planId: '',
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  period: '',
  downloads: 10,
  duration: '',
  features: [],
  highlighted: false,
  badge: '',
  enabled: true,
  sortOrder: 0
}

export default function SubscriptionPlansAdminPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData)
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/subscription-plans?includeDisabled=true')
      const data = await response.json()

      if (data.success) {
        setPlans(data.plans || [])

        // Show message if plans were auto-seeded
        if (data.seeded && data.plans.some((plan: any) => plan.metadata?.autoSeeded)) {
          toast.success('Default subscription plans automatically loaded')
        }
      } else {
        throw new Error(data.error || 'Failed to fetch plans')
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Failed to fetch subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)

      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan._id}`
        : '/api/admin/subscription-plans'

      const method = editingPlan ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Plan saved successfully')
        setIsDialogOpen(false)
        setEditingPlan(null)
        setFormData(defaultFormData)
        fetchPlans()
      } else {
        throw new Error(data.error || 'Failed to save plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setFormData({
      planId: plan.planId,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      originalPrice: plan.originalPrice,
      period: plan.period,
      downloads: plan.downloads,
      duration: plan.duration,
      features: plan.features || [],
      highlighted: plan.highlighted,
      badge: plan.badge || '',
      enabled: plan.enabled,
      sortOrder: plan.sortOrder
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/subscription-plans/${plan._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Plan deleted successfully')
        fetchPlans()
      } else {
        throw new Error(data.error || 'Failed to delete plan')
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete plan')
    }
  }

  const handleToggleEnabled = async (plan: SubscriptionPlan) => {
    try {
      const response = await fetch(`/api/admin/subscription-plans/${plan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !plan.enabled
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Plan ${plan.enabled ? 'disabled' : 'enabled'} successfully`)
        fetchPlans()
      } else {
        throw new Error(data.error || 'Failed to update plan')
      }
    } catch (error) {
      console.error('Error toggling plan:', error)
      toast.error('Failed to update plan status')
    }
  }

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, { feature: newFeature.trim(), enabled: true }]
      }))
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const handleToggleFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, enabled: !feature.enabled } : feature
      )
    }))
  }

  const resetForm = () => {
    setFormData(defaultFormData)
    setEditingPlan(null)
    setNewFeature('')
  }



  const getDiscount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600 mt-1">Manage all-access pricing tiers and features</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPlans} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </DialogTitle>
                <DialogDescription>
                  Configure pricing, features, and settings for this subscription tier.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planId">Plan ID *</Label>
                        <Input
                          id="planId"
                          value={formData.planId}
                          onChange={(e) => setFormData(prev => ({ ...prev, planId: e.target.value }))}
                          placeholder="e.g., basic, elite, lifetime"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Plan Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Basic, Elite, Lifetime"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this plan"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="period">Billing Period *</Label>
                        <Input
                          id="period"
                          value={formData.period}
                          onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                          placeholder="e.g., Paid quarterly, One-time purchase"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Access Duration *</Label>
                        <Input
                          id="duration"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g., 3-month access, Lifetime access"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="badge">Badge Text</Label>
                        <Input
                          id="badge"
                          value={formData.badge}
                          onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                          placeholder="e.g., Best Value, Most Popular"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Input
                          id="sortOrder"
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="highlighted"
                          checked={formData.highlighted}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, highlighted: checked }))}
                        />
                        <Label htmlFor="highlighted">Highlighted Plan</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enabled"
                          checked={formData.enabled}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                        />
                        <Label htmlFor="enabled">Plan Enabled</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="originalPrice">Original Price ($) *</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          step="0.01"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Current Price ($) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="downloads">Downloads Per Day *</Label>
                      <Input
                        id="downloads"
                        type="number"
                        min="1"
                        value={formData.downloads}
                        onChange={(e) => setFormData(prev => ({ ...prev, downloads: Number(e.target.value) }))}
                        required
                      />
                    </div>

                    {formData.originalPrice > 0 && formData.price > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Discount:</strong> {getDiscount(formData.originalPrice, formData.price)}% off
                        </p>
                        <p className="text-sm text-green-700">
                          Savings: ${(formData.originalPrice - formData.price).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <div>
                      <Label>Add Feature</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Enter feature description"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                        />
                        <Button type="button" onClick={handleAddFeature}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Plan Features</Label>
                      {formData.features.length === 0 ? (
                        <p className="text-sm text-gray-500">No features added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {formData.features.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={feature.enabled}
                                  onCheckedChange={() => handleToggleFeature(index)}
                                />
                                <span className={feature.enabled ? '' : 'line-through text-gray-400'}>
                                  {feature.feature}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFeature(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans ({plans.length})</CardTitle>
          <CardDescription>
            Manage pricing tiers for the All-Access subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading plans...</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Subscription Plans Ready</h3>
              <p className="text-gray-600 mb-6">Default subscription plans are automatically available. Create custom plans or modify existing ones.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Plan
                </Button>
                <Button variant="outline" onClick={fetchPlans}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Plans
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{plan.name}</span>
                            {plan.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {plan.badge}
                              </Badge>
                            )}
                            {plan.highlighted && (
                              <Badge className="text-xs bg-blue-600">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan.downloads} downloads/day • {plan.duration}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">${plan.price}</span>
                            {plan.originalPrice > plan.price && (
                              <>
                                <span className="text-sm text-gray-500 line-through">
                                  ${plan.originalPrice}
                                </span>
                                <span className="text-xs text-green-600">
                                  -{getDiscount(plan.originalPrice, plan.price)}%
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{plan.period}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {plan.features?.filter(f => f.enabled).length || 0} features
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.enabled}
                            onCheckedChange={() => handleToggleEnabled(plan)}
                          />
                          <span className={`text-sm ${plan.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {plan.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(plan)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
