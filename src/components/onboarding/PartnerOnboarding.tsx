'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PLATFORM_CONFIG } from '@/config/platform'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  DollarSign,
  Users,
  Star,
  AlertCircle,
  FileText,
  ExternalLink,
  Mail,
  Globe,
  X,
  Briefcase,
  Award,
  TrendingUp,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface PartnerApplication {
  personalInfo: {
    fullName: string
    email: string
    phone?: string
    location: string
    website?: string
    portfolio: string
  }
  professional: {
    experience: string
    specialties: string[]
    previousWork: string
    teamSize: string
    yearsActive: number
  }
  business: {
    businessType: string
    expectedRevenue: string
    targetAudience: string
    marketingStrategy: string
  }
  technical: {
    designTools: string[]
    fileFormats: string[]
    qualityStandards: boolean
    originalWork: boolean
    licensing: boolean
  }
  agreement: {
    terms: boolean
    commission: boolean
    quality: boolean
    exclusivity: boolean
  }
}

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
  validation?: (data: PartnerApplication) => boolean
}

interface OnboardingStepProps {
  onNext: () => void
  onPrevious: () => void
  onSkip?: () => void
  isFirst: boolean
  isLast: boolean
  data: PartnerApplication
  setData: (data: PartnerApplication) => void
}

const specialties = [
  'UI/UX Design', 'Mobile App Design', 'Web Design', 'Illustration',
  'Icon Design', 'Branding', 'Typography', 'Motion Graphics',
  'Print Design', 'Product Design', '3D Design', 'Photography'
]

const designTools = [
  'Figma', 'Sketch', 'Adobe XD', 'Adobe Illustrator', 'Adobe Photoshop',
  'Adobe After Effects', 'Principle', 'Framer', 'InVision', 'Webflow'
]

const fileFormats = [
  'Figma Files', 'Sketch Files', 'XD Files', 'AI Files', 'PSD Files',
  'PNG/JPG Images', 'SVG Vectors', 'GIF Animations', 'Video Files', 'Font Files'
]

export function PartnerOnboarding({ onComplete }: { onComplete: () => void }) {
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationData, setApplicationData] = useState<PartnerApplication>({
    personalInfo: {
      fullName: session?.user?.name || '',
      email: session?.user?.email || '',
      location: '',
      portfolio: ''
    },
    professional: {
      experience: '',
      specialties: [],
      previousWork: '',
      teamSize: '',
      yearsActive: 0
    },
    business: {
      businessType: '',
      expectedRevenue: '',
      targetAudience: '',
      marketingStrategy: ''
    },
    technical: {
      designTools: [],
      fileFormats: [],
      qualityStandards: false,
      originalWork: false,
      licensing: false
    },
    agreement: {
      terms: false,
      commission: false,
      quality: false,
      exclusivity: false
    }
  })

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Become a UI8 Partner',
      description: 'Join thousands of creators earning from their designs',
      component: WelcomeStep
    },
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      component: PersonalInfoStep,
      validation: (data) => !!(data.personalInfo.fullName && data.personalInfo.email && data.personalInfo.location)
    },
    {
      id: 'professional',
      title: 'Professional Background',
      description: 'Your design experience and expertise',
      component: ProfessionalStep,
      validation: (data) => !!(data.professional.experience && data.professional.specialties.length > 0)
    },
    {
      id: 'business',
      title: 'Business Information',
      description: 'How you plan to use the platform',
      component: BusinessStep,
      validation: (data) => !!(data.business.businessType && data.business.expectedRevenue)
    },
    {
      id: 'technical',
      title: 'Technical Requirements',
      description: 'Tools and file formats you work with',
      component: TechnicalStep,
      validation: (data) => !!(data.technical.designTools.length > 0 && data.technical.qualityStandards && data.technical.originalWork)
    },
    {
      id: 'agreement',
      title: 'Partnership Agreement',
      description: 'Terms and conditions',
      component: AgreementStep,
      validation: (data) => !!(data.agreement.terms && data.agreement.commission && data.agreement.quality)
    },
    {
      id: 'submit',
      title: 'Submit Application',
      description: 'Review and submit your partner application',
      component: SubmitStep
    }
  ]

  const handleNext = () => {
    const currentStepData = steps[currentStep]
    if (currentStepData.validation && !currentStepData.validation(applicationData)) {
      toast.error('Please complete all required fields before continuing')
      return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmitApplication()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmitApplication = async () => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      })

      if (response.ok) {
        const result = await response.json()
        localStorage.setItem('partner-application-submitted', 'true')
        toast.success('Application submitted successfully! We\'ll review it within 48 hours.')
        setIsVisible(false)
        onComplete()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showOnboarding = () => {
    setIsVisible(true)
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  useEffect(() => {
    // Check if this should be triggered (could be called from a "Become Partner" button)
    const shouldShow = new URLSearchParams(window.location.search).get('partner-onboarding')
    if (shouldShow === 'true' && session?.user) {
      setIsVisible(true)
    }
  }, [session])

  if (!isVisible || !session?.user) return null

  const CurrentStepComponent = steps[currentStep].component
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl">
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
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
            data={applicationData}
            setData={setApplicationData}
          />
        </div>
      </div>
    </div>
  )
}

