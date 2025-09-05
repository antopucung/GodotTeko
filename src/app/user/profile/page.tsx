'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { getUserById, updateUserProfile } from '@/lib/auth'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  MapPin,
  Building,
  Globe,
  Calendar,
  Edit3,
  Save,
  X,
  Twitter,
  Linkedin,
  ExternalLink
} from 'lucide-react'

interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  role: 'user' | 'partner' | 'admin'
  verified: boolean
  provider: string
  bio?: string
  website?: string
  company?: string
  location?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    dribbble?: string
    behance?: string
  }
  preferences?: {
    newsletter: boolean
    notifications: boolean
    theme: string
  }
  stats?: {
    totalPurchases: number
    totalSpent: number
    favoriteCategories: string[]
    lastLoginAt: string
  }
  partnerInfo?: {
    approved: boolean
    approvedAt?: string
    commissionRate: number
    totalEarnings: number
    productsPublished: number
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    website: '',
    company: '',
    location: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      dribbble: '',
      behance: ''
    }
  })

  useEffect(() => {
    async function loadProfile() {
      if (session?.user?.id) {
        try {
          const userData = await getUserById(session.user.id as string)
          if (userData) {
            setProfile(userData)
            setEditForm({
              name: userData.name || '',
              bio: userData.bio || '',
              website: userData.website || '',
              company: userData.company || '',
              location: userData.location || '',
              socialLinks: {
                twitter: userData.socialLinks?.twitter || '',
                linkedin: userData.socialLinks?.linkedin || '',
                dribbble: userData.socialLinks?.dribbble || '',
                behance: userData.socialLinks?.behance || ''
              }
            })
          }
        } catch (error) {
          console.error('Error loading profile:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (status === 'authenticated') {
      loadProfile()
    } else if (status === 'unauthenticated') {
      setIsLoading(false)
    }
  }, [session?.user?.id, status])

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      await updateUserProfile(profile._id, {
        name: editForm.name,
        bio: editForm.bio,
        website: editForm.website,
        company: editForm.company,
        location: editForm.location,
        socialLinks: editForm.socialLinks
      })

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        name: editForm.name,
        bio: editForm.bio,
        website: editForm.website,
        company: editForm.company,
        location: editForm.location,
        socialLinks: editForm.socialLinks
      } : null)

      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        company: profile.company || '',
        location: profile.location || '',
        socialLinks: {
          twitter: profile.socialLinks?.twitter || '',
          linkedin: profile.socialLinks?.linkedin || '',
          dribbble: profile.socialLinks?.dribbble || '',
          behance: profile.socialLinks?.behance || ''
        }
      })
    }
    setIsEditing(false)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your profile.</p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'partner': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="text-center font-semibold text-lg mb-2"
                  />
                ) : (
                  <h2 className="font-semibold text-lg mb-2">{profile.name}</h2>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{profile.email}</span>
                </div>

                <Badge className={getRoleBadgeColor(profile.role)}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>

                {profile.verified && (
                  <Badge variant="outline" className="mt-2">
                    ✓ Verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details and Bio */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600">
                    {profile.bio || 'No bio provided yet.'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company */}
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-500" />
                  {isEditing ? (
                    <Input
                      value={editForm.company}
                      onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company"
                    />
                  ) : (
                    <span>{profile.company || 'Not specified'}</span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  {isEditing ? (
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Location"
                    />
                  ) : (
                    <span>{profile.location || 'Not specified'}</span>
                  )}
                </div>

                {/* Website */}
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-500" />
                  {isEditing ? (
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      type="url"
                    />
                  ) : profile.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {profile.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span>Not specified</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Twitter */}
                  <div className="flex items-center gap-3">
                    <Twitter className="w-4 h-4 text-blue-500" />
                    {isEditing ? (
                      <Input
                        value={editForm.socialLinks.twitter}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                        }))}
                        placeholder="Twitter URL"
                      />
                    ) : profile.socialLinks?.twitter ? (
                      <a
                        href={profile.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Twitter
                      </a>
                    ) : (
                      <span className="text-gray-500">Not connected</span>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-4 h-4 text-blue-700" />
                    {isEditing ? (
                      <Input
                        value={editForm.socialLinks.linkedin}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                        }))}
                        placeholder="LinkedIn URL"
                      />
                    ) : profile.socialLinks?.linkedin ? (
                      <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn
                      </a>
                    ) : (
                      <span className="text-gray-500">Not connected</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {profile.stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Purchases</p>
                      <p className="text-2xl font-bold">{profile.stats.totalPurchases}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold">${profile.stats.totalSpent}</p>
                    </div>
                  </div>
                  {profile.stats.lastLoginAt && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Last login: {new Date(profile.stats.lastLoginAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Partner Information */}
            {profile.role === 'partner' && profile.partnerInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Partner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge variant={profile.partnerInfo.approved ? "default" : "secondary"}>
                        {profile.partnerInfo.approved ? 'Approved' : 'Pending Approval'}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Commission Rate</p>
                        <p className="text-xl font-bold">{profile.partnerInfo.commissionRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                        <p className="text-xl font-bold">${profile.partnerInfo.totalEarnings}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Products Published</p>
                        <p className="text-xl font-bold">{profile.partnerInfo.productsPublished}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
