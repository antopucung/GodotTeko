'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Users,
  Crown,
  TrendingUp,
  DollarSign,
  Award,
  X,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react'
import Link from 'next/link'

interface RoleTransitionPromptProps {
  userStats: {
    totalPurchases: number
    totalSpent: number
    downloadsThisMonth: number
    favoriteCategories: string[]
  }
  userRole?: string
  onDismiss?: () => void
}

interface PromptConfig {
  title: string
  description: string
  benefits: string[]
  action: string
  href: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  badge: string
}

export default function RoleTransitionPrompt({
  userStats,
  userRole = 'user',
  onDismiss
}: RoleTransitionPromptProps) {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)

  useEffect(() => {
    // Load dismissed state from localStorage
    const dismissedPrompts = JSON.parse(localStorage.getItem('dismissedRolePrompts') || '[]')

    // Determine which prompt to show based on user activity
    const config = determinePromptConfig(userStats, userRole)

    if (config && !dismissedPrompts.includes(config.action)) {
      setPromptConfig(config)
    }
  }, [userStats, userRole])

  const determinePromptConfig = (stats: any, role: string): PromptConfig | null => {
    // Don't show prompts to existing teachers or partners
    if (['teacher', 'partner', 'admin', 'super_admin'].includes(role)) {
      return null
    }

    // Suggest teacher role based on activity patterns
    if (stats.totalPurchases >= 20 || stats.totalSpent >= 200) {
      return {
        title: "Ready to share your knowledge?",
        description: "You've been active on our platform! Many creators like you find success teaching others and earning additional revenue.",
        benefits: [
          "Earn revenue from teaching",
          "Access professional teacher tools",
          "Build your personal brand",
          "Help others learn and grow"
        ],
        action: "Become a Teacher",
        href: "/api/auth/register-teacher",
        icon: GraduationCap,
        color: "text-green-600",
        bgColor: "from-green-50 to-blue-50",
        badge: "New Opportunity"
      }
    }

    // Suggest partner role for frequent users with specific interests
    if (stats.totalPurchases >= 10 && stats.favoriteCategories.length >= 3) {
      return {
        title: "Become a creator on our platform",
        description: "Your diverse interests show you understand what creators need. Consider sharing your own assets and earning from your work.",
        benefits: [
          "Earn from asset sales",
          "25% higher commission rates",
          "Access to creator analytics",
          "Priority support and promotion"
        ],
        action: "Become a Partner",
        href: "/become-partner",
        icon: Users,
        color: "text-purple-600",
        bgColor: "from-purple-50 to-pink-50",
        badge: "Creator Path"
      }
    }

    // Suggest premium subscription for engaged users
    if (stats.downloadsThisMonth >= 5 && stats.totalPurchases >= 5) {
      return {
        title: "Unlock your creative potential",
        description: "You're using our platform regularly! Upgrade to access premium courses and advanced tools to accelerate your skills.",
        benefits: [
          "Premium course access",
          "Advanced learning tools",
          "Priority support",
          "Exclusive content library"
        ],
        action: "Upgrade Plan",
        href: "/all-access",
        icon: Crown,
        color: "text-blue-600",
        bgColor: "from-blue-50 to-indigo-50",
        badge: "Unlock More"
      }
    }

    return null
  }

  const handleDismiss = () => {
    if (promptConfig) {
      // Save to localStorage
      const dismissedPrompts = JSON.parse(localStorage.getItem('dismissedRolePrompts') || '[]')
      dismissedPrompts.push(promptConfig.action)
      localStorage.setItem('dismissedRolePrompts', JSON.stringify(dismissedPrompts))
    }

    setDismissed(true)
    onDismiss?.()
  }

  if (!promptConfig || dismissed) {
    return null
  }

  const IconComponent = promptConfig.icon

  return (
    <Card className={`border-2 border-dashed border-opacity-50 bg-gradient-to-r ${promptConfig.bgColor} shadow-lg hover:shadow-xl transition-all duration-200`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
              <IconComponent className={`w-6 h-6 ${promptConfig.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {promptConfig.title}
                </h3>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  {promptConfig.badge}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm max-w-2xl">
                {promptConfig.description}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">What you'll get:</h4>
            <ul className="space-y-2">
              {promptConfig.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Star className={`w-4 h-4 ${promptConfig.color}`} />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold text-gray-900">
                Join 5,000+ creators
              </div>
              <div className="flex gap-3 justify-center">
                <Link href={promptConfig.href}>
                  <Button className={`bg-gradient-to-r ${promptConfig.color.includes('green') ? 'from-green-600 to-blue-600' : promptConfig.color.includes('purple') ? 'from-purple-600 to-pink-600' : 'from-blue-600 to-indigo-600'} hover:shadow-lg transition-all duration-200`}>
                    {promptConfig.action}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleDismiss}>
                  Maybe Later
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                ✨ Free to start • No commitments
              </p>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-6 pt-4 border-t border-gray-200 border-opacity-50">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>95% success rate</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>Avg. $500/month earnings</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>Expert support included</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
