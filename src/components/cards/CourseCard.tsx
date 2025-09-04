'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Video,
  Award
} from "lucide-react"
import { formatNumber } from '@/lib/utils'
import BaseCard, { BaseCardProps } from './BaseCard'

export interface CourseData {
  id: string
  title: string
  slug: string
  shortDescription?: string
  thumbnail?: {
    url: string
    alt?: string
  }
  instructor: {
    name: string
    avatar?: string
    title?: string
  }
  price: number
  currency: string
  duration: number // in minutes
  studentCount: number
  rating: number
  reviewCount: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  isEnrolled?: boolean
  isFree?: boolean
  isBestseller?: boolean
  isNew?: boolean
  completionRate?: number // 0-100 for enrolled courses
}

export interface CourseCardProps {
  course: CourseData
  variant?: BaseCardProps['variant']
  className?: string
  showProgress?: boolean
  showEnrollButton?: boolean
}

export default function CourseCard({
  course,
  variant = 'course',
  className,
  showProgress = false,
  showEnrollButton = true
}: CourseCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  const handleEnroll = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement enrollment
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Image Slot - Course thumbnail with play button
  const imageSlot = (
    <>
      {course.thumbnail ? (
        <Image
          src={course.thumbnail.url}
          alt={course.thumbnail.alt || course.title}
          width={400}
          height={300}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
          <Video className="w-16 h-16 text-blue-400" />
        </div>
      )}

      {/* Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
          <Play className="w-6 h-6 text-blue-600 fill-current" />
        </div>
      </div>
    </>
  )

  // Overlay Slot - Duration, level, and action buttons
  const overlaySlot = (
    <>
      {/* Duration (bottom-left) */}
      <div className="absolute bottom-3 left-3">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
          <div className="flex items-center space-x-1 text-white text-sm font-medium">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(course.duration)}</span>
          </div>
        </div>
      </div>

      {/* Like Button (top-right) */}
      <div className="absolute top-3 right-3">
        <Button
          size="sm"
          variant="ghost"
          className={`bg-white/80 hover:bg-white rounded-full h-8 w-8 p-0 shadow-sm transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
          }`}
          onClick={handleLike}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Level Badge (top-left) */}
      <div className="absolute top-3 left-3">
        <Badge
          className={`text-xs px-2 py-1 font-medium ${
            course.level === 'Beginner' ? 'bg-green-500 text-white' :
            course.level === 'Intermediate' ? 'bg-blue-500 text-white' :
            'bg-purple-500 text-white'
          }`}
        >
          {course.level}
        </Badge>
      </div>
    </>
  )

  // Badge Slot - Special status badges
  const badgeSlot = (
    <>
      {course.isBestseller && (
        <div className="absolute bottom-3 right-3">
          <Badge className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium">
            <Award className="w-3 h-3 mr-1" />
            BESTSELLER
          </Badge>
        </div>
      )}
      {course.isNew && !course.isBestseller && (
        <div className="absolute bottom-3 right-3">
          <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-md font-medium">
            NEW
          </Badge>
        </div>
      )}
      {course.isFree && (
        <div className="absolute bottom-3 right-3">
          <Badge className="bg-blue-500 text-white text-xs px-2 py-1 rounded-md font-medium">
            FREE
          </Badge>
        </div>
      )}
    </>
  )

  // Content Slot - Course details
  const contentSlot = (
    <>
      {/* Progress Bar (for enrolled courses) */}
      {showProgress && course.isEnrolled && course.completionRate !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{course.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${course.completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Title and Rating */}
      <div className="mb-3">
        <h3 className="text-white font-semibold text-lg leading-tight mb-2 line-clamp-2">
          {course.title}
        </h3>

        <div className="flex items-center space-x-3">
          {/* Rating */}
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-yellow-400 text-sm font-medium">{course.rating.toFixed(1)}</span>
            <span className="text-gray-400 text-sm">({formatNumber(course.reviewCount)})</span>
          </div>

          {/* Student Count */}
          <div className="flex items-center space-x-1 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{formatNumber(course.studentCount)}</span>
          </div>
        </div>
      </div>

      {/* Instructor and Category */}
      <div className="flex items-center justify-between mb-4">
        {/* Instructor */}
        <div className="flex items-center space-x-2">
          {course.instructor.avatar ? (
            <Image
              src={course.instructor.avatar}
              alt={course.instructor.name}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {course.instructor.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <div className="text-gray-300 text-sm font-medium">
              {course.instructor.name}
            </div>
            {course.instructor.title && (
              <div className="text-gray-500 text-xs">
                {course.instructor.title}
              </div>
            )}
          </div>
        </div>

        {/* Category */}
        <Badge className="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded-md border-0 font-medium">
          {course.category}
        </Badge>
      </div>

      {/* Price and Enroll Button */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          {course.isFree ? (
            <p className="text-green-400 font-bold text-xl">Free</p>
          ) : (
            <div>
              <p className="text-white font-bold text-xl">
                ${course.price}
              </p>
              {course.isEnrolled && (
                <p className="text-green-400 text-sm">Enrolled</p>
              )}
            </div>
          )}
        </div>

        {showEnrollButton && (
          <Button
            onClick={handleEnroll}
            className={`font-medium px-4 py-2 ${
              course.isEnrolled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {course.isEnrolled ? 'Continue' : course.isFree ? 'Enroll Free' : 'Enroll Now'}
          </Button>
        )}
      </div>
    </>
  )

  return (
    <BaseCard
      href={`/courses/${course.slug}`}
      variant={variant}
      aspectRatio="video" // Courses typically use 16:9 aspect ratio
      className={className}
      imageSlot={imageSlot}
      contentSlot={contentSlot}
      overlaySlot={overlaySlot}
      badgeSlot={badgeSlot}
    />
  )
}
