'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Star,
  BookOpen,
  Award,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Mail,
  MessageSquare,
  ChevronDown,
  Brain,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  Lightbulb,
  Bell,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Flame
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { toast } from 'sonner'

interface StudentProgress {
  student: {
    _id: string
    name: string
    email: string
    image?: string
    joinedAt: string
  }
  analytics: {
    completionRate: number
    averageProgress: number
    totalTimeSpent: number
    averageGrade: number
    coursesCompleted: number
    coursesInProgress: number
    currentStreak: number
    longestStreak: number
    learningVelocity: number
  }
  progress: {
    enrolledCourses: Array<{
      _id: string
      title: string
      difficulty: string
      progress?: {
        completionPercentage: number
        averageGrade: number
        timeSpent: number
        lastAccessed: string
        certificateIssued: boolean
      }
    }>
  }
  activity: {
    dailyActivity: Array<{
      _createdAt: string
      activityType: string
      timeSpent: number
    }>
    streakData: {
      currentStreak: number
      longestStreak: number
      totalActiveDays: number
    }
  }
  recommendations: Array<{
    type: string
    priority: string
    title: string
    description: string
    action: string
    suggestedIntervention: string
  }>
  interventionAlerts: Array<{
    type: string
    severity: string
    message: string
    triggerDate: string
    autoActions: string[]
  }>
}

interface ClassProgress {
  classInfo: {
    _id: string
    className: string
    enrolledStudents: Array<{
      user: {
        _id: string
        name: string
        email: string
        image?: string
      }
      enrollmentDate: string
      status: string
    }>
  }
  analytics: {
    classHealth: {
      overall: string
      averageCompletion: number
      atRiskPercentage: number
      engagementLevel: string
    }
    distribution: {
      excelling: number
      onTrack: number
      struggling: number
    }
  }
}

const TIME_RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' }
]

