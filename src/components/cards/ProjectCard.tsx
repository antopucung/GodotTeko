'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlayCircle, Calendar, Eye, Star, Users, Award, Clock } from "lucide-react"
import { useCardAnimations } from '@/hooks/useCardAnimations'

export interface GameProject {
  _id: string
  title: string
  slug: { current: string }
  description: string
  year: number
  status: 'released' | 'in_development' | 'cancelled'
  poster: string
  studio: {
    name: string
    image?: string
    slug?: { current: string }
  }
  platforms: string[]
  genre: string[]
  tech: string[]
  stats: {
    views: number
    likes: number
    downloads?: number
  }
  duration?: string // Development time
  team?: {
    size: number
    roles: string[]
  }
  featured?: boolean
}

export interface ProjectCardProps {
  project: GameProject
  className?: string
  variant?: 'grid' | 'featured'
  index?: number
}

export default function ProjectCard({
  project,
  className = '',
  variant = 'grid',
  index = 0
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Enhanced animations
  const {
    cardRef,
    isVisible,
    animationClass,
    handleMouseEnter: onMouseEnter,
    handleMouseLeave: onMouseLeave
  } = useCardAnimations(index, {
    staggerDelay: 150,
    threshold: 0.1,
    enableStagger: true,
    enableHover: true,
    enableInView: true
  })

  const handleCardMouseEnter = () => {
    setIsHovered(true)
    onMouseEnter()
  }

  const handleCardMouseLeave = () => {
    setIsHovered(false)
    onMouseLeave()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'released': return 'bg-green-100 text-green-800'
      case 'in_development': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'released': return 'Released'
      case 'in_development': return 'In Development'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  if (variant === 'featured') {
    return (
      <div
        ref={cardRef}
        className={`group cursor-pointer ${animationClass} ${className}`}
        onMouseEnter={handleCardMouseEnter}
        onMouseLeave={handleCardMouseLeave}
      >
        <Link href={`/play-station/projects/${project.slug.current}`}>
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-800">
            {/* Featured Project - Larger Layout */}
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={project.poster}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

              {/* Play Button Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform transition-all duration-300 hover:scale-110">
                  <PlayCircle className="w-12 h-12 text-gray-900" />
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <Badge className={`${getStatusColor(project.status)} font-medium`}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>

              {/* Featured Badge */}
              {project.featured && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-yellow-500 text-yellow-900 font-medium">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="mb-3">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                  {project.title}
                </h3>
                <div className="flex items-center gap-2 text-gray-300 text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{project.year}</span>
                  <span>•</span>
                  <span>{project.studio.name}</span>
                </div>
                <p className="text-gray-300 text-sm line-clamp-2 group-hover:text-gray-200">
                  {project.description}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{(project.stats.views / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{project.stats.likes}</span>
                  </div>
                  {project.team && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{project.team.size} devs</span>
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="sm" className="text-white hover:text-yellow-400 hover:bg-white/10">
                  View Project →
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // Grid variant (regular cards)
  return (
    <div
      ref={cardRef}
      className={`group cursor-pointer ${animationClass} ${className}`}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
    >
      <Link href={`/play-station/projects/${project.slug.current}`}>
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-800">
          {/* Project Poster */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={project.poster}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Hover Overlay */}
            <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 transform transition-all duration-300 hover:scale-110">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <Badge className={`${getStatusColor(project.status)} text-xs`}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>

            {/* Featured Badge */}
            {project.featured && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                  <Star className="w-3 h-3" />
                </Badge>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="p-4 bg-gray-900">
            <div className="mb-2">
              <h3 className="text-white font-semibold text-base leading-tight group-hover:text-yellow-400 transition-colors line-clamp-1">
                {project.title}
              </h3>
              <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                <span>{project.year}</span>
                <span>•</span>
                <span>{project.studio.name}</span>
              </div>
            </div>

            <p className="text-gray-300 text-sm line-clamp-2 mb-3">
              {project.description}
            </p>

            {/* Tech Stack */}
            {project.tech && project.tech.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {project.tech.slice(0, 2).map((tech, index) => (
                  <Badge key={index} variant="outline" className="text-xs text-gray-400 border-gray-600">
                    {tech}
                  </Badge>
                ))}
                {project.tech.length > 2 && (
                  <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                    +{project.tech.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{(project.stats.views / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>{project.stats.likes}</span>
                </div>
              </div>

              {project.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{project.duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
