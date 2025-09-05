'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Heart,
  ShoppingCart,
  Download,
  Star,
  Palette,
  Code,
  Monitor,
  Smartphone,
  Camera,
  Music,
  X,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
  optional?: boolean
}

interface OnboardingStepProps {
  onNext: () => void
  onPrevious: () => void
  onSkip?: () => void
  isFirst: boolean
  isLast: boolean
  data: any
  setData: (data: any) => void
}

interface UserPreferences {
  interests: string[]
  experience: string
  primaryUse: string
  bio?: string
  website?: string
  favoriteCategories: string[]
}

const categories = [
  { id: 'ui-kits', name: 'UI Kits', icon: Monitor, color: 'bg-blue-500' },
  { id: 'icons', name: 'Icons', icon: Star, color: 'bg-purple-500' },
  { id: 'templates', name: 'Templates', icon: Code, color: 'bg-green-500' },
  { id: 'illustrations', name: 'Illustrations', icon: Palette, color: 'bg-pink-500' },
  { id: 'mobile', name: 'Mobile UI', icon: Smartphone, color: 'bg-orange-500' },
  { id: 'photos', name: 'Photos', icon: Camera, color: 'bg-red-500' },
  { id: 'audio', name: 'Audio', icon: Music, color: 'bg-indigo-500' },
]

const experienceLevels = [
  { id: 'beginner', name: 'Beginner', description: 'Just starting out with design' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some experience with design tools' },
  { id: 'advanced', name: 'Advanced', description: 'Experienced designer or developer' },
  { id: 'expert', name: 'Expert', description: 'Professional with years of experience' },
]

const primaryUses = [
  { id: 'personal', name: 'Personal Projects', description: 'Learning and side projects' },
  { id: 'freelance', name: 'Freelance Work', description: 'Client projects and consulting' },
  { id: 'agency', name: 'Agency/Company', description: 'Professional team environment' },
  { id: 'startup', name: 'Startup', description: 'Building your own product' },
]

export function UserOnboarding({ onComplete }: { onComplete: () => void }) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<UserPreferences>({
    interests: [],
    experience: '',
    primaryUse: '',
    favoriteCategories: []
  })
  const [isVisible, setIsVisible] = useState(false)

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Godot Tekko!',
      description: 'Let\'s personalize your experience',
      component: WelcomeStep
    },
    {
      id: 'interests',
      title: 'What interests you?',
      description: 'Choose your favorite design categories',
      component: InterestsStep
    },
    {
      id: 'experience',
      title: 'Your experience level',
      description: 'Help us recommend the right content',
      component: ExperienceStep
    },
    {
      id: 'usage',
      title: 'How will you use Godot Tekko?',
      description: 'We\'ll tailor recommendations to your needs',
      component: UsageStep
    },
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add some details about yourself',
      component: ProfileStep,
      optional: true
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      description: 'Welcome to the Godot Tekko community',
      component: CompleteStep
    }
  ]

  useEffect(() => {
    // Check if user needs onboarding
    const hasCompletedOnboarding = localStorage.getItem('godot-tekko-onboarding-completed')
    if (!hasCompletedOnboarding && session?.user) {
      setIsVisible(true)
    }
  }, [session])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleComplete = async () => {
    try {
      // Save onboarding data to user profile
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      })

      // Mark onboarding as completed
      localStorage.setItem('godot-tekko-onboarding-completed', 'true')

      setIsVisible(false)
      onComplete()

      toast.success('Welcome to UI8! Your profile has been set up.')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Failed to save onboarding data')
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('ui8-onboarding-completed', 'true')
    onComplete()
  }

  if (!isVisible || !session?.user) return null

  const CurrentStepComponent = steps[currentStep].component
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
              <p className="opacity-90">{steps[currentStep].description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="bg-white/20" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <CurrentStepComponent
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={steps[currentStep].optional ? handleSkip : undefined}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
            data={onboardingData}
            setData={setOnboardingData}
          />
        </div>
      </div>
    </div>
  )
}

// Individual step components
function WelcomeStep({ onNext, isFirst }: OnboardingStepProps) {
  const { data: session } = useSession()

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-2">
          Welcome, {session?.user?.name?.split(' ')[0]}! 👋
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          We're excited to have you join our community of designers and creators.
          Let's set up your profile so we can recommend the perfect resources for you.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm font-medium">11,475+ Resources</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-medium">948k+ Designers</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Star className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium">Top Quality</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Heart className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-sm font-medium">Loved by All</p>
        </div>
      </div>

      <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 px-8">
        Let's Get Started
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}

function InterestsStep({ onNext, onPrevious, data, setData }: OnboardingStepProps) {
  const toggleCategory = (categoryId: string) => {
    const newCategories = data.favoriteCategories.includes(categoryId)
      ? data.favoriteCategories.filter((id: string) => id !== categoryId)
      : [...data.favoriteCategories, categoryId]

    setData({ ...data, favoriteCategories: newCategories })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">What type of design resources interest you most?</h3>
        <p className="text-gray-600">Select all that apply - we'll use this to personalize your feed</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category) => {
          const Icon = category.icon
          const isSelected = data.favoriteCategories.includes(category.id)

          return (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center ${category.color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-medium text-sm">{category.name}</p>
              {isSelected && (
                <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mt-2" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={data.favoriteCategories.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function ExperienceStep({ onNext, onPrevious, data, setData }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">What's your experience level?</h3>
        <p className="text-gray-600">This helps us recommend content at the right level</p>
      </div>

      <div className="space-y-3">
        {experienceLevels.map((level) => (
          <button
            key={level.id}
            onClick={() => setData({ ...data, experience: level.id })}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:scale-[1.02] ${
              data.experience === level.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{level.name}</h4>
                <p className="text-gray-600 text-sm">{level.description}</p>
              </div>
              {data.experience === level.id && (
                <CheckCircle className="w-6 h-6 text-blue-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!data.experience}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function UsageStep({ onNext, onPrevious, data, setData }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">How will you use UI8 resources?</h3>
        <p className="text-gray-600">This helps us suggest the right licensing and pricing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {primaryUses.map((use) => (
          <button
            key={use.id}
            onClick={() => setData({ ...data, primaryUse: use.id })}
            className={`p-6 rounded-lg border-2 text-center transition-all hover:scale-105 ${
              data.primaryUse === use.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h4 className="font-semibold mb-2">{use.name}</h4>
            <p className="text-gray-600 text-sm">{use.description}</p>
            {data.primaryUse === use.id && (
              <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mt-3" />
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!data.primaryUse}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function ProfileStep({ onNext, onPrevious, onSkip, data, setData }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Complete your profile</h3>
        <p className="text-gray-600">Add some details to help the community get to know you (optional)</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <Textarea
            placeholder="Tell us about yourself, your design style, or what you're working on..."
            value={data.bio || ''}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Website or Portfolio</label>
          <Input
            type="url"
            placeholder="https://yourportfolio.com"
            value={data.website || ''}
            onChange={(e) => setData({ ...data, website: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <div className="space-x-2">
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function CompleteStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-2">You're all set! 🎉</h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          Welcome to the UI8 community! Your personalized feed is ready, and we've tailored
          recommendations based on your preferences.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h4 className="font-semibold mb-3">What's next?</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-medium">Explore curated picks</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Heart className="w-5 h-5 text-green-600" />
            </div>
            <p className="font-medium">Follow creators</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <p className="font-medium">Start downloading</p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} className="bg-green-600 hover:bg-green-700 px-8">
        Start Exploring UI8
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}
