'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { PLATFORM_CONFIG } from '@/config/platform'
import {
  Loader2, Check, ChevronDown, Crown, Infinity,
  Shield, Zap, Users, Star, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react'

interface PricingTier {
  id: string
  name: string
  price: number
  originalPrice: number
  period: string
  downloads: number
  duration: string
  features: string[]
  highlighted?: boolean
  badge?: string
}

interface FAQItem {
  question: string
  answer: string
}

export default function AllAccessPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasAccessPass, setHasAccessPass] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [error, setError] = useState('')
  const [allPlans, setAllPlans] = useState([])
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])

  // Categories with counts
  const categories = [
    { name: 'UI Kits', count: 4856, icon: '📱' },
    { name: 'Coded Templates', count: 240, icon: '💻' },
    { name: 'No-Code Assets', count: 348, icon: '🎯' },
    { name: 'Illustrations', count: 1300, icon: '🎨' },
    { name: 'Fonts', count: 720, icon: '🔤' },
    { name: 'Presentation', count: 484, icon: '📊' },
    { name: 'Mockups', count: 727, icon: '🖼️' },
    { name: '3D Assets', count: 1341, icon: '🎲' },
    { name: 'Icon Sets', count: 1302, icon: '⭐' },
    { name: 'Themes', count: 805, icon: '🎭' }
  ]

  // Project categories
  const projectCategories = [
    'Dashboard', 'Finance', 'Fitness', 'Travel', 'Portfolio',
    'Health', 'Real Estate', 'Gaming', 'Education', 'Photography',
    'Crypto', 'Social', 'Ecommerce', 'AI'
  ]

  // Company logos for trust indicators
  const companies = [
    { name: 'Adobe', logo: 'https://ext.same-assets.com/1519585551/901835484.svg' },
    { name: 'Airbnb', logo: 'https://ext.same-assets.com/1519585551/3022586572.svg' },
    { name: 'Amazon', logo: 'https://ext.same-assets.com/1519585551/216896285.svg' },
    { name: 'Google', logo: 'https://ext.same-assets.com/1519585551/3381565728.svg' },
    { name: 'Microsoft', logo: 'https://ext.same-assets.com/1519585551/1579901802.svg' },
    { name: 'Netflix', logo: 'https://ext.same-assets.com/1519585551/1117118840.svg' },
    { name: 'PayPal', logo: 'https://ext.same-assets.com/1519585551/2650723065.svg' }
  ]

  // FAQ data
  const faqData: FAQItem[] = [
    {
      question: "What is the All-Access Pass?",
      answer: "The All-Access pass is a subscription based membership offered in different tiers, giving you access to download any product on the platform as well as all future releases."
    },
    {
      question: "How often do you release new products?",
      answer: "We curate new products on a daily basis. The amount of approved daily releases will vary as our primary focus is quality over quantity."
    },
    {
      question: "How can I cancel my subscription?",
      answer: "You can cancel your subscription at any time from your purchases page and you may continue downloading products until your subscription expires."
    },
    {
      question: "Do I have access to all products?",
      answer: "Yes, you can download any product offered in the platform for as long as your subscription is active."
    },
    {
      question: "Can I redownload products?",
      answer: "You can redownload products as long as you have an active subscription. Downloading the same product within 24 hours will not consume additional download credits."
    },
    {
      question: "What happens when I reach my daily download limit?",
      answer: "You must wait 24 hours for your downloads to recharge after you've exceeded your daily allocated limit. However, upgrading to a higher tier will instantly reset your download credits."
    },
    {
      question: "What is your refund policy?",
      answer: "All transactions are final and we do not offer refunds on All-Access Pass purchases."
    }
  ]

  // Group plans by planGroup and filter by billing cycle
  const getFilteredPlans = () => {
    const planGroups = ['student', 'individual', 'professional', 'team']
    return planGroups.map(group => {
      const groupPlans = allPlans.filter(plan =>
        plan.planGroup === group && plan.billingCycle === billingCycle
      )
      return groupPlans[0] // Return the plan for the selected billing cycle
    }).filter(Boolean) // Remove any undefined plans
  }

  const fetchSubscriptionPlans = async () => {
    setIsLoadingPlans(true)
    setError('')

    try {
      console.log('🔄 Fetching subscription plans...')
      const response = await fetch('/api/subscription-plans')
      const data = await response.json()

      if (data.success && data.plans) {
        console.log(`✅ Loaded ${data.plans.length} subscription plans`)

        // Transform the data to match the expected format
        const transformedPlans = data.plans.map((plan: any) => ({
          id: plan.planId || plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          originalPrice: plan.originalPrice,
          period: plan.period,
          features: plan.features || [],
          highlighted: plan.highlighted || false,
          badge: plan.badge || null,
          downloadLimit: plan.downloadLimit,
          billingCycle: plan.billingCycle,
          planGroup: plan.planGroup,
          targetAudience: plan.targetAudience,
          trialDays: plan.trialDays
        }))

        setAllPlans(transformedPlans)
        // Initially show monthly plans
        const monthlyPlans = getFilteredPlansFromArray(transformedPlans, 'monthly')
        setPricingTiers(monthlyPlans)
      } else {
        throw new Error(data.message || 'Failed to load subscription plans')
      }
    } catch (error) {
      console.error('❌ Error fetching subscription plans:', error)
      setError('Failed to load subscription plans. Please try again.')
      setPricingTiers([])
    } finally {
      setIsLoadingPlans(false)
    }
  }

  const getFilteredPlansFromArray = (plans: any[], cycle: string) => {
    const planGroups = ['student', 'individual', 'professional', 'team']
    return planGroups.map(group => {
      const groupPlans = plans.filter(plan =>
        plan.planGroup === group && plan.billingCycle === cycle
      )
      return groupPlans[0]
    }).filter(Boolean)
  }

  // Update plans when billing cycle changes
  useEffect(() => {
    if (allPlans.length > 0) {
      const filteredPlans = getFilteredPlans()
      setPricingTiers(filteredPlans)
    }
  }, [billingCycle, allPlans])

  useEffect(() => {
    if (status === 'authenticated' && session) {
      checkAccessPassStatus()
    } else {
      setIsLoading(false)
      setHasAccessPass(false)
    }
    fetchSubscriptionPlans()
  }, [status, session])

  const checkAccessPassStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/access-pass-status')
      if (response.ok) {
        const data = await response.json()
        setHasAccessPass(data.hasActivePass)
      }
    } catch (error) {
      console.error('Error checking access pass status:', error)
      setHasAccessPass(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async (tierId: string) => {
    if (status === 'authenticated') {
      router.push(`/checkout?product=all-access-${tierId}`)
    } else {
      router.push(`/auth/signin?callbackUrl=/all-access`)
    }
  }

  const getDiscount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100)
  }

  if ((isLoading && status === 'authenticated') || isLoadingPlans) {
    return (
      <div className="min-h-screen bg-[#161616]">
        <Header />
        <main className="main-content-fixed-header">
          <div className="container mx-auto px-4 py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-gray-400">
              {isLoading ? 'Loading your access status...' : 'Loading subscription plans...'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#161616] text-white">
      <Header />

      <main className="main-content-fixed-header">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Unlock All-Access
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Boost your productivity with instant access to all 11,500 existing
              products and daily new releases.
            </p>

            {hasAccessPass ? (
              /* Active Pass State */
              <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8 mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  <span className="text-2xl font-bold text-green-400">All-Access Active</span>
                </div>
                <p className="text-gray-300 mb-6">
                  You have unlimited access to all premium resources
                </p>
                <Button onClick={() => router.push('/browse')} className="bg-green-600 hover:bg-green-700">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Browse All Resources
                </Button>
              </div>
            ) : (
              <>
                {/* Billing Toggle */}
                <div className="flex justify-center mb-8">
                  <div className="bg-gray-800 rounded-lg p-1 flex">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-6 py-2 rounded-md transition-colors ${
                        billingCycle === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-6 py-2 rounded-md transition-colors ${
                        billingCycle === 'yearly'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>Yearly</span>
                      <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                        Save 17%
                      </span>
                    </button>
                  </div>
                </div>

                {isLoadingPlans ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">
                      Loading Plans
                    </h3>
                    <p className="text-gray-500">
                      Fetching subscription plans...
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-red-400 mb-2">
                      Error Loading Plans
                    </h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <Button
                      onClick={fetchSubscriptionPlans}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : (
                  /* Pricing Cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {pricingTiers.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Crown className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">
                      No Plans Available
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Subscription plans are being configured. Please check back later.
                    </p>
                    <Button
                      onClick={fetchSubscriptionPlans}
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-800"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Loading Plans
                    </Button>
                  </div>
                ) : (
                  pricingTiers.map((tier) => (
                  <Card
                    key={tier.id}
                    className={`bg-gray-900 border-gray-800 relative overflow-hidden ${
                      tier.highlighted ? 'border-blue-500 scale-105 lg:scale-110' : ''
                    } transition-transform duration-200`}
                  >
                    {tier.badge && (
                      <div className="absolute top-4 right-4">
                        <Badge className={`text-white ${
                          tier.badge === 'Most Popular' ? 'bg-blue-600' :
                          tier.badge === 'Popular' ? 'bg-green-600' :
                          tier.badge === 'Pro Choice' ? 'bg-purple-600' :
                          tier.badge === 'Enterprise' ? 'bg-orange-600' :
                          tier.badge?.includes('Save') ? 'bg-green-600' :
                          'bg-blue-600'
                        }`}>
                          {tier.badge}
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-2 text-gray-300">
                          {tier.name}
                        </h3>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-3xl font-bold text-white">
                            ${tier.price}
                          </span>
                          {billingCycle === 'yearly' && (
                            <span className="text-lg text-gray-500 line-through">
                              ${tier.originalPrice}
                            </span>
                          )}
                          {billingCycle === 'monthly' && tier.originalPrice !== tier.price && (
                            <span className="text-lg text-gray-500 line-through">
                              ${tier.originalPrice}
                            </span>
                          )}
                          {tier.originalPrice !== tier.price && (
                            <span className="text-green-400 font-semibold text-sm">
                              -{getDiscount(tier.originalPrice, tier.price)}%
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {tier.period}
                        </p>
                        {billingCycle === 'yearly' && (
                          <p className="text-green-400 text-xs mt-1">
                            2 months FREE vs monthly billing
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={() => handlePurchase(tier.id)}
                        className={`w-full mb-6 ${
                          tier.highlighted
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        Get {tier.name} {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
                      </Button>

                      <ul className="space-y-2">
                        {tier.features.slice(0, 6).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                        {tier.features.length > 6 && (
                          <li className="text-gray-500 text-sm italic">
                            +{tier.features.length - 6} more features
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                  ))
                )}
                </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-12 border-y border-gray-800">
          <div className="container mx-auto px-4">
            <p className="text-center text-gray-400 mb-8">
              Chosen by leading creatives globally
            </p>
            <div className="flex items-center justify-center flex-wrap gap-8 opacity-60">
              {companies.map((company) => (
                <img
                  key={company.name}
                  src={company.logo}
                  alt={company.name}
                  className="h-8 w-auto filter grayscale hover:grayscale-0 transition-all duration-300"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Feature Sections */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
              <div>
                <h2 className="text-4xl font-bold mb-6">Access everything</h2>
                <p className="text-xl text-gray-400 mb-8">
                  Get instant access to all products. Help ship your projects better
                  and faster while looking like a pro.
                </p>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-8 backdrop-blur-sm border border-gray-800">
                  <div className="grid grid-cols-3 gap-4">
                    {categories.slice(0, 9).map((category) => (
                      <div key={category.name} className="text-center p-4">
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="text-sm text-gray-400">{category.name}</div>
                        <div className="text-xs text-gray-500">{category.count.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="lg:order-2">
                <h2 className="text-4xl font-bold mb-6">Zero creative blocks</h2>
                <p className="text-xl text-gray-400 mb-8">
                  Get a constant stream of curated design resources so you can create
                  faster, better, and without limits.
                </p>
              </div>
              <div className="lg:order-1">
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-8 backdrop-blur-sm border border-gray-800">
                  <div className="grid grid-cols-2 gap-4">
                    {categories.slice(0, 10).map((category) => (
                      <div key={category.name} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-sm">
                          {category.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{category.name}</div>
                          <div className="text-xs text-gray-500">{category.count.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-20 bg-gray-900/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Every kind of asset.</h2>
            <h3 className="text-3xl font-bold text-gray-400 mb-12">Every kind of project.</h3>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {projectCategories.map((category) => (
                <span
                  key={category}
                  className="px-4 py-2 bg-gray-800 rounded-full text-sm text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-4xl font-bold text-center mb-12">FAQ</h2>

            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <Collapsible
                  key={index}
                  open={openFAQ === index}
                  onOpenChange={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  <CollapsibleTrigger className="w-full text-left p-6 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          openFAQ === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-6 pb-6 text-gray-400 leading-relaxed">
                    {faq.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-400 mb-4">
                Couldn't find what you were looking for?
              </p>
              <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                Contact us
              </Button>
            </div>
          </div>
        </section>


      </main>

      <Footer />
    </div>
  )
}
