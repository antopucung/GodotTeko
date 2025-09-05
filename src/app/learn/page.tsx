'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Award,
  Play,
  ChevronRight,
  Filter,
  Search,
  TrendingUp,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'



// Updated Course interface to match API
interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: {
    id: string
    name: string
    avatar?: string
    bio?: string
  }
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  rating: number
  enrolled: number
  price: 'Free' | number
  featured?: boolean
  lessons: any[]
  createdAt: Date
  updatedAt: Date
}

const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']

export default function LearnPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/courses')
      const data = await response.json()

      if (data.success) {
        setCourses(data.courses)
        setFilteredCourses(data.courses)
        setCategories(['All Categories', ...data.filters.categories])
      } else {
        console.error('Failed to fetch courses:', data.error)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = courses

    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    if (selectedDifficulty !== 'All Levels') {
      filtered = filtered.filter(course => course.difficulty === selectedDifficulty)
    }

    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredCourses(filtered)
  }, [courses, selectedCategory, selectedDifficulty, searchQuery])

  const featuredCourses = courses.filter(course => course.featured)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Master Game Development Skills
            </h1>
            <p className="text-xl text-green-100 mb-8 leading-relaxed">
              Learn from industry experts with hands-on courses designed to take you from beginner to professional game developer
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Play className="w-5 h-5 mr-2" />
                Start Learning Free
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                Browse All Courses
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
              <div className="text-gray-600">Expert-Led Courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">5,000+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">25+</div>
              <div className="text-gray-600">Industry Experts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
              <div className="text-gray-600">Course Completion Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Courses</h2>
                <p className="text-gray-600">Hand-picked courses to jumpstart your learning journey</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                <Zap className="w-4 h-4 mr-1" />
                Popular
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map(course => (
                <CourseCard key={course.id} course={course} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Learning Paths */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Learning Path</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Structured learning journeys designed to take you from beginner to expert in your chosen field
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Complete Game Developer',
                description: 'Master all aspects of game development from concept to launch',
                courses: 8,
                duration: '40 hours',
                icon: '🎮',
                color: 'from-blue-500 to-purple-600'
              },
              {
                title: '3D Artist Specialist',
                description: 'Become proficient in 3D modeling, texturing, and animation',
                courses: 6,
                duration: '30 hours',
                icon: '🎨',
                color: 'from-green-500 to-blue-500'
              },
              {
                title: 'Programming Expert',
                description: 'Advanced coding techniques for game engines and tools',
                courses: 10,
                duration: '50 hours',
                icon: '💻',
                color: 'from-purple-500 to-pink-500'
              }
            ].map((path, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className={`h-32 bg-gradient-to-r ${path.color} flex items-center justify-center`}>
                  <span className="text-4xl">{path.icon}</span>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{path.title}</h3>
                  <p className="text-gray-600 mb-4">{path.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{path.courses} courses</span>
                    <span>{path.duration}</span>
                  </div>
                  <Button className="w-full group-hover:bg-blue-700">
                    Start Learning Path
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Course Catalog */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h2>
              <p className="text-gray-600">Explore our complete library of courses</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {!isLoading && filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No courses found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Join thousands of students learning game development with our expert-crafted courses
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Start Learning for Free
            </Button>
            <Button variant="outline" size="lg" className="border-gray-300 text-gray-300 hover:bg-gray-800">
              View Subscription Plans
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function CourseCard({ course, featured = false }: { course: Course; featured?: boolean }) {
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800'
  }

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${featured ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="relative">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {featured && (
          <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
            Featured
          </Badge>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={difficultyColors[course.difficulty]}>
            {course.difficulty}
          </Badge>
        </div>
        {course.price === 'Free' ? (
          <Badge className="absolute bottom-2 right-2 bg-green-600 text-white">
            Free
          </Badge>
        ) : (
          <Badge className="absolute bottom-2 right-2 bg-blue-600 text-white">
            ${course.price}
          </Badge>
        )}
      </div>

      <CardContent className="p-6">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {course.category}
          </Badge>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Clock className="w-4 h-4 mr-1" />
          <span className="mr-4">{course.duration}</span>
          <Users className="w-4 h-4 mr-1" />
          <span>{course.enrolled.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
            <span className="text-sm font-medium">{course.rating}</span>
          </div>
          <span className="text-sm text-gray-500">By {course.instructor.name}</span>
        </div>
      </CardContent>
    </Card>
  )
}
