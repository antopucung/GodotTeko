'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Loader2 } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

export default function BecomePartnerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: session?.user?.email || '',
    fullName: session?.user?.name || '',
    portfolio: '',
    additionalInfo: ''
  })

  // FAQ data based on UI8 authors page
  const faqData: FAQItem[] = [
    {
      question: 'What is the acceptance criteria?',
      answer: 'New product submissions are accepted based on the overall level of quality, polish, usability and value. Please browse some of our featured products to get a better sense of the type of products we typically approve to be released on our platform.'
    },
    {
      question: 'How much do I earn for sales?',
      answer: 'Your products will be available to customers through two options: by purchasing it individually or with an all-access pass. For individual purchases, you earn 70% on each sale and 2% of the value of your product for each unique download. Typically, individual purchases generate 85-95% of your revenue.'
    },
    {
      question: 'When and how do I get paid?',
      answer: 'Payments are fully automated via PayPal, taking place at the end of each month as long as you have a minimum balance of $100.00 in your account. Please be sure to update your payment settings with a valid PayPal email address to avoid delays.'
    },
    {
      question: 'How long will it take to review my application?',
      answer: 'Our review process could take 1-2 business days upon submission. After the review process we will reach out to you via email with our decision and subsequent steps to open your author account.'
    },
    {
      question: 'How long does it take to review new product submissions?',
      answer: 'New product submission reviews are typically done within 24 hours. You will receive a notification in case the product is approved or denied. The same applies to existing product updates.'
    },
    {
      question: 'Can my product be excluded from the All-Access Pass?',
      answer: 'All products on our platform are accessible with the All-Access Pass and cannot be excluded. If you wish to permanently remove your products please contact support.'
    },
    {
      question: 'Can I sell on other marketplaces?',
      answer: 'We do not require products to be exclusively available on our platform. You\'re welcome and encouraged to release products across multiple marketplaces to maximize your exposure and earning potential.'
    },
    {
      question: 'How do I get my product featured?',
      answer: 'Featured products are hand-picked by our internal design team. Our selection is based on the general level of quality, polish, usability and value. You may not submit requests to get your product featured.'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check authentication
    if (status !== 'authenticated') {
      toast.error('Please sign in to apply')
      router.push('/auth/signin?callbackUrl=/become-partner')
      return
    }

    // Validate form
    if (!formData.email || !formData.fullName || !formData.portfolio) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare application data in the format expected by our API
      const applicationData = {
        personalInfo: {
          fullName: formData.fullName,
          email: formData.email,
          portfolio: formData.portfolio,
          phone: '',
          location: '',
          website: ''
        },
        professional: {
          experience: 'intermediate', // Default value
          specialties: ['UI Design', 'Game Assets'], // Default specialties
          previousWork: formData.additionalInfo || '',
          teamSize: 'individual',
          yearsActive: '1-3'
        },
        business: {
          businessType: 'freelance',
          expectedRevenue: '$1000-5000',
          targetAudience: 'game developers',
          marketingStrategy: formData.additionalInfo || 'portfolio showcase'
        },
        technical: {
          designTools: ['Figma', 'Photoshop'],
          fileFormats: ['PNG', 'SVG', 'PSD'],
          qualityStandards: true,
          originalWork: true,
          licensing: true
        },
        agreement: {
          terms: true,
          commission: true,
          quality: true,
          exclusivity: false
        }
      }

      const response = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Application submitted successfully!')

        // Reset form
        setFormData({
          email: session?.user?.email || '',
          fullName: session?.user?.name || '',
          portfolio: '',
          additionalInfo: ''
        })

        // Redirect based on status
        if (result.status === 'approved') {
          setTimeout(() => router.push('/partner/dashboard'), 2000)
        }
      } else {
        toast.error(result.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Application submission error:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-[#161616] text-white">
      <Header />

      <main className="main-content-fixed-header">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Become an author
            </h1>
            <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
              Authors can join Godot Tekko by invitation or by applying using the form below.
            </p>

            {/* Application Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              {/* Left side - 3D Illustration */}
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-3xl p-8 relative overflow-hidden">
                  {/* Abstract 3D-like shapes */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {/* Main geometric shapes */}
                      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl rotate-12 opacity-80" />
                      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full opacity-70" />
                      <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl rotate-45 opacity-60" />
                      <div className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-3xl -rotate-12 opacity-50" />

                      {/* Floating elements */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-700 rounded-full opacity-40" />
                      <div className="absolute top-1/6 right-1/6 w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg rotate-30 opacity-40" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Application Form */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-blue-400">Apply to open a shop</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="designer@example.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full name
                    </label>
                    <Input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Jamie Davis"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Link to portfolio or product example
                    </label>
                    <Input
                      type="url"
                      value={formData.portfolio}
                      onChange={(e) => handleInputChange('portfolio', e.target.value)}
                      placeholder="https://mywebsite.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Additional information
                    </label>
                    <Textarea
                      value={formData.additionalInfo}
                      onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                      placeholder="Write a short message (optional)..."
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 min-h-[100px]"
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || status !== 'authenticated'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : status !== 'authenticated' ? (
                      'Sign in to Apply'
                    ) : (
                      'Apply'
                    )}
                  </Button>

                  {status !== 'authenticated' && (
                    <p className="text-sm text-gray-400 text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => router.push('/auth/signin?callbackUrl=/become-partner')}
                        className="text-blue-400 hover:text-blue-300 p-0"
                      >
                        Sign in
                      </Button>
                      {' '}to submit your application
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-gray-900/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-bold text-center mb-12">Frequently asked questions</h2>

            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <Collapsible
                  key={index}
                  open={openFAQ === index}
                  onOpenChange={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  <CollapsibleTrigger className="w-full text-left p-6 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors border border-gray-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold pr-4 text-white">{faq.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          openFAQ === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 pb-6 text-gray-300 leading-relaxed">
                    {faq.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
