'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  User,
  Mail,
  Globe,
  Building,
  MapPin,
  Save,
  Bell,
  Shield,
  CreditCard,
  Download,
  Trash2
} from 'lucide-react'
import { getUserById, updateUserProfile } from '@/lib/auth'

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
    lastLoginAt: string
  }
}

export function SettingsTab() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  const [formData, setFormData] = useState({
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
    },
    preferences: {
      newsletter: true,
      notifications: true,
      theme: 'system'
    }
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
    }
  }, [session?.user?.id])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const userData = await getUserById(session!.user!.id as string)
      if (userData) {
        setProfile(userData)
        setFormData({
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
          },
          preferences: {
            newsletter: userData.preferences?.newsletter ?? true,
            notifications: userData.preferences?.notifications ?? true,
            theme: userData.preferences?.theme || 'system'
          }
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setSaving(true)
      await updateUserProfile(profile._id, {
        name: formData.name,
        bio: formData.bio,
        website: formData.website,
        company: formData.company,
        location: formData.location,
        socialLinks: formData.socialLinks,
        preferences: formData.preferences
      })

      // Update session if name changed
      if (formData.name !== profile.name) {
        await update({ name: formData.name })
      }

      // Refresh profile
      await fetchProfile()
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'partner': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load profile settings</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-600">
          Manage your profile, preferences, and account security
        </p>
      </div>

      {/* Settings Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'billing', label: 'Billing', icon: CreditCard }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeSection === id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Your company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div>
                      <Label>Account Type</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getRoleBadgeColor(profile.role)}>
                          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                        </Badge>
                        {profile.verified && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Social Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        value={formData.socialLinks.twitter}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                        }))}
                        placeholder="https://twitter.com/username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={formData.socialLinks.linkedin}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                        }))}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dribbble">Dribbble</Label>
                      <Input
                        id="dribbble"
                        value={formData.socialLinks.dribbble}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, dribbble: e.target.value }
                        }))}
                        placeholder="https://dribbble.com/username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="behance">Behance</Label>
                      <Input
                        id="behance"
                        value={formData.socialLinks.behance}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, behance: e.target.value }
                        }))}
                        placeholder="https://behance.net/username"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="newsletter">Newsletter Subscription</Label>
                        <p className="text-sm text-gray-600">
                          Receive updates about new products and features
                        </p>
                      </div>
                      <Switch
                        id="newsletter"
                        checked={formData.preferences.newsletter}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, newsletter: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Get notified about orders, downloads, and account activity
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={formData.preferences.notifications}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, notifications: checked }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Account Statistics</h4>
                  {profile.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {profile.stats.totalPurchases}
                        </p>
                        <p className="text-sm text-gray-600">Total Purchases</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          ${profile.stats.totalSpent}
                        </p>
                        <p className="text-sm text-gray-600">Total Spent</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-purple-600">
                          {profile.stats.lastLoginAt
                            ? formatDate(profile.stats.lastLoginAt)
                            : 'Never'
                          }
                        </p>
                        <p className="text-sm text-gray-600">Last Login</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Authentication Method</h4>
                          <p className="text-sm text-gray-600">
                            You signed up with {profile.provider}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {profile.provider}
                        </Badge>
                      </div>
                    </div>

                    {profile.provider === 'credentials' && (
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Password</h4>
                            <p className="text-sm text-gray-600">
                              Last updated: Unknown
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Change Password
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Download History</h4>
                          <p className="text-sm text-gray-600">
                            View and manage your download activity
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href="/api/user/download-history" download>
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 text-red-600">Danger Zone</h4>
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-700">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-100">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Section */}
            {activeSection === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Billing & Payments</h3>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Payment Methods</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage your payment methods for subscriptions and purchases
                      </p>
                      <Button variant="outline" size="sm">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Payment Methods
                      </Button>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Billing History</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        View and download your invoices and receipts
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/user/orders">
                          View Order History
                        </a>
                      </Button>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Subscription Management</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage your access pass and subscription settings
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/user/dashboard?tab=access-pass">
                          Manage Subscription
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
