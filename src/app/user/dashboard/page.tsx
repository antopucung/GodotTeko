'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  User,
  Crown,
  Download,
  Heart,
  Settings,
  CreditCard,
  Calendar,
  TrendingUp,
  Package,
  Star,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  GraduationCap,
  BookOpen,
  Award,
  Play
} from 'lucide-react'
import RoleTransitionPrompt from '@/components/RoleTransitionPrompt'

interface UserStats {
  totalPurchases: number
  totalSpent: number
  downloadsThisMonth: number
  favoriteCategories: string[]
  lastLoginAt: string
}

interface SubscriptionStatus {
  plan: {
    id: string
    name: string
    tier: 'student' | 'individual' | 'professional' | 'team'
    price: {
      monthly: number
      yearly: number
    }
    features: string[]
  } | null
  status: 'active' | 'inactive' | 'trial' | 'canceled' | 'expired'
  currentPeriodEnd?: string
  trialEndsAt?: string
  isYearly: boolean
  nextBillingAmount?: number
}

interface RecentDownload {
  id: string
  productName: string
  downloadedAt: string
  fileSize: string
  category: string
}

interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  role: string
  verified: boolean
  stats: UserStats
  subscription: SubscriptionStatus
  recentDownloads: RecentDownload[]
}

export default function UserDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/user/dashboard')
    }
  }, [status, router])

  // Load user profile and subscription data
  const loadUserData = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (data.success) {
        setProfile(data.profile)
      } else {
        toast.error('Failed to load profile data')
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      loadUserData()
    }
  }, [status, session])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUserData()
    setRefreshing(false)
    toast.success('Profile data refreshed')
  }

  const getSubscriptionBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'trial': return 'bg-blue-100 text-blue-800'
      case 'canceled': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'student': return '🎓'
      case 'individual': return '👤'
      case 'professional': return '💼'
      case 'team': return '🏢'
      default: return '📦'
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (status !== 'authenticated' || !session?.user) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={session.user.image || ''} />
            <AvatarFallback className="text-xl">
              {session.user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
            <p className="text-gray-600">Manage your account and subscriptions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/user/profile">
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold">{profile?.stats.totalPurchases || 0}</p>
              </div>
              <Download className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">${profile?.stats.totalSpent || 0}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{profile?.stats.downloadsThisMonth || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  {session.user.role === 'admin' ? (
                    <>
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Admin
                    </>
                  ) : session.user.role === 'partner' ? (
                    <>
                      <Star className="w-4 h-4 text-blue-500" />
                      Partner
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-gray-500" />
                      User
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Transition Prompt */}
      {profile?.stats && (
        <RoleTransitionPrompt
          userStats={profile.stats}
          userRole={session.user.role}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="learning">
            <GraduationCap className="w-4 h-4 mr-2" />
            Learning
          </TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.subscription.plan ? (
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getPlanIcon(profile.subscription.plan.tier)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {profile.subscription.plan.name}
                        </h3>
                        <p className="text-gray-600">
                          ${profile.subscription.isYearly
                            ? profile.subscription.plan.price.yearly
                            : profile.subscription.plan.price.monthly}
                          /{profile.subscription.isYearly ? 'year' : 'month'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getSubscriptionBadgeColor(profile.subscription.status)}>
                        {profile.subscription.status}
                      </Badge>
                      <Button asChild>
                        <Link href="/all-access">
                          Manage Plan
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Billing Info */}
                  {profile.subscription.currentPeriodEnd && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Next Billing</span>
                        </div>
                        <p className="text-blue-900">
                          {new Date(profile.subscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                        {profile.subscription.nextBillingAmount && (
                          <p className="text-sm text-blue-700">
                            ${profile.subscription.nextBillingAmount}
                          </p>
                        )}
                      </div>

                      {profile.subscription.trialEndsAt && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Trial Ends</span>
                          </div>
                          <p className="text-green-900">
                            {new Date(profile.subscription.trialEndsAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plan Features */}
                  <div>
                    <h4 className="font-semibold mb-3">Plan Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {profile.subscription.plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                  <p className="text-gray-600 mb-4">
                    Upgrade to an All-Access plan to unlock premium features
                  </p>
                  <Button asChild>
                    <Link href="/all-access">
                      View Plans
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                My Learning Progress
              </CardTitle>
              <CardDescription>
                Track your course progress and certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Learning Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Courses Completed</p>
                        <p className="text-2xl font-bold text-green-700">3</p>
                      </div>
                      <Award className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Hours Learned</p>
                        <p className="text-2xl font-bold text-blue-700">24</p>
                      </div>
                      <Clock className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Certificates Earned</p>
                        <p className="text-2xl font-bold text-purple-700">2</p>
                      </div>
                      <Star className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Current Courses */}
                <div>
                  <h4 className="font-semibold mb-4">Continue Learning</h4>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Complete Game Development with Godot",
                        instructor: "Alex Johnson",
                        progress: 65,
                        thumbnail: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=200&h=120&fit=crop"
                      },
                      {
                        title: "3D Character Modeling in Blender",
                        instructor: "Maria Rodriguez",
                        progress: 30,
                        thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=200&h=120&fit=crop"
                      }
                    ].map((course, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-16 h-10 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium">{course.title}</h5>
                          <p className="text-sm text-gray-600">By {course.instructor}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={course.progress} className="h-2 flex-1" />
                            <span className="text-sm text-gray-600">{course.progress}%</span>
                          </div>
                        </div>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Courses */}
                <div>
                  <h4 className="font-semibold mb-4">Recommended for You</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "UI/UX Design for Games",
                        instructor: "David Kim",
                        difficulty: "Beginner",
                        duration: "6 hours",
                        price: "Free"
                      },
                      {
                        title: "Advanced C# Programming",
                        instructor: "Sarah Chen",
                        difficulty: "Advanced",
                        duration: "15 hours",
                        price: "$49"
                      }
                    ].map((course, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h5 className="font-medium mb-2">{course.title}</h5>
                        <p className="text-sm text-gray-600 mb-3">By {course.instructor}</p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{course.difficulty}</Badge>
                            <span className="text-gray-600">{course.duration}</span>
                          </div>
                          <span className="font-medium text-green-600">{course.price}</span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full mt-3">
                          Enroll Now
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 text-center border border-green-100">
                  <GraduationCap className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Expand Your Skills</h4>
                  <p className="text-gray-600 mb-4">
                    Discover more courses to enhance your game development expertise
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild>
                      <Link href="/learn">
                        Browse All Courses
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/teacher">
                        Become a Teacher
                        <Star className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Downloads Tab */}
        <TabsContent value="downloads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Recent Downloads
              </CardTitle>
              <CardDescription>
                Your download history and purchased items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.recentDownloads && profile.recentDownloads.length > 0 ? (
                <div className="space-y-4">
                  {profile.recentDownloads.map((download) => (
                    <div key={download.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{download.productName}</h4>
                          <p className="text-sm text-gray-600">
                            {download.category} • {download.fileSize}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(download.downloadedAt).toLocaleDateString()}
                        </p>
                        <Button size="sm" variant="outline">
                          Download Again
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Downloads Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start exploring our marketplace to download amazing resources
                  </p>
                  <Button asChild>
                    <Link href="/products/browse">
                      Browse Products
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Favorite Categories
              </CardTitle>
              <CardDescription>
                Your most loved product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.stats.favoriteCategories && profile.stats.favoriteCategories.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {profile.stats.favoriteCategories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="justify-center py-2">
                      {category}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                  <p className="text-gray-600">
                    Like products to see your favorite categories here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Billing & Payments
              </CardTitle>
              <CardDescription>
                Manage your payment methods and billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Payment Methods */}
                <div>
                  <h4 className="font-semibold mb-3">Payment Methods</h4>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-gray-400" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-600">Expires 12/25</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Billing History */}
                <div>
                  <h4 className="font-semibold mb-3">Recent Invoices</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Professional Plan</p>
                        <p className="text-sm text-gray-600">Jan 1, 2024</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$79.00</p>
                        <Button variant="link" size="sm" className="p-0 h-auto">
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