export default function StudentProgressTrackingPage() {
  const [progressData, setProgressData] = useState<StudentProgress | ClassProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'overview' | 'individual' | 'class'>('overview')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [searchQuery, setSearchQuery] = useState('')

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 text-red-700'
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-700'
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-700'
      default: return 'border-gray-500 bg-gray-50 text-gray-700'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'needs_attention': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  useEffect(() => {
    loadProgressData()
  }, [viewMode, selectedStudent, selectedClass, timeRange])

  const loadProgressData = async () => {
    try {
      setIsLoading(true)
      let url = `/api/creator/students/progress?range=${timeRange}`

      if (viewMode === 'individual' && selectedStudent) {
        url += `&studentId=${selectedStudent}`
      } else if (viewMode === 'class' && selectedClass) {
        url += `&classId=${selectedClass}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setProgressData(data.studentProgress || data.classProgress || data.overallProgress)
      }
    } catch (error) {
      console.error('Error loading progress data:', error)
      toast.error('Failed to load progress data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Progress Analytics</h1>
            <p className="text-gray-600">Advanced learning analytics and intervention tools</p>
          </div>
          <div className="animate-spin">
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Progress Analytics</h1>
          <p className="text-gray-600">Advanced learning analytics and intervention tools</p>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                {TIME_RANGES.find(r => r.value === timeRange)?.label}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIME_RANGES.map(range => (
                <DropdownMenuItem
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={loadProgressData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Mode Selector */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Student</TabsTrigger>
          <TabsTrigger value="class">Class Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewDashboard progressData={progressData} />
        </TabsContent>

        {/* Individual Student Tab */}
        <TabsContent value="individual" className="space-y-6">
          <IndividualStudentDashboard
            progressData={progressData as StudentProgress}
            onStudentSelect={setSelectedStudent}
          />
        </TabsContent>

        {/* Class Analytics Tab */}
        <TabsContent value="class" className="space-y-6">
          <ClassAnalyticsDashboard
            progressData={progressData as ClassProgress}
            onClassSelect={setSelectedClass}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Overview Dashboard Component
function OverviewDashboard({ progressData }: { progressData: any }) {
  if (!progressData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
          <p className="text-gray-500">Please select a student or class to view progress analytics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.overview?.totalStudents || 0}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% this month
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.overview?.activeStudents || 0}</p>
                <p className="text-xs text-blue-600">
                  {Math.round((progressData.overview?.activeStudents || 0) / Math.max(progressData.overview?.totalStudents || 1, 1) * 100)}% of total
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.performance?.averageCompletion || 0}%</p>
                <p className="text-xs text-purple-600">
                  Platform average: 67%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Certificates Issued</p>
                <p className="text-2xl font-bold text-gray-900">{progressData.overview?.certificatesIssued || 0}</p>
                <p className="text-xs text-yellow-600">
                  This period
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teaching Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle>Teaching Effectiveness</CardTitle>
          <CardDescription>Your impact on student learning and success</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{progressData.effectiveness?.retentionRate || 0}%</p>
              <p className="text-sm text-blue-600">Student Retention</p>
              <p className="text-xs text-blue-500 mt-1">Above platform average</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{progressData.performance?.averageGrade || 0}/100</p>
              <p className="text-sm text-green-600">Average Grade</p>
              <p className="text-xs text-green-500 mt-1">Student satisfaction</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{progressData.effectiveness?.teachingImpact?.averageImprovement || 0}%</p>
              <p className="text-sm text-purple-600">Avg Improvement</p>
              <p className="text-xs text-purple-500 mt-1">From start to finish</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual Student Dashboard Component
function IndividualStudentDashboard({
  progressData,
  onStudentSelect
}: {
  progressData: StudentProgress | null
  onStudentSelect: (studentId: string) => void
}) {
  if (!progressData?.student) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Student</h3>
          <p className="text-gray-500">Choose a student to view detailed progress analytics</p>
          <Button className="mt-4" onClick={() => onStudentSelect('mock-student-1')}>
            View Sample Student
          </Button>
        </CardContent>
      </Card>
    )
  }

  const student = progressData.student
  const analytics = progressData.analytics

  // Mock activity data for chart
  const activityData = [
    { date: '2024-01-01', timeSpent: 45, lessons: 2 },
    { date: '2024-01-02', timeSpent: 60, lessons: 3 },
    { date: '2024-01-03', timeSpent: 30, lessons: 1 },
    { date: '2024-01-04', timeSpent: 90, lessons: 4 },
    { date: '2024-01-05', timeSpent: 75, lessons: 3 },
    { date: '2024-01-06', timeSpent: 120, lessons: 5 },
    { date: '2024-01-07', timeSpent: 50, lessons: 2 }
  ]

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                <p className="text-gray-600">{student.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-green-100 text-green-800">
                    <Flame className="w-3 h-3 mr-1" />
                    {analytics.currentStreak} day streak
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Member since {new Date(student.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.completionRate}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
            <Progress value={analytics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.averageGrade.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Average Grade</div>
            <Progress value={analytics.averageGrade} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.coursesCompleted}</div>
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-xs text-gray-500 mt-1">{analytics.coursesInProgress} in progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(analytics.totalTimeSpent / 60)}h</div>
            <div className="text-sm text-gray-600">Time Spent</div>
            <div className="text-xs text-gray-500 mt-1">{analytics.learningVelocity}m/day avg</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{analytics.longestStreak}</div>
            <div className="text-sm text-gray-600">Longest Streak</div>
            <div className="text-xs text-gray-500 mt-1">days learning</div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Activity</CardTitle>
          <CardDescription>Daily learning time and lesson completion</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
              <Area type="monotone" dataKey="timeSpent" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Time (minutes)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
          <CardDescription>Detailed progress across enrolled courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressData.progress.enrolledCourses.map((course) => (
              <div key={course._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    course.progress?.completionPercentage >= 80 ? 'bg-green-500' :
                    course.progress?.completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{course.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="outline">{course.difficulty}</Badge>
                      {course.progress?.lastAccessed && (
                        <span>Last accessed: {new Date(course.progress.lastAccessed).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {course.progress?.completionPercentage || 0}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Grade: {course.progress?.averageGrade || 0}/100
                  </div>
                  <Progress value={course.progress?.completionPercentage || 0} className="w-24 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Personalized suggestions for this student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 border-2 rounded-lg border-blue-500 bg-blue-50 text-blue-700`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium mb-1">{rec.title}</h4>
                      <p className="text-sm mb-2">{rec.description}</p>
                      <p className="text-sm font-medium">{rec.action}</p>
                    </div>
                    <Badge>{rec.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Intervention Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Intervention Alerts
            </CardTitle>
            <CardDescription>Automated alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.interventionAlerts.map((alert, index) => (
                <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-red-100 text-red-800">
                          {alert.severity}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(alert.triggerDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-red-700">{alert.message}</p>
                      <div className="mt-2 flex gap-2">
                        {alert.autoActions.map((action, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {action.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Take Action
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}

              {progressData.interventionAlerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p>No intervention alerts</p>
                  <p className="text-sm">Student is performing well!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Class Analytics Dashboard Component
function ClassAnalyticsDashboard({
  progressData,
  onClassSelect
}: {
  progressData: ClassProgress | null
  onClassSelect: (classId: string) => void
}) {
  if (!progressData?.classInfo) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Class</h3>
          <p className="text-gray-500">Choose a class to view analytics and student distribution</p>
          <Button className="mt-4" onClick={() => onClassSelect('mock-class-1')}>
            View Sample Class
          </Button>
        </CardContent>
      </Card>
    )
  }

  const classInfo = progressData.classInfo
  const analytics = progressData.analytics

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{classInfo.className}</h2>
              <p className="text-gray-600">{classInfo.enrolledStudents.length} students enrolled</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="text-green-600">
                  Class Health: {analytics.classHealth.overall}
                </Badge>
                <Badge variant="outline">
                  {analytics.classHealth.engagementLevel} engagement
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {analytics.classHealth.averageCompletion}%
              </div>
              <div className="text-sm text-gray-500">Average Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Distribution</CardTitle>
          <CardDescription>How students are performing across the class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-700">{analytics.distribution.excelling}</div>
              <div className="text-sm text-green-600">Excelling Students</div>
              <div className="text-xs text-green-500">85+ average grade</div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-700">{analytics.distribution.onTrack}</div>
              <div className="text-sm text-blue-600">On Track</div>
              <div className="text-xs text-blue-500">70-84 average grade</div>
            </div>
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-red-700">{analytics.distribution.struggling}</div>
              <div className="text-sm text-red-600">Needs Support</div>
              <div className="text-xs text-red-500">&lt;70 average grade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Alert */}
      {analytics.classHealth.atRiskPercentage > 20 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">High At-Risk Percentage</h3>
                <p className="text-red-700">
                  {analytics.classHealth.atRiskPercentage}% of students are at risk of not completing the course
                </p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Create Intervention Plan
                  </Button>
                  <Button size="sm" variant="outline">
                    Contact All Students
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Overview</CardTitle>
          <CardDescription>Individual student performance in this class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {classInfo.enrolledStudents.map((enrollment) => (
              <div key={enrollment.user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {enrollment.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{enrollment.user.name}</h4>
                    <p className="text-sm text-gray-500">{enrollment.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {enrollment.status}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-medium">75%</div>
                    <div className="text-xs text-gray-500">completion</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onClassSelect(enrollment.user._id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
