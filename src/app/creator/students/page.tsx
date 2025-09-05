'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  MoreVertical,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Mail,
  FileText,
  Edit,
  Trash2,
  Eye,
  Send,
  UserPlus,
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface StudentClass {
  _id: string
  className: string
  description: string
  status: 'active' | 'completed' | 'draft'
  enrolledStudents: Student[]
  assignedCourses: AssignedCourse[]
  createdAt: string
  schedule?: {
    startDate: string
    endDate: string
    meetingDays: string[]
    meetingTime: string
  }
}

interface Student {
  _id: string
  name: string
  email: string
  enrollmentDate: string
  status: 'active' | 'inactive' | 'completed'
  progress: {
    coursesCompleted: number
    totalCourses: number
    averageGrade: number
    certificatesEarned: number
  }
  lastActivity: string
}

interface AssignedCourse {
  course: {
    _id: string
    title: string
    difficulty: string
  }
  assignmentDate: string
  dueDate?: string
  mandatory: boolean
  weight: number
}

export default function StudentManagementPage() {
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/creator/classes')
      const data = await response.json()

      if (data.success) {
        setClasses(data.classes)
        if (data.classes.length > 0 && !selectedClass) {
          setSelectedClass(data.classes[0])
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = selectedClass?.enrolledStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus
    return matchesSearch && matchesStatus
  }) || []

  const getClassStats = (classData: StudentClass) => {
    const students = classData.enrolledStudents
    const totalStudents = students.length
    const activeStudents = students.filter(s => s.status === 'active').length
    const completedStudents = students.filter(s => s.status === 'completed').length
    const averageProgress = students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.progress.coursesCompleted / Math.max(s.progress.totalCourses, 1)) * 100, 0) / students.length)
      : 0

    return {
      totalStudents,
      activeStudents,
      completedStudents,
      averageProgress
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
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
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">Manage your classes, students, and track their progress</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAddStudentsModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Students
          </Button>
          <Button onClick={() => setShowCreateClassModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">
                  {classes.reduce((sum, cls) => sum + cls.enrolledStudents.length, 0)}
                </p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold">
                  {classes.reduce((sum, cls) => sum + cls.enrolledStudents.filter(s => s.status === 'active').length, 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Certificates Issued</p>
                <p className="text-2xl font-bold">
                  {classes.reduce((sum, cls) =>
                    sum + cls.enrolledStudents.reduce((s, student) => s + student.progress.certificatesEarned, 0), 0
                  )}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Classes Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Classes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {classes.map((classItem) => {
                  const stats = getClassStats(classItem)
                  const isSelected = selectedClass?._id === classItem._id

                  return (
                    <button
                      key={classItem._id}
                      onClick={() => setSelectedClass(classItem)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                          {classItem.className}
                        </h3>
                        <Badge className={`text-xs ${
                          classItem.status === 'active' ? 'bg-green-100 text-green-800' :
                          classItem.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {classItem.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {stats.totalStudents} students • {stats.averageProgress}% avg progress
                      </div>
                    </button>
                  )
                })}

                {classes.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No classes yet</p>
                    <p className="text-sm">Create your first class to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {selectedClass ? (
            <>
              {/* Class Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedClass.className}
                        <Badge className={getStatusColor(selectedClass.status)}>
                          {selectedClass.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{selectedClass.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Class
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Export Data
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Class
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const stats = getClassStats(selectedClass)
                      return (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                            <div className="text-sm text-gray-500">Total Students</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.activeStudents}</div>
                            <div className="text-sm text-gray-500">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.completedStudents}</div>
                            <div className="text-sm text-gray-500">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</div>
                            <div className="text-sm text-gray-500">Avg Progress</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Students Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Students</CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredStudents.map((student) => (
                      <div key={student._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {student.progress.coursesCompleted}/{student.progress.totalCourses}
                            </div>
                            <div className="text-xs text-gray-500">Courses</div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {student.progress.averageGrade}%
                            </div>
                            <div className="text-xs text-gray-500">Grade</div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {student.progress.certificatesEarned}
                            </div>
                            <div className="text-xs text-gray-500">Certificates</div>
                          </div>

                          <div className="w-24">
                            <Progress
                              value={(student.progress.coursesCompleted / Math.max(student.progress.totalCourses, 1)) * 100}
                              className="h-2"
                            />
                          </div>

                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Award className="w-4 h-4 mr-2" />
                                Issue Certificate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Student
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}

                    {filteredStudents.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No students found</p>
                        <p className="text-sm">
                          {searchQuery ? 'Try adjusting your search terms' : 'Add students to this class to get started'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Class Selected</h3>
                <p className="text-gray-500 mb-6">Select a class from the sidebar to view students and manage progress</p>
                <Button onClick={() => setShowCreateClassModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Class
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        open={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
        onSuccess={(newClass) => {
          setClasses([...classes, newClass])
          setSelectedClass(newClass)
          setShowCreateClassModal(false)
          toast.success('Class created successfully!')
        }}
      />

      {/* Add Students Modal */}
      <AddStudentsModal
        open={showAddStudentsModal}
        onClose={() => setShowAddStudentsModal(false)}
        selectedClass={selectedClass}
        onSuccess={() => {
          loadClasses()
          setShowAddStudentsModal(false)
          toast.success('Students added successfully!')
        }}
      />
    </div>
  )
}

// Create Class Modal Component
function CreateClassModal({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess: (newClass: StudentClass) => void
}) {
  const [formData, setFormData] = useState({
    className: '',
    description: '',
    startDate: '',
    endDate: '',
    meetingDays: [] as string[],
    meetingTime: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      const response = await fetch('/api/creator/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        onSuccess(result.class)
      } else {
        toast.error('Failed to create class')
      }
    } catch (error) {
      console.error('Error creating class:', error)
      toast.error('Failed to create class')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Set up a new class to manage students and assign courses
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="className">Class Name *</Label>
            <Input
              id="className"
              placeholder="e.g., Game Development Bootcamp"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the class..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Meeting Days</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {weekDays.map(day => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.meetingDays.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          meetingDays: [...formData.meetingDays, day]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          meetingDays: formData.meetingDays.filter(d => d !== day)
                        })
                      }
                    }}
                  />
                  <span className="text-sm">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="meetingTime">Meeting Time</Label>
            <Input
              id="meetingTime"
              placeholder="e.g., 10:00 AM - 11:30 AM"
              value={formData.meetingTime}
              onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Add Students Modal Component
function AddStudentsModal({ open, onClose, selectedClass, onSuccess }: {
  open: boolean
  onClose: () => void
  selectedClass: StudentClass | null
  onSuccess: () => void
}) {
  const [importMethod, setImportMethod] = useState<'email-list' | 'csv-upload'>('email-list')
  const [emailList, setEmailList] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClass) {
      toast.error('No class selected')
      return
    }

    try {
      setIsLoading(true)

      let emails: string[] = []

      if (importMethod === 'email-list') {
        emails = emailList.split('\n')
          .map(email => email.trim())
          .filter(email => email && email.includes('@'))
      } else if (csvFile) {
        // Parse CSV file
        const text = await csvFile.text()
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const emailIndex = headers.findIndex(h => h.includes('email'))

        if (emailIndex === -1) {
          toast.error('CSV must contain an email column')
          return
        }

        emails = lines.slice(1)
          .map(line => line.split(',')[emailIndex]?.trim())
          .filter(email => email && email.includes('@'))
      }

      if (emails.length === 0) {
        toast.error('No valid email addresses found')
        return
      }

      const response = await fetch(`/api/creator/classes/${selectedClass._id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
      })

      if (response.ok) {
        onSuccess()
      } else {
        toast.error('Failed to add students')
      }
    } catch (error) {
      console.error('Error adding students:', error)
      toast.error('Failed to add students')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Students to Class</DialogTitle>
          <DialogDescription>
            {selectedClass ? `Add students to "${selectedClass.className}"` : 'Select a class first'}
          </DialogDescription>
        </DialogHeader>

        {selectedClass && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email-list">Email List</TabsTrigger>
                <TabsTrigger value="csv-upload">CSV Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="email-list" className="space-y-4">
                <div>
                  <Label htmlFor="emails">Student Email Addresses</Label>
                  <Textarea
                    id="emails"
                    placeholder="Enter one email address per line:&#10;student1@school.edu&#10;student2@school.edu&#10;student3@school.edu"
                    value={emailList}
                    onChange={(e) => setEmailList(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter one email address per line. Each student will receive an invitation to join the class.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="csv-upload" className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">Upload CSV File</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Choose a CSV file with student information
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="csvFileInput"
                    />
                    <label htmlFor="csvFileInput">
                      <Button type="button" variant="outline" className="cursor-pointer">
                        Choose File
                      </Button>
                    </label>
                    {csvFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Selected: {csvFile.name}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    CSV should have columns: name, email, student_id (optional).
                    Make sure the email column is clearly labeled.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding Students...' : 'Add Students'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
