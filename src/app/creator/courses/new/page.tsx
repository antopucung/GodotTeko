'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Plus,
  Trash2,
  Play,
  FileText,
  Image,
  Video,
  HelpCircle,
  Eye,
  Save,
  Loader2,
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface CourseData {
  // Basic Info
  title: string
  description: string
  longDescription: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number

  // Pricing
  price: {
    free: boolean
    amount: number
    currency: string
  }
  accessLevel: string

  // Media
  thumbnail: string

  // Content
  lessons: Lesson[]
  skills: string[]
  prerequisites: string[]

  // Certificate
  certificate: {
    enabled: boolean
    template: string
    completionThreshold: number
  }
}

interface Lesson {
  id: string
  title: string
  description: string
  videoUrl: string
  duration: number
  content: string
  resources: Resource[]
  quiz: Quiz | null
}

interface Resource {
  title: string
  fileUrl: string
  fileSize: number
}

interface Quiz {
  questions: QuizQuestion[]
  passingScore: number
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

const COURSE_CATEGORIES = [
  'Game Development',
  '3D Modeling',
  'Programming',
  'Animation',
  'UI/UX Design',
  'Digital Art',
  'Audio Design',
  'Game Design'
]

const ACCESS_LEVELS = [
  { value: 'free', label: 'Free Access' },
  { value: 'student', label: 'Student Plan' },
  { value: 'individual', label: 'Individual Plan' },
  { value: 'professional', label: 'Professional Plan' },
  { value: 'team', label: 'Team Plan' }
]

export default function CourseCreationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    longDescription: '',
    category: '',
    difficulty: 'beginner',
    duration: 1,
    price: {
      free: true,
      amount: 0,
      currency: 'usd'
    },
    accessLevel: 'free',
    thumbnail: '',
    lessons: [],
    skills: [],
    prerequisites: [],
    certificate: {
      enabled: true,
      template: '',
      completionThreshold: 80
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const steps = [
    {
      title: 'Course Basics',
      description: 'Essential course information',
      icon: FileText
    },
    {
      title: 'Pricing & Access',
      description: 'Set pricing and access levels',
      icon: Badge
    },
    {
      title: 'Course Content',
      description: 'Build lessons and structure',
      icon: Play
    },
    {
      title: 'Quiz & Assessment',
      description: 'Add quizzes and assessments',
      icon: HelpCircle
    },
    {
      title: 'Preview & Publish',
      description: 'Review and publish course',
      icon: Eye
    }
  ]

  const validateStep = (stepIndex: number) => {
    const newErrors: any = {}

    switch (stepIndex) {
      case 0: // Course Basics
        if (!courseData.title.trim()) newErrors.title = 'Title is required'
        if (!courseData.description.trim()) newErrors.description = 'Description is required'
        if (!courseData.category) newErrors.category = 'Category is required'
        if (courseData.duration < 0.5) newErrors.duration = 'Duration must be at least 30 minutes'
        break

      case 1: // Pricing & Access
        if (!courseData.price.free && courseData.price.amount <= 0) {
          newErrors.price = 'Price must be greater than 0 for paid courses'
        }
        break

      case 2: // Course Content
        if (courseData.lessons.length === 0) {
          newErrors.lessons = 'At least one lesson is required'
        } else {
          courseData.lessons.forEach((lesson, index) => {
            if (!lesson.title.trim()) {
              newErrors[`lesson_${index}_title`] = 'Lesson title is required'
            }
            if (!lesson.videoUrl && !lesson.content) {
              newErrors[`lesson_${index}_content`] = 'Lesson must have video or text content'
            }
          })
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 0))
  }

  const handleSaveDraft = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Course draft saved successfully!')
        router.push(`/creator/courses/${result.course._id}/edit`)
      } else {
        toast.error('Failed to save course draft')
      }
    } catch (error) {
      console.error('Error saving course draft:', error)
      toast.error('Failed to save course draft')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishCourse = async () => {
    if (!validateStep(currentStep)) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...courseData,
          published: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Course published successfully!')
        router.push(`/creator/courses/${result.course._id}`)
      } else {
        toast.error('Failed to publish course')
      }
    } catch (error) {
      console.error('Error publishing course:', error)
      toast.error('Failed to publish course')
    } finally {
      setIsLoading(false)
    }
  }

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `lesson_${Date.now()}`,
      title: '',
      description: '',
      videoUrl: '',
      duration: 5,
      content: '',
      resources: [],
      quiz: null
    }
    setCourseData({
      ...courseData,
      lessons: [...courseData.lessons, newLesson]
    })
  }

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    setCourseData({
      ...courseData,
      lessons: courseData.lessons.map(lesson =>
        lesson.id === lessonId ? { ...lesson, ...updates } : lesson
      )
    })
  }

  const deleteLesson = (lessonId: string) => {
    setCourseData({
      ...courseData,
      lessons: courseData.lessons.filter(lesson => lesson.id !== lessonId)
    })
  }

  const addQuizToLesson = (lessonId: string) => {
    const newQuiz: Quiz = {
      questions: [{
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }],
      passingScore: 70
    }
    updateLesson(lessonId, { quiz: newQuiz })
  }

  const updateQuizQuestion = (lessonId: string, questionIndex: number, updates: Partial<QuizQuestion>) => {
    const lesson = courseData.lessons.find(l => l.id === lessonId)
    if (lesson?.quiz) {
      const updatedQuestions = lesson.quiz.questions.map((q, index) =>
        index === questionIndex ? { ...q, ...updates } : q
      )
      updateLesson(lessonId, {
        quiz: { ...lesson.quiz, questions: updatedQuestions }
      })
    }
  }

  const completionPercentage = () => {
    let completed = 0
    let total = 5

    // Check each step completion
    if (courseData.title && courseData.description && courseData.category) completed++
    if (courseData.price.free || courseData.price.amount > 0) completed++
    if (courseData.lessons.length > 0) completed++
    if (courseData.lessons.some(l => l.quiz)) completed++
    if (courseData.thumbnail) completed++

    return Math.round((completed / total) * 100)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600">Build engaging educational content for your students</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {completionPercentage()}% complete
          </div>
          <Progress value={completionPercentage()} className="w-32" />
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <div key={index} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isActive ? 'border-blue-600 bg-blue-50' :
                      isCompleted ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-gray-50'}
                  `}>
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <StepIcon className={`w-5 h-5 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block w-20 h-0.5 bg-gray-200 mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Step 0: Course Basics */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Course Basics</CardTitle>
                <CardDescription>Set up the fundamental information for your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Complete Game Development with Godot"
                    value={courseData.title}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of what students will learn..."
                    value={courseData.description}
                    onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                    className={errors.description ? 'border-red-500' : ''}
                    rows={3}
                  />
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <Label htmlFor="longDescription">Detailed Description</Label>
                  <Textarea
                    id="longDescription"
                    placeholder="Provide a comprehensive overview of the course content, learning objectives, and outcomes..."
                    value={courseData.longDescription}
                    onChange={(e) => setCourseData({ ...courseData, longDescription: e.target.value })}
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={courseData.category}
                      onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        errors.category ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select a category</option>
                      {COURSE_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <select
                      id="difficulty"
                      value={courseData.difficulty}
                      onChange={(e) => setCourseData({
                        ...courseData,
                        difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Estimated Duration (hours) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g., 8.5"
                    value={courseData.duration}
                    onChange={(e) => setCourseData({ ...courseData, duration: parseFloat(e.target.value) || 0 })}
                    className={errors.duration ? 'border-red-500' : ''}
                  />
                  {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
                </div>

                <div>
                  <Label htmlFor="skills">Skills Students Will Learn</Label>
                  <Input
                    id="skills"
                    placeholder="Enter skills separated by commas (e.g., 3D modeling, texturing, rigging)"
                    value={courseData.skills.join(', ')}
                    onChange={(e) => setCourseData({
                      ...courseData,
                      skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Pricing & Access */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Access</CardTitle>
                <CardDescription>Configure how students will access your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Course Pricing</Label>
                  <div className="space-y-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="free"
                        checked={courseData.price.free}
                        onChange={() => setCourseData({
                          ...courseData,
                          price: { ...courseData.price, free: true, amount: 0 }
                        })}
                      />
                      <Label htmlFor="free">Free Course</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="paid"
                        checked={!courseData.price.free}
                        onChange={() => setCourseData({
                          ...courseData,
                          price: { ...courseData.price, free: false }
                        })}
                      />
                      <Label htmlFor="paid">Paid Course</Label>
                    </div>
                  </div>
                </div>

                {!courseData.price.free && (
                  <div>
                    <Label htmlFor="amount">Course Price ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      placeholder="e.g., 49"
                      value={courseData.price.amount}
                      onChange={(e) => setCourseData({
                        ...courseData,
                        price: { ...courseData.price, amount: parseFloat(e.target.value) || 0 }
                      })}
                      className={errors.price ? 'border-red-500' : ''}
                    />
                    {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
                  </div>
                )}

                <div>
                  <Label htmlFor="accessLevel">Access Level Required</Label>
                  <select
                    id="accessLevel"
                    value={courseData.accessLevel}
                    onChange={(e) => setCourseData({ ...courseData, accessLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {ACCESS_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Students need this subscription level or higher to access the course
                  </p>
                </div>

                <div>
                  <Label htmlFor="thumbnail">Course Thumbnail</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Upload a thumbnail image for your course
                    </p>
                    <Button variant="outline" className="mt-2">
                      Choose File
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Course Content */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>Build your course curriculum with lessons and materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {errors.lessons && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{errors.lessons}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {courseData.lessons.map((lesson, index) => (
                    <Card key={lesson.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Lesson {index + 1}</Badge>
                            <span className="font-medium">
                              {lesson.title || 'Untitled Lesson'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLesson(lesson.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Lesson Title *</Label>
                          <Input
                            placeholder="e.g., Introduction to 3D Modeling"
                            value={lesson.title}
                            onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                            className={errors[`lesson_${index}_title`] ? 'border-red-500' : ''}
                          />
                          {errors[`lesson_${index}_title`] && (
                            <p className="text-sm text-red-500 mt-1">{errors[`lesson_${index}_title`]}</p>
                          )}
                        </div>

                        <div>
                          <Label>Lesson Description</Label>
                          <Textarea
                            placeholder="Brief description of what this lesson covers..."
                            value={lesson.description}
                            onChange={(e) => updateLesson(lesson.id, { description: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <Tabs defaultValue="video">
                          <TabsList>
                            <TabsTrigger value="video">Video Content</TabsTrigger>
                            <TabsTrigger value="text">Text Content</TabsTrigger>
                            <TabsTrigger value="resources">Resources</TabsTrigger>
                          </TabsList>

                          <TabsContent value="video" className="space-y-4">
                            <div>
                              <Label>Video URL</Label>
                              <Input
                                placeholder="https://youtube.com/watch?v=... or video file URL"
                                value={lesson.videoUrl}
                                onChange={(e) => updateLesson(lesson.id, { videoUrl: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="e.g., 15"
                                value={lesson.duration}
                                onChange={(e) => updateLesson(lesson.id, { duration: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="text">
                            <div>
                              <Label>Text Content</Label>
                              <Textarea
                                placeholder="Written lesson content, instructions, or notes..."
                                value={lesson.content}
                                onChange={(e) => updateLesson(lesson.id, { content: e.target.value })}
                                rows={6}
                                className={errors[`lesson_${index}_content`] ? 'border-red-500' : ''}
                              />
                              {errors[`lesson_${index}_content`] && (
                                <p className="text-sm text-red-500 mt-1">{errors[`lesson_${index}_content`]}</p>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="resources">
                            <div className="space-y-3">
                              <Label>Downloadable Resources</Label>
                              {lesson.resources.map((resource, resourceIndex) => (
                                <div key={resourceIndex} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                                  <Input
                                    placeholder="Resource title"
                                    value={resource.title}
                                    className="flex-1"
                                  />
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Resource
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Quiz for this lesson</span>
                          {lesson.quiz ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateLesson(lesson.id, { quiz: null })}
                            >
                              Remove Quiz
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addQuizToLesson(lesson.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Quiz
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    onClick={addLesson}
                    className="w-full border-2 border-dashed border-gray-300 py-8"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Quiz & Assessment */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Quiz & Assessment</CardTitle>
                <CardDescription>Configure quizzes and assessments for your lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {courseData.lessons.filter(l => l.quiz).map((lesson, index) => (
                    <Card key={lesson.id} className="border">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Quiz for: {lesson.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {lesson.quiz?.questions.map((question, qIndex) => (
                          <div key={qIndex} className="space-y-3 p-4 bg-gray-50 rounded">
                            <div>
                              <Label>Question {qIndex + 1}</Label>
                              <Input
                                placeholder="Enter your question..."
                                value={question.question}
                                onChange={(e) => updateQuizQuestion(lesson.id, qIndex, { question: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Answer Options</Label>
                              <div className="space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`question_${qIndex}`}
                                      checked={question.correctAnswer === oIndex}
                                      onChange={() => updateQuizQuestion(lesson.id, qIndex, { correctAnswer: oIndex })}
                                    />
                                    <Input
                                      placeholder={`Option ${oIndex + 1}`}
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...question.options]
                                        newOptions[oIndex] = e.target.value
                                        updateQuizQuestion(lesson.id, qIndex, { options: newOptions })
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}

                        <div>
                          <Label>Passing Score (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={lesson.quiz?.passingScore || 70}
                            onChange={(e) => updateLesson(lesson.id, {
                              quiz: lesson.quiz ? {
                                ...lesson.quiz,
                                passingScore: parseInt(e.target.value) || 70
                              } : null
                            })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {courseData.lessons.filter(l => l.quiz).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No quizzes added yet</p>
                      <p className="text-sm">Go back to Course Content to add quizzes to your lessons</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Preview & Publish */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview & Publish</CardTitle>
                <CardDescription>Review your course and publish when ready</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Course Overview</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> {courseData.title}</div>
                      <div><strong>Category:</strong> {courseData.category}</div>
                      <div><strong>Difficulty:</strong> {courseData.difficulty}</div>
                      <div><strong>Duration:</strong> {courseData.duration} hours</div>
                      <div><strong>Lessons:</strong> {courseData.lessons.length}</div>
                      <div><strong>Quizzes:</strong> {courseData.lessons.filter(l => l.quiz).length}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Pricing & Access</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Price:</strong> {courseData.price.free ? 'Free' : `$${courseData.price.amount}`}</div>
                      <div><strong>Access Level:</strong> {courseData.accessLevel}</div>
                      <div><strong>Certificate:</strong> {courseData.certificate.enabled ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Certificate Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="certificateEnabled"
                        checked={courseData.certificate.enabled}
                        onChange={(e) => setCourseData({
                          ...courseData,
                          certificate: { ...courseData.certificate, enabled: e.target.checked }
                        })}
                      />
                      <Label htmlFor="certificateEnabled">Issue certificates upon completion</Label>
                    </div>

                    {courseData.certificate.enabled && (
                      <div>
                        <Label>Completion Threshold (%)</Label>
                        <Input
                          type="number"
                          min="50"
                          max="100"
                          value={courseData.certificate.completionThreshold}
                          onChange={(e) => setCourseData({
                            ...courseData,
                            certificate: {
                              ...courseData.certificate,
                              completionThreshold: parseInt(e.target.value) || 80
                            }
                          })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Course Progress</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Completion</span>
                  <span>{completionPercentage()}%</span>
                </div>
                <Progress value={completionPercentage()} />
                <div className="space-y-1 text-xs text-gray-600">
                  <div>✓ Basic info: {courseData.title ? 'Complete' : 'Pending'}</div>
                  <div>✓ Pricing: {courseData.price.free || courseData.price.amount > 0 ? 'Complete' : 'Pending'}</div>
                  <div>✓ Content: {courseData.lessons.length > 0 ? 'Complete' : 'Pending'}</div>
                  <div>✓ Media: {courseData.thumbnail ? 'Complete' : 'Pending'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handlePublishCourse}
                  disabled={isLoading || completionPercentage() < 80}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Publish Course
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
