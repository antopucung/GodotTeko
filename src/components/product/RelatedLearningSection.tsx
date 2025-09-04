'use client'

import { useState, useEffect } from 'react'
import {
  GraduationCap,
  Clock,
  Users,
  Star,
  Play,
  ArrowRight,
  BookOpen,
  Award
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  rating: number
  enrolled: number
  price: 'Free' | number
}

interface RelatedLearningSectionProps {
  productCategory: string
  productTags?: string[]
  productTitle?: string
}

export default function RelatedLearningSection({
  productCategory,
  productTags = [],
  productTitle
}: RelatedLearningSectionProps) {
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch related courses from API based on product category and tags
    const fetchRelatedCourses = async () => {
      try {
        const queryParams = new URLSearchParams({
          category: productCategory,
          tags: productTags.join(','),
          limit: '3'
        })

        const response = await fetch(`/api/courses/recommendations?${queryParams}`)
        const data = await response.json()

        if (data.success && data.recommendations) {
          setRelatedCourses(data.recommendations)
        } else {
          // Fallback to mock data if API fails
          const mockCourses = getCourseRecommendations(productCategory, productTags)
          setRelatedCourses(mockCourses)
        }
      } catch (error) {
        console.error('Error fetching related courses:', error)
        // Fallback to mock data
        const mockCourses = getCourseRecommendations(productCategory, productTags)
        setRelatedCourses(mockCourses)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedCourses()
  }, [productCategory, productTags])

  // Mock function to get course recommendations
  const getCourseRecommendations = (category: string, tags: string[]): Course[] => {
    const allCourses: Course[] = [
      {
        id: '1',
        title: 'Complete Game Development with Godot',
        description: 'Learn to create 2D and 3D games from scratch using the Godot engine',
        thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=225&fit=crop',
        instructor: 'Alex Johnson',
        duration: '12 hours',
        difficulty: 'Beginner',
        category: 'Game Development',
        rating: 4.8,
        enrolled: 1247,
        price: 'Free'
      },
      {
        id: '2',
        title: '3D Character Modeling in Blender',
        description: 'Master the art of creating game-ready characters with professional techniques',
        thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
        instructor: 'Maria Rodriguez',
        duration: '8 hours',
        difficulty: 'Intermediate',
        category: '3D Modeling',
        rating: 4.9,
        enrolled: 892,
        price: 'Free'
      },
      {
        id: '3',
        title: 'UI/UX Design for Games',
        description: 'Create intuitive and engaging user interfaces for modern games',
        thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop',
        instructor: 'David Kim',
        duration: '6 hours',
        difficulty: 'Beginner',
        category: 'UI/UX Design',
        rating: 4.7,
        enrolled: 634,
        price: 'Free'
      },
      {
        id: '4',
        title: 'Environment Art for Games',
        description: 'Design stunning game environments and landscapes',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=225&fit=crop',
        instructor: 'Emma Wilson',
        duration: '10 hours',
        difficulty: 'Intermediate',
        category: 'Environment Design',
        rating: 4.8,
        enrolled: 567,
        price: 29
      }
    ]

    // Filter courses based on category and tags
    const categoryMatches = allCourses.filter(course =>
      course.category.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(course.category.toLowerCase())
    )

    // If we have category matches, return them, otherwise return a mix
    if (categoryMatches.length >= 2) {
      return categoryMatches.slice(0, 3)
    }

    // Return top-rated courses as fallback
    return allCourses.slice(0, 3)
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 border border-green-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (relatedCourses.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 border border-green-100 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <GraduationCap className="w-6 h-6 mr-3 text-green-600" />
            Want to create assets like this?
          </h3>
          <p className="text-gray-600 max-w-2xl">
            Master the skills behind this {productCategory.toLowerCase()} with our expert-led courses.
            Learn the techniques and tools professionals use to create stunning game assets.
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 px-3 py-1 whitespace-nowrap">
          <BookOpen className="w-4 h-4 mr-1" />
          Learn & Create
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {relatedCourses.map(course => (
          <CourseRecommendationCard key={course.id} course={course} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg p-4 border border-green-200">
        <div className="flex items-center mb-4 sm:mb-0">
          <Award className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            Course access included with Individual plan or higher
          </span>
        </div>
        <div className="flex gap-3">
          <Link href="/learn">
            <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
              Browse All Courses
            </Button>
          </Link>
          <Link href="/all-access">
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Upgrade Plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function CourseRecommendationCard({ course }: { course: Course }) {
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800'
  }

  return (
    <Link href={`/learn/courses/${course.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group h-full bg-white border-green-200">
        <div className="relative">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-2 left-2">
            <Badge className={difficultyColors[course.difficulty]}>
              {course.difficulty}
            </Badge>
          </div>
          <div className="absolute top-2 right-2">
            {course.price === 'Free' ? (
              <Badge className="bg-green-600 text-white text-xs">
                Free
              </Badge>
            ) : (
              <Badge className="bg-blue-600 text-white text-xs">
                ${course.price}
              </Badge>
            )}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>

        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2 text-sm leading-tight">
            {course.title}
          </h4>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center">
              <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
              <span>{course.rating}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">By {course.instructor}</span>
            <div className="flex items-center text-xs text-gray-500">
              <Users className="w-3 h-3 mr-1" />
              <span>{course.enrolled.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
