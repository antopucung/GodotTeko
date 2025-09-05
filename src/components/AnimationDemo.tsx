'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { TemplateCard, type TemplateData } from '@/components/cards'
import { useCardAnimations } from '@/hooks/useCardAnimations'

// Sample template data
const sampleTemplates: TemplateData[] = [
  {
    id: 'template-1',
    title: 'Modern Dashboard Template',
    slug: 'modern-dashboard',
    shortDescription: 'Clean and modern dashboard with dark mode support',
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      alt: 'Modern Dashboard Template'
    },
    livePreviewUrl: 'https://example.com/preview',
    author: {
      name: 'Design Studio',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      slug: 'design-studio'
    },
    price: 79,
    currency: 'USD',
    category: 'Dashboard',
    technologies: ['React', 'TypeScript', 'Tailwind'],
    features: ['Responsive', 'Dark Mode', 'API Ready'],
    pages: 12,
    isResponsive: true,
    hasDarkMode: true,
    isPopular: true,
    isFree: false,
    isNew: false,
    stats: {
      likes: 1250,
      views: 15600,
      downloads: 890,
      rating: 4.8
    }
  },
  {
    id: 'template-2',
    title: 'E-commerce Starter Kit',
    slug: 'ecommerce-starter',
    shortDescription: 'Complete e-commerce solution with payment integration',
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
      alt: 'E-commerce Template'
    },
    livePreviewUrl: 'https://example.com/preview',
    author: {
      name: 'UI Experts',
      slug: 'ui-experts'
    },
    price: 0,
    currency: 'USD',
    category: 'E-commerce',
    technologies: ['Vue', 'Nuxt', 'CSS'],
    features: ['Payment Ready', 'SEO Optimized'],
    pages: 8,
    isResponsive: true,
    hasDarkMode: false,
    isPopular: false,
    isFree: true,
    isNew: true,
    stats: {
      likes: 890,
      views: 12400,
      downloads: 1200,
      rating: 4.6
    }
  },
  {
    id: 'template-3',
    title: 'SaaS Landing Page',
    slug: 'saas-landing',
    shortDescription: 'High-converting landing page for SaaS products',
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
      alt: 'SaaS Landing Page'
    },
    author: {
      name: 'Landing Pro',
      slug: 'landing-pro'
    },
    price: 49,
    currency: 'USD',
    category: 'Landing Page',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    features: ['Conversion Optimized', 'A/B Test Ready'],
    pages: 5,
    isResponsive: true,
    hasDarkMode: true,
    isPopular: false,
    isFree: false,
    isNew: false,
    stats: {
      likes: 654,
      views: 8900,
      downloads: 445,
      rating: 4.7
    }
  }
]

export default function AnimationDemo() {
  const [showTemplates, setShowTemplates] = useState(false)

  // Use container for staggered animations
  const containerRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="bg-gray-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Demo Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            ✨ Enhanced Card Animations Demo
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Showcasing TemplateCard with staggered loading and micro-interactions
          </p>

          <Button
            onClick={() => setShowTemplates(!showTemplates)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium transform transition-all duration-200 hover:scale-105"
          >
            {showTemplates ? '🔄 Reset Animation' : '🚀 Show Templates'}
          </Button>
        </div>

        {/* Animation Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-2">🎭 Staggered Loading</h3>
            <p className="text-gray-300">Cards animate in with delays for smooth visual flow</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-2">🎯 Micro-interactions</h3>
            <p className="text-gray-300">Buttons provide immediate feedback with scale effects</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-2">📊 Animated Counters</h3>
            <p className="text-gray-300">Like counts animate smoothly from 0 to final value</p>
          </div>
        </div>

        {/* Template Grid */}
        {showTemplates && (
          <div ref={containerRef} className="grid-products">
            {sampleTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                showQuickActions={true}
                variant="category"
              />
            ))}
          </div>
        )}

        {/* Feature Notes */}
        <div className="mt-16 bg-gray-800 p-8 rounded-xl">
          <h3 className="text-2xl font-semibold text-white mb-4">🎨 Animation Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">Visual Enhancements:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Staggered card appearance (120ms delays)</li>
                <li>• Smooth scale effects on hover</li>
                <li>• Bouncing badges for featured items</li>
                <li>• Floating icons for empty states</li>
                <li>• Animated like counters</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Interaction Feedback:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Button press animations</li>
                <li>• Loading states with visual feedback</li>
                <li>• Hover state micro-transitions</li>
                <li>• Touch-optimized mobile interactions</li>
                <li>• Accessibility-friendly animations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Design Preservation Note */}
        <div className="mt-8 bg-blue-900/20 border border-blue-600/30 p-6 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div>
              <h4 className="text-blue-300 font-semibold mb-2">Design Preservation</h4>
              <p className="text-blue-200 text-sm">
                All animations enhance the existing beautiful card design without changing the visual layout.
                The cream backgrounds, dark sections, and typography remain exactly as designed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