// Individual step components
function WelcomeStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="text-center space-y-8">
      <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mx-auto flex items-center justify-center">
        <Briefcase className="w-12 h-12 text-white" />
      </div>

      <div>
        <h3 className="text-3xl font-bold mb-4">Start Earning From Your Designs</h3>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed text-lg">
          Join over 1,200 creators who earn consistent revenue by selling their digital products
          on UI8. Our partners earn an average of $2,500 per month.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">{PLATFORM_CONFIG.partner.commissionRate}% Commission</h4>
              <p className="text-sm text-gray-600">Keep most of what you earn</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Global Audience</h4>
              <p className="text-sm text-gray-600">Reach 948k+ designers worldwide</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Marketing Support</h4>
              <p className="text-sm text-gray-600">We promote your best work</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold mb-3">Application Process:</h4>
        <div className="flex justify-center space-x-8 text-sm">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center mx-auto mb-2 font-bold">1</div>
            <p>Submit Application</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center mx-auto mb-2 font-bold">2</div>
            <p>Review (24-48h)</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center mx-auto mb-2 font-bold">3</div>
            <p>Start Selling</p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} className="bg-purple-600 hover:bg-purple-700 px-8 text-lg py-3">
        Apply Now
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  )
}

function PersonalInfoStep({ onNext, onPrevious, data, setData }: OnboardingStepProps) {
  const updatePersonalInfo = (field: string, value: string) => {
    setData({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Tell us about yourself</h3>
        <p className="text-gray-600">This information will be used for your partner profile</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={data.personalInfo.fullName}
            onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.personalInfo.email}
            onChange={(e) => updatePersonalInfo('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={data.personalInfo.phone || ''}
            onChange={(e) => updatePersonalInfo('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={data.personalInfo.location}
            onChange={(e) => updatePersonalInfo('location', e.target.value)}
            placeholder="City, Country"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="website">Personal Website</Label>
        <Input
          id="website"
          type="url"
          value={data.personalInfo.website || ''}
          onChange={(e) => updatePersonalInfo('website', e.target.value)}
          placeholder="https://yourwebsite.com"
        />
      </div>

      <div>
        <Label htmlFor="portfolio">Portfolio URL *</Label>
        <Input
          id="portfolio"
          type="url"
          value={data.personalInfo.portfolio}
          onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
          placeholder="https://dribbble.com/yourusername or https://behance.net/yourusername"
        />
        <p className="text-sm text-gray-500 mt-1">
          Please provide a link to your best work (Dribbble, Behance, personal portfolio, etc.)
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-purple-600 hover:bg-purple-700">
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function ProfessionalStep({ onNext, onPrevious, data, setData }: OnboardingStepProps) {
  const updateProfessional = (field: string, value: any) => {
    setData({
      ...data,
      professional: {
        ...data.professional,
        [field]: value
      }
    })
  }

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = data.professional.specialties.includes(specialty)
      ? data.professional.specialties.filter(s => s !== specialty)
      : [...data.professional.specialties, specialty]
    updateProfessional('specialties', newSpecialties)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Professional Background</h3>
        <p className="text-gray-600">Help us understand your design expertise</p>
      </div>

      <div>
        <Label htmlFor="experience">Experience Level *</Label>
        <select
          id="experience"
          value={data.professional.experience}
          onChange={(e) => updateProfessional('experience', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="">Select your experience level</option>
          <option value="beginner">Beginner (0-1 years)</option>
          <option value="intermediate">Intermediate (2-4 years)</option>
          <option value="experienced">Experienced (5-8 years)</option>
          <option value="expert">Expert (8+ years)</option>
        </select>
      </div>

      <div>
        <Label>Design Specialties * (Select all that apply)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {specialties.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={`p-3 text-sm rounded-lg border-2 transition-all ${
                data.professional.specialties.includes(specialty)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="teamSize">Team Size</Label>
          <select
            id="teamSize"
            value={data.professional.teamSize}
            onChange={(e) => updateProfessional('teamSize', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="">Select team size</option>
            <option value="solo">Solo designer</option>
            <option value="small">Small team (2-5 people)</option>
            <option value="medium">Medium team (6-15 people)</option>
            <option value="large">Large team (15+ people)</option>
          </select>
        </div>

        <div>
          <Label htmlFor="yearsActive">Years in Design</Label>
          <Input
            id="yearsActive"
            type="number"
            min="0"
            max="50"
            value={data.professional.yearsActive}
            onChange={(e) => updateProfessional('yearsActive', parseInt(e.target.value) || 0)}
            placeholder="5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="previousWork">Previous Work Experience</Label>
        <Textarea
          id="previousWork"
          value={data.professional.previousWork}
          onChange={(e) => updateProfessional('previousWork', e.target.value)}
          placeholder="Describe your previous work, notable clients, projects, or achievements..."
          rows={4}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-purple-600 hover:bg-purple-700">
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function BusinessStep({ onNext, onPrevious, data, setData }: OnboardingStepProps) {
  const updateBusiness = (field: string, value: string) => {
    setData({
      ...data,
      business: {
        ...data.business,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Business Information</h3>
        <p className="text-gray-600">Help us understand your goals and target market</p>
      </div>

      <div>
        <Label htmlFor="businessType">Business Type *</Label>
        <select
          id="businessType"
          value={data.business.businessType}
          onChange={(e) => updateBusiness('businessType', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="">Select business type</option>
          <option value="freelancer">Freelancer / Individual</option>
          <option value="agency">Design Agency</option>
          <option value="studio">Design Studio</option>
          <option value="startup">Startup</option>
          <option value="company">Established Company</option>
        </select>
      </div>

      <div>
        <Label htmlFor="expectedRevenue">Expected Monthly Revenue *</Label>
        <select
          id="expectedRevenue"
          value={data.business.expectedRevenue}
          onChange={(e) => updateBusiness('expectedRevenue', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="">Select expected revenue range</option>
          <option value="500">$0 - $500</option>
          <option value="1500">$500 - $1,500</option>
          <option value="3000">$1,500 - $3,000</option>
          <option value="5000">$3,000 - $5,000</option>
          <option value="10000">$5,000 - $10,000</option>
          <option value="10000+">$10,000+</option>
        </select>
      </div>

      <div>
        <Label htmlFor="targetAudience">Target Audience</Label>
        <Textarea
          id="targetAudience"
          value={data.business.targetAudience}
          onChange={(e) => updateBusiness('targetAudience', e.target.value)}
          placeholder="Describe who you create designs for (startups, agencies, developers, etc.)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="marketingStrategy">How will you promote your products?</Label>
        <Textarea
          id="marketingStrategy"
          value={data.business.marketingStrategy}
          onChange={(e) => updateBusiness('marketingStrategy', e.target.value)}
          placeholder="Describe how you plan to market your products (social media, portfolio, email list, etc.)"
          rows={3}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-purple-600 hover:bg-purple-700">
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function TechnicalStep({ onNext, onPrevious, data, setData }: OnboardingStepProps) {
  const updateTechnical = (field: string, value: any) => {
    setData({
      ...data,
      technical: {
        ...data.technical,
        [field]: value
      }
    })
  }

  const toggleTool = (tool: string) => {
    const newTools = data.technical.designTools.includes(tool)
      ? data.technical.designTools.filter(t => t !== tool)
      : [...data.technical.designTools, tool]
    updateTechnical('designTools', newTools)
  }

  const toggleFormat = (format: string) => {
    const newFormats = data.technical.fileFormats.includes(format)
      ? data.technical.fileFormats.filter(f => f !== format)
      : [...data.technical.fileFormats, format]
    updateTechnical('fileFormats', newFormats)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Technical Requirements</h3>
        <p className="text-gray-600">Let us know about your tools and workflows</p>
      </div>

      <div>
        <Label>Design Tools * (Select all that you use)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {designTools.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              className={`p-3 text-sm rounded-lg border-2 transition-all ${
                data.technical.designTools.includes(tool)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>File Formats You Can Provide</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {fileFormats.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => toggleFormat(format)}
              className={`p-3 text-sm rounded-lg border-2 transition-all ${
                data.technical.fileFormats.includes(format)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-semibold">Quality Standards</h4>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="qualityStandards"
            checked={data.technical.qualityStandards}
            onCheckedChange={(checked) => updateTechnical('qualityStandards', checked)}
          />
          <div>
            <Label htmlFor="qualityStandards" className="font-medium">
              I commit to high-quality standards *
            </Label>
            <p className="text-sm text-gray-600">
              My designs are pixel-perfect, well-organized, and professionally crafted
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="originalWork"
            checked={data.technical.originalWork}
            onCheckedChange={(checked) => updateTechnical('originalWork', checked)}
          />
          <div>
            <Label htmlFor="originalWork" className="font-medium">
              All my work is 100% original *
            </Label>
            <p className="text-sm text-gray-600">
              I create original designs and don't copy or steal from others
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="licensing"
            checked={data.technical.licensing}
            onCheckedChange={(checked) => updateTechnical('licensing', checked)}
          />
          <div>
            <Label htmlFor="licensing" className="font-medium">
              I understand licensing requirements
            </Label>
            <p className="text-sm text-gray-600">
              I will provide appropriate licenses for fonts, images, and other assets
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-purple-600 hover:bg-purple-700">
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function AgreementStep({ onNext, onPrevious, data, setData }: OnboardingStepProps) {
  const updateAgreement = (field: string, value: boolean) => {
    setData({
      ...data,
      agreement: {
        ...data.agreement,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Partnership Agreement</h3>
        <p className="text-gray-600">Please review and accept our terms</p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
            Commission Structure
          </h4>
          <div className="space-y-2 text-sm">
            <p>• <strong>{PLATFORM_CONFIG.partner.commissionRate}%</strong> goes to you (the partner)</p>
            <p>• <strong>{100 - PLATFORM_CONFIG.partner.commissionRate}%</strong> goes to UI8 (platform fee)</p>
            <p>• Payments processed monthly</p>
            <p>• Minimum payout: $50</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={data.agreement.terms}
            onCheckedChange={(checked) => updateAgreement('terms', checked as boolean)}
          />
          <div>
            <Label htmlFor="terms" className="font-medium">
              I accept the Terms of Service and Privacy Policy *
            </Label>
            <p className="text-sm text-gray-600">
              <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                Read Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="commission"
            checked={data.agreement.commission}
            onCheckedChange={(checked) => updateAgreement('commission', checked as boolean)}
          />
          <div>
            <Label htmlFor="commission" className="font-medium">
              I agree to the {PLATFORM_CONFIG.partner.commissionRate}/{100 - PLATFORM_CONFIG.partner.commissionRate} commission split *
            </Label>
            <p className="text-sm text-gray-600">
              I understand that UI8 takes {100 - PLATFORM_CONFIG.partner.commissionRate}% for platform services, marketing, and support
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="quality"
            checked={data.agreement.quality}
            onCheckedChange={(checked) => updateAgreement('quality', checked as boolean)}
          />
          <div>
            <Label htmlFor="quality" className="font-medium">
              I commit to quality standards *
            </Label>
            <p className="text-sm text-gray-600">
              My products will meet UI8's quality guidelines and be professional-grade
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="exclusivity"
            checked={data.agreement.exclusivity}
            onCheckedChange={(checked) => updateAgreement('exclusivity', checked as boolean)}
          />
          <div>
            <Label htmlFor="exclusivity" className="font-medium">
              I understand exclusivity options
            </Label>
            <p className="text-sm text-gray-600">
              I can choose to make products exclusive to UI8 for higher commissions (optional)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 mb-1">Important Note</p>
            <p className="text-yellow-700">
              Once approved, you'll be able to upload products immediately.
              We review all submissions to ensure quality standards.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} className="bg-purple-600 hover:bg-purple-700">
          Review Application
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function SubmitStep({ onNext, data }: OnboardingStepProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Review & Submit Application</h3>
        <p className="text-gray-600">Please review your information before submitting</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Name:</strong> {data.personalInfo.fullName}</p>
            <p><strong>Email:</strong> {data.personalInfo.email}</p>
            <p><strong>Location:</strong> {data.personalInfo.location}</p>
            <p><strong>Portfolio:</strong> <a href={data.personalInfo.portfolio} target="_blank" className="text-blue-600">View Portfolio</a></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Professional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Experience:</strong> {data.professional.experience}</p>
            <p><strong>Specialties:</strong> {data.professional.specialties.join(', ')}</p>
            <p><strong>Business Type:</strong> {data.business.businessType}</p>
            <p><strong>Expected Revenue:</strong> ${data.business.expectedRevenue}/month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Design Tools:</strong> {data.technical.designTools.join(', ')}</p>
            <p><strong>File Formats:</strong> {data.technical.fileFormats.join(', ')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h4 className="font-semibold text-green-900 mb-2">Ready to Submit!</h4>
        <p className="text-green-700 text-sm mb-4">
          We'll review your application within 24-48 hours and send you an email with the decision.
        </p>
        <p className="text-green-600 text-sm">
          Questions? Contact us at <a href="mailto:partners@ui8marketplace.com" className="underline">partners@ui8marketplace.com</a>
        </p>
      </div>

      <Button onClick={onNext} className="w-full bg-green-600 hover:bg-green-700 py-3">
        Submit Partner Application
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  )
}
