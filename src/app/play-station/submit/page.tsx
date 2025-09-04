'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import Footer from '@/components/Footer'
import ProjectSubmissionForm from '@/components/ProjectSubmissionForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Clock,
  Eye,
  Star,
  Users,
  Lightbulb,
  FileText,
  Video,
  Camera,
  Code,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function ProjectSubmissionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionComplete, setSubmissionComplete] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/play-station/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setSubmissionComplete(true)
      } else {
        throw new Error(result.error || 'Submission failed')
      }
    } catch (error) {
      console.error('Submission error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submissionComplete) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Project Submitted Successfully!
            </h1>

            <p className="text-gray-300 text-lg mb-8">
              Thank you for sharing your game development journey with the community.
              Our team will review your submission and get back to you within 1-3 business days.
            </p>

            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="text-white font-semibold mb-4">What happens next?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-gray-300">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span>Content review (1-3 business days)</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <span>Quality and guidelines check</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Star className="w-5 h-5 text-green-400" />
                  <span>Publication to Play.Station showcase</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/play-station')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Explore Other Projects
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/user/dashboard')}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/play-station" className="text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Play.Station
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">Submit Project</span>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Share Your <span className="text-orange-400">Game Development Journey</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Help other developers learn from your experience by sharing your project's
              post-mortem, development insights, and behind-the-scenes content.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <Users className="w-8 h-8 text-orange-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Community Impact</h3>
                <p className="text-gray-400 text-sm">Share knowledge and help other developers learn from your experience</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <Eye className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Showcase Your Work</h3>
                <p className="text-gray-400 text-sm">Get visibility for your project and connect with the gamedev community</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <Star className="w-8 h-8 text-green-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Professional Portfolio</h3>
                <p className="text-gray-400 text-sm">Build a professional presence and demonstrate your development skills</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines Section */}
      <section className="py-12 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

              {/* Submission Guidelines */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-400" />
                    What to Include
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Project overview and goals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">What worked and what didn't</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Technical challenges and solutions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Team dynamics and learnings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Development timeline and milestones</span>
                  </div>
                </CardContent>
              </Card>

              {/* Media Requirements */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-400" />
                    Media Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Video className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Development videos and timelapses</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Camera className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Screenshots and concept art</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Code className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Code snippets (optional)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">Design documents (optional)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Review Process */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-400" />
                    Review Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <span className="text-gray-300 text-sm">Submission received</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <span className="text-gray-300 text-sm">Content review (1-3 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                    <span className="text-gray-300 text-sm">Approval or feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                    <span className="text-gray-300 text-sm">Publication to Play.Station</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Important Notice */}
            <Card className="bg-blue-900/20 border-blue-700 mb-12">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-blue-400 font-semibold mb-2">Before You Submit</h3>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Ensure you own the rights to all content you're submitting</li>
                      <li>• Be honest about both successes and failures - the community learns from both</li>
                      <li>• Include specific details that other developers can apply to their projects</li>
                      <li>• Consider what you wish you had known when starting your project</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Submission Form */}
      <section className="py-16 bg-gray-800">
        <div className="container mx-auto px-4">
          <ProjectSubmissionForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </section>

      <Footer />
    </div>
  )
}
