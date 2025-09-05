'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play,
  Pause,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface Experiment {
  id: string
  name: string
  description: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  startDate: string
  endDate?: string
  variants: Array<{
    id: string
    name: string
    isControl: boolean
    allocation: number
    config: Record<string, any>
  }>
  metrics: Array<{
    name: string
    type: 'conversion' | 'revenue' | 'engagement'
    isPrimary: boolean
    description: string
  }>
  trafficAllocation: number
  hypothesis: string
  creator: string
}

interface ConversionSummary {
  experimentId: string
  totalConversions: number
  totalUniqueUsers: number
  variantMetrics: Array<{
    variantId: string
    totalConversions: number
    uniqueUsers: number
    eventTypes: Record<string, { count: number; averageValue: number }>
  }>
}

export default function ExperimentsAdmin() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [conversions, setConversions] = useState<Record<string, ConversionSummary>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchExperiments = async () => {
    try {
      const response = await fetch('/api/experiments/active')
      const data = await response.json()
      setExperiments(data.experiments || [])
    } catch (error) {
      toast.error('Failed to load experiments')
    }
  }

  const fetchConversions = async (experimentId: string) => {
    try {
      const response = await fetch(`/api/experiments/conversions?experimentId=${experimentId}`)
      const data = await response.json()
      if (data.summary) {
        setConversions(prev => ({
          ...prev,
          [experimentId]: data.summary
        }))
      }
    } catch (error) {
      console.error('Failed to load conversions for', experimentId)
    }
  }

  const updateExperimentStatus = async (experimentId: string, status: string) => {
    try {
      const response = await fetch('/api/experiments/active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId, status })
      })

      if (response.ok) {
        await fetchExperiments()
        toast.success(`Experiment ${status} successfully`)
      } else {
        toast.error('Failed to update experiment')
      }
    } catch (error) {
      toast.error('Failed to update experiment')
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchExperiments()

    // Fetch conversions for all experiments
    for (const exp of experiments) {
      await fetchConversions(exp.id)
    }

    setRefreshing(false)
    toast.success('Data refreshed')
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchExperiments()
      setLoading(false)
    }
    loadData()
  }, [])

  // Load conversions when experiments change
  useEffect(() => {
    experiments.forEach(exp => {
      if (exp.status === 'running') {
        fetchConversions(exp.id)
      }
    })
  }, [experiments])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle2 className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      case 'completed': return <Target className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const calculateConversionRate = (summary: ConversionSummary, variantId: string) => {
    const variant = summary.variantMetrics.find(v => v.variantId === variantId)
    if (!variant || variant.uniqueUsers === 0) return 0
    return (variant.totalConversions / variant.uniqueUsers * 100).toFixed(2)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading experiments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing Dashboard</h1>
          <p className="text-gray-600">Manage and monitor your experiments</p>
        </div>
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Experiments</p>
                <p className="text-2xl font-bold">{experiments.filter(e => e.status === 'running').length}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Experiments</p>
                <p className="text-2xl font-bold">{experiments.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversions</p>
                <p className="text-2xl font-bold">
                  {Object.values(conversions).reduce((sum, c) => sum + c.totalConversions, 0)}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold">
                  {Object.values(conversions).reduce((sum, c) => sum + c.totalUniqueUsers, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments List */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Experiments</TabsTrigger>
          <TabsTrigger value="all">All Experiments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {experiments.filter(exp => exp.status === 'running').map(experiment => (
            <Card key={experiment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {experiment.name}
                      <Badge className={getStatusColor(experiment.status)}>
                        {getStatusIcon(experiment.status)}
                        {experiment.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{experiment.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateExperimentStatus(experiment.id, 'paused')}
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateExperimentStatus(experiment.id, 'completed')}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Experiment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Traffic Allocation:</span> {experiment.trafficAllocation}%
                    </div>
                    <div>
                      <span className="font-medium">Start Date:</span> {new Date(experiment.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Creator:</span> {experiment.creator}
                    </div>
                  </div>

                  {/* Variants */}
                  <div>
                    <h4 className="font-medium mb-2">Variants & Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {experiment.variants.map(variant => {
                        const summary = conversions[experiment.id]
                        const conversionRate = summary ? calculateConversionRate(summary, variant.id) : '0'

                        return (
                          <div key={variant.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{variant.name}</span>
                              {variant.isControl && (
                                <Badge variant="outline" className="text-xs">Control</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Allocation: {variant.allocation}%</div>
                              <div>Conversion Rate: {conversionRate}%</div>
                              {summary && (
                                <div>
                                  Users: {summary.variantMetrics.find(v => v.variantId === variant.id)?.uniqueUsers || 0}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Hypothesis */}
                  <div>
                    <h4 className="font-medium mb-1">Hypothesis</h4>
                    <p className="text-sm text-gray-600">{experiment.hypothesis}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {experiments.filter(exp => exp.status === 'running').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Experiments</h3>
                <p className="text-gray-600">Start an experiment to begin testing variants</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {experiments.map(experiment => (
              <Card key={experiment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium">{experiment.name}</h3>
                      <p className="text-sm text-gray-600">{experiment.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(experiment.status)}>
                        {getStatusIcon(experiment.status)}
                        {experiment.status}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {experiment.variants.length} variants
                      </div>
                      {experiment.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => updateExperimentStatus(experiment.id, 'running')}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {Object.entries(conversions).map(([experimentId, summary]) => {
            const experiment = experiments.find(e => e.id === experimentId)
            if (!experiment) return null

            return (
              <Card key={experimentId}>
                <CardHeader>
                  <CardTitle>{experiment.name} - Results</CardTitle>
                  <CardDescription>
                    {summary.totalConversions} total conversions from {summary.totalUniqueUsers} unique users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {summary.variantMetrics.map(variant => {
                      const variantInfo = experiment.variants.find(v => v.id === variant.variantId)
                      const conversionRate = calculateConversionRate(summary, variant.variantId)

                      return (
                        <div key={variant.variantId} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">{variantInfo?.name || variant.variantId}</h4>
                            {variantInfo?.isControl && (
                              <Badge variant="outline">Control</Badge>
                            )}
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Conversion Rate:</span>
                              <span className="font-medium">{conversionRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Conversions:</span>
                              <span>{variant.totalConversions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Unique Users:</span>
                              <span>{variant.uniqueUsers}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {Object.keys(conversions).length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                <p className="text-gray-600">Results will appear here once experiments start collecting data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
