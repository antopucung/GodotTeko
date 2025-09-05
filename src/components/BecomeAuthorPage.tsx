'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { SITE_CONFIG } from '@/config/constants'
import { contextualPlaceholders } from '@/lib/placeholders'

export default function BecomeAuthorPage() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    portfolioLink: '',
    additionalInfo: ''
  })

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Handle form submission here
  }

  const faqItems = [
    {
      question: "What is the acceptance criteria?",
      answer: "New product submissions are accepted based on the overall level of quality, polish, usability and value. Please browse some of our featured products to get a better sense of the type of products we typically approved to be released on our platform."
    },
    {
      question: "How much do I earn for sales?",
      answer: "Your products will be available to customers through two options: by purchasing it individually or with an all-access pass. For individual purchases, you earn 70% on each sale and 2% of the value of your product for each unique download. Typically, individual purchases generate 85-95% of your revenue."
    },
    {
      question: "When and how do I get paid?",
      answer: "Payments are fully automated via PayPal, taking place at the end of each month as long as you have a minimum balance of $100.00 in your account. Please be sure to update your payment settings with a valid PayPal email address to avoid delays."
    },
    {
      question: "How long will it take to review my application?",
      answer: "Our review process could take 1-2 business days upon submission. After the review process we will reach out to you via email with our decision and subsequent steps to open your author account."
    },
    {
      question: "How long does it take to review new product submissions?",
      answer: "New product submission reviews are typically done within 24 hours. You will receive a notification in case the product is approved or denied. The same applies to existing product updates."
    },
    {
      question: "Can my product be excluded from the All-Access Pass?",
      answer: "All products on our platform are accessible with the All-Access Pass and cannot be excluded. If you wish to permanently remove your products please contact support."
    },
    {
      question: "Can I sell on other marketplaces?",
      answer: "We do not require products to be exclusively available on our platform. You're welcome and encouraged to release products across multiple marketplaces to maximize your exposure and earning potential."
    },
    {
      question: "How do I get my product featured?",
      answer: "Featured products are hand-picked by our internal design team. Our selection is based on the general level of quality, polish, usability and value. You may not submit requests to get your product featured."
    }
  ]

  return (
    <div className="bg-[#171819] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute top-20 right-20 w-32 h-32 bg-gray-700 rounded-full opacity-20"></div>
          <div className="absolute top-40 right-60 w-20 h-20 bg-gray-600 rounded-full opacity-15"></div>
          <div className="absolute bottom-40 right-40 w-16 h-16 bg-gray-500 rounded-full opacity-10"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Become an author
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Authors can join {SITE_CONFIG.name} by invitation or by applying using the form below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - 3D Illustration */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-3xl p-8 overflow-hidden">
                {/* 3D-like geometric shapes */}
                <div className="relative">
                  {/* Main cube */}
                  <div className="w-40 h-40 mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg transform rotate-12 opacity-80"></div>
                    <div className="absolute inset-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg transform -rotate-6 opacity-90"></div>
                    <div className="absolute inset-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg transform rotate-3"></div>
                  </div>

                  {/* Floating spheres */}
                  <div className="absolute top-8 left-8 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-70"></div>
                  <div className="absolute top-16 right-12 w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full opacity-60"></div>
                  <div className="absolute bottom-12 left-16 w-6 h-6 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full opacity-50"></div>
                  <div className="absolute bottom-8 right-8 w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full opacity-65"></div>

                  {/* Ring elements */}
                  <div className="absolute top-20 right-20 w-16 h-16 border-4 border-blue-400 rounded-full opacity-40"></div>
                  <div className="absolute bottom-20 left-20 w-12 h-12 border-3 border-purple-400 rounded-full opacity-30"></div>
                </div>
              </div>
            </div>

            {/* Right side - Application Form */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Apply to open a shop</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="designer@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                    Full name
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Jamie Davis"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="portfolioLink" className="block text-sm font-medium text-gray-300 mb-2">
                    Link to portfolio or product example
                  </label>
                  <Input
                    id="portfolioLink"
                    name="portfolioLink"
                    type="url"
                    placeholder="https://mywebsite.com"
                    value={formData.portfolioLink}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-300 mb-2">
                    Additional information
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    rows={4}
                    placeholder="Write a short message (optional)..."
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Apply
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently asked questions
        </h2>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-medium text-lg">{item.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {expandedFaq === index && (
                <div className="px-6 pb-4 text-gray-300 leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
