'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Database,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play,
  RefreshCw,
  Eye,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react'
import { cn } from '@/styles/component-variants'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface ComponentData {
  componentName: string
  endpoint?: string
  dependencies: string[]
  lastChecked: string
  status: 'healthy' | 'warning' | 'critical'
  issues: any[]
  performance: {
    averageResponseTime: number
    errorRate: number
    cacheHitRate?: number
  }
  healthScore?: number
  detailedMetrics?: any
}

export default function AdminComponentsPage() {
  const [components, setComponents] = useState<ComponentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [testComponent, setTestComponent] = useState<string | null>(null)
  const [testType, setTestType] = useState('connectivity')
  const [customQuery, setCustomQuery] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [isRunningTest, setIsRunningTest] = useState(false)

  const fetchComponents = async () => {
    try {
      const response = await fetch('/api/admin/health/components?detailed=true')
      if (!response.ok) throw new Error('Failed to fetch components')

      const data = await response.json()
      setComponents(data.components || [])
    } catch (error) {
      console.error('Error fetching components:', error)
      toast.error('Failed to load components')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComponents()
  }, [])

  const runComponentTest = async () => {
    if (!testComponent) return

    setIsRunningTest(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/health/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName: testComponent,
          testType,
          customQuery: testType === 'custom' ? customQuery : undefined
        })
      })

      if (!response.ok) throw new Error('Test failed')

      const result = await response.json()
      setTestResult(result)

      if (result.result.success) {
        toast.success(`Test completed successfully: ${result.result.message}`)
      } else {
        toast.error(`Test failed: ${result.result.message}`)
      }
    } catch (error) {
      console.error('Component test error:', error)
      toast.error('Failed to run component test')
    } finally {
      setIsRunningTest(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="Component Monitor" subtitle="Detailed component health and testing">
        <div className="space-y-6">
          <div className="mobile-grid lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="mobile-card">
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-3">
                    <div className="mobile-skeleton-title"></div>
                    <div className="mobile-skeleton-text"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  const healthyComponents = components.filter(c => c.status === 'healthy').length
  const warningComponents = components.filter(c => c.status === 'warning').length
  const criticalComponents = components.filter(c => c.status === 'critical').length

  return (
    <AdminLayout title="Component Monitor" subtitle="Detailed component health monitoring and testing">
      <div className="space-y-6">
        {/* Component Summary */}
        <div className="mobile-grid mobile-grid-2 lg:grid-cols-4">
          <Card className="mobile-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium">Total Components</p>
                  <p className="mobile-title">{components.length}</p>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium text-green-700">Healthy</p>
                  <p className="mobile-title text-green-800">{healthyComponents}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium text-yellow-700">Warning</p>
                  <p className="mobile-title text-yellow-800">{warningComponents}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-caption font-medium text-red-700">Critical</p>
                  <p className="mobile-title text-red-800">{criticalComponents}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Component Testing */}
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="mobile-subtitle">Component Testing</CardTitle>
            <CardDescription>Run manual tests on specific components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mobile-grid lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Component</label>
                  <Select value={testComponent || ''} onValueChange={setTestComponent}>
                    <SelectTrigger className="mobile-input">
                      <SelectValue placeholder="Select component to test" />
                    </SelectTrigger>
                    <SelectContent>
                      {components.map((component) => (
                        <SelectItem key={component.componentName} value={component.componentName}>
                          {component.componentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Test Type</label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger className="mobile-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connectivity">Connectivity Test</SelectItem>
                      <SelectItem value="performance">Performance Test</SelectItem>
                      <SelectItem value="data_integrity">Data Integrity Test</SelectItem>
                      <SelectItem value="custom">Custom Query Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {testType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom GROQ Query</label>
                    <Textarea
                      placeholder="*[_type == 'product'][0]{_id, title}"
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      className="mobile-input"
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={runComponentTest}
                  disabled={!testComponent || isRunningTest || (testType === 'custom' && !customQuery)}
                  className="mobile-button-primary w-full"
                >
                  {isRunningTest ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Running Test...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      <span>Run Test</span>
                    </div>
                  )}
                </Button>
              </div>

              {testResult && (
                <div className="space-y-4">
                  <h4 className="mobile-subtitle">Test Result</h4>
                  <div className={cn("p-4 rounded-lg border", {
                    'bg-green-50 border-green-200': testResult.result.success,
                    'bg-red-50 border-red-200': !testResult.result.success
                  })}>
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {testResult.result.success ? 'Test Passed' : 'Test Failed'}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{testResult.result.message}</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Duration: {testResult.result.duration}ms</p>
                      <p>Completed: {formatDistanceToNow(new Date(testResult.result.endTime), { addSuffix: true })}</p>
                      {testResult.result.responseTime && (
                        <p>Response Time: {testResult.result.responseTime}ms</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Component List */}
        <div className="space-y-4">
          {components.map((component, index) => (
            <Card key={index} className={cn("mobile-card border-l-4", {
              'border-l-green-500': component.status === 'healthy',
              'border-l-yellow-500': component.status === 'warning',
              'border-l-red-500': component.status === 'critical'
            })}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(component.status)}
                      <h3 className="mobile-subtitle">{component.componentName}</h3>
                      <Badge className={cn("text-xs", {
                        'bg-green-100 text-green-800': component.status === 'healthy',
                        'bg-yellow-100 text-yellow-800': component.status === 'warning',
                        'bg-red-100 text-red-800': component.status === 'critical'
                      })}>
                        {component.status}
                      </Badge>
                    </div>

                    {component.endpoint && (
                      <p className="mobile-caption text-gray-600 mb-1">
                        Endpoint: <code className="bg-gray-100 px-1 rounded">{component.endpoint}</code>
                      </p>
                    )}

                    <p className="mobile-caption text-gray-600 mb-3">
                      Dependencies: {component.dependencies.join(', ')}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedComponent(selectedComponent === component.componentName ? null : component.componentName)}
                    className="mobile-button"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {selectedComponent === component.componentName ? 'Hide' : 'Details'}
                  </Button>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Zap className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <p className="mobile-caption text-gray-600">Avg Response</p>
                    <p className="mobile-body font-semibold">{component.performance.averageResponseTime.toFixed(0)}ms</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                    <p className="mobile-caption text-gray-600">Error Rate</p>
                    <p className="mobile-body font-semibold">{(component.performance.errorRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="mobile-caption text-gray-600">Cache Hit</p>
                    <p className="mobile-body font-semibold">
                      {component.performance.cacheHitRate ? `${(component.performance.cacheHitRate * 100).toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Last Checked */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Last checked: {formatDistanceToNow(new Date(component.lastChecked), { addSuffix: true })}</span>
                  {component.healthScore && (
                    <Badge variant="outline" className="text-xs">
                      Health: {component.healthScore}%
                    </Badge>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedComponent === component.componentName && (
                  <div className="border-t pt-4 mt-4 space-y-4 mobile-fade-in">
                    {/* Issues */}
                    {component.issues.length > 0 && (
                      <div>
                        <h4 className="mobile-body font-semibold mb-2">Issues ({component.issues.length})</h4>
                        <div className="space-y-2">
                          {component.issues.map((issue: any, issueIndex: number) => (
                            <div key={issueIndex} className={cn("p-3 rounded-lg border", getStatusColor(issue.status))}>
                              <p className="font-medium">{issue.message}</p>
                              {issue.suggestions && (
                                <ul className="text-sm mt-2 space-y-1">
                                  {issue.suggestions.map((suggestion: string, suggestionIndex: number) => (
                                    <li key={suggestionIndex} className="flex items-start gap-1">
                                      <span className="text-blue-500 mt-0.5">•</span>
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Metrics */}
                    {component.detailedMetrics && (
                      <div>
                        <h4 className="mobile-body font-semibold mb-2">Detailed Metrics</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(component.detailedMetrics, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="mobile-button">
                            <Play className="w-4 h-4 mr-1" />
                            Test Component
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Test {component.componentName}</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will run a connectivity test on the {component.componentName} component.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setTestComponent(component.componentName)
                                setTestType('connectivity')
                                runComponentTest()
                              }}
                            >
                              Run Test
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
