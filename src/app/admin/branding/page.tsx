'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Loader2,
  Upload,
  Eye,
  Palette,
  Settings,
  Save,
  RefreshCw,
  Download,
  Trash2,
  Plus,
  Image as ImageIcon,
  Type,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'

interface SiteConfiguration {
  _id?: string
  title: string
  logo: {
    useDefaultLogo: boolean
    logoImage?: {
      asset?: {
        url: string
        _id: string
        metadata?: any
      }
    }
    logoText: string
    showText: boolean
    logoSize: {
      width: number
      height: number
    }
    altText: string
  }
  branding: {
    primaryColor?: { hex: string }
    secondaryColor?: { hex: string }
    accentColor?: { hex: string }
  }
  siteInfo: {
    siteName: string
    tagline: string
    description: string
    keywords: string[]
  }
  socialMedia: {
    twitter?: string
    github?: string
    linkedin?: string
    instagram?: string
    youtube?: string
    discord?: string
  }
  settings: {
    isActive: boolean
    environment: string
    lastModified?: string
    modifiedBy?: string
  }
}

export default function BrandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeConfig, setActiveConfig] = useState<SiteConfiguration | null>(null)
  const [allConfigs, setAllConfigs] = useState<SiteConfiguration[]>([])
  const [formData, setFormData] = useState<SiteConfiguration>({
    title: '',
    logo: {
      useDefaultLogo: true,
      logoText: 'Godot Tekko',
      showText: true,
      logoSize: { width: 32, height: 32 },
      altText: 'Godot Tekko Logo'
    },
    branding: {
      primaryColor: { hex: '#3b82f6' },
      secondaryColor: { hex: '#1e40af' },
      accentColor: { hex: '#10b981' }
    },
    siteInfo: {
      siteName: 'Godot Tekko',
      tagline: 'Premium Design & Game Development Marketplace',
      description: '',
      keywords: []
    },
    socialMedia: {},
    settings: {
      isActive: true,
      environment: 'production'
    }
  })
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/branding')
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/')
    }
  }, [status, session, router])

  // Load site configuration
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      loadSiteConfiguration()
    }
  }, [status, session])

  const loadSiteConfiguration = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/site-configuration')
      const data = await response.json()

      if (data.success) {
        setActiveConfig(data.activeConfiguration)
        setAllConfigs(data.allConfigurations)

        if (data.activeConfiguration) {
          setFormData(data.activeConfiguration)
        }
      } else {
        toast.error('Failed to load site configuration')
      }
    } catch (error) {
      console.error('Error loading site configuration:', error)
      toast.error('Failed to load site configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const endpoint = formData._id
        ? '/api/admin/site-configuration'
        : '/api/admin/site-configuration'

      const method = formData._id ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Configuration ${formData._id ? 'updated' : 'created'} successfully!`)
        await loadSiteConfiguration()

        // Clear cache
        await fetch('/api/site-configuration', { method: 'POST' })
      } else {
        toast.error(result.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error('Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be less than 5MB')
      return
    }

    try {
      setIsSaving(true)
      toast.loading('Uploading image...')

      // Create form data for upload
      const formData = new FormData()
      formData.append('file', file)

      // Upload to Sanity
      const uploadResponse = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })

      const uploadResult = await uploadResponse.json()

      if (uploadResult.success) {
        // Update form data with new image
        setFormData(prev => ({
          ...prev,
          logo: {
            ...prev.logo,
            logoImage: {
              asset: {
                url: uploadResult.asset.url,
                _id: uploadResult.asset._id,
                metadata: uploadResult.asset.metadata
              }
            }
          }
        }))

        toast.dismiss()
        toast.success('Image uploaded successfully!')
      } else {
        toast.dismiss()
        toast.error(uploadResult.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.dismiss()
      toast.error('Failed to upload image')
    } finally {
      setIsSaving(false)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      logo: {
        ...prev.logo,
        logoImage: undefined
      }
    }))
    toast.success('Image removed')
  }

  const addKeyword = () => {
    const keyword = prompt('Enter a keyword:')
    if (keyword && keyword.trim()) {
      setFormData(prev => ({
        ...prev,
        siteInfo: {
          ...prev.siteInfo,
          keywords: [...prev.siteInfo.keywords, keyword.trim()]
        }
      }))
    }
  }

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      siteInfo: {
        ...prev.siteInfo,
        keywords: prev.siteInfo.keywords.filter((_, i) => i !== index)
      }
    }))
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <p>Loading branding settings...</p>
        </div>
      </div>
    )
  }

  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Site Branding & Logo</h1>
          <p className="text-gray-600 mt-2">
            Customize your site's logo, colors, and branding elements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadSiteConfiguration}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="logo" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="logo">Logo</TabsTrigger>
              <TabsTrigger value="branding">Colors</TabsTrigger>
              <TabsTrigger value="info">Site Info</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>

            {/* Logo Tab */}
            <TabsContent value="logo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Logo Image
                  </CardTitle>
                  <CardDescription>
                    Upload your site logo (recommended: SVG or PNG with transparent background)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Default Logo Toggle */}
                  <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="useDefaultLogo" className="text-sm font-medium">
                          Use Default Godot Tekko Logo
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">
                          Enable to use the official Godot Tekko logo, disable to use your custom uploaded logo
                        </p>
                      </div>
                      <Switch
                        id="useDefaultLogo"
                        checked={formData.logo.useDefaultLogo}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          logo: { ...prev.logo, useDefaultLogo: checked }
                        }))}
                      />
                    </div>

                    {formData.logo.useDefaultLogo && (
                      <div className="flex items-center gap-3 p-3 bg-white border rounded-md">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">GT</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">Default Godot Tekko Logo Active</p>
                          <p className="text-xs text-blue-600">Official branding with consistent styling</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Custom Logo Section */}
                  <div className={`space-y-4 ${formData.logo.useDefaultLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Custom Logo Upload</Label>
                      {formData.logo.useDefaultLogo && (
                        <Badge variant="secondary" className="text-xs">
                          Disabled - Using Default Logo
                        </Badge>
                      )}
                    </div>

                    {/* Current Custom Logo Display */}
                    {formData.logo.logoImage?.asset?.url ? (
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                      <img
                        src={formData.logo.logoImage.asset.url}
                        alt={formData.logo.altText}
                        className="w-16 h-16 object-contain bg-white rounded border"
                      />
                      <div className="flex-1">
                        <p className="font-medium">Current Logo</p>
                        <p className="text-sm text-gray-600">
                          {formData.logo.logoSize.width} × {formData.logo.logoSize.height} px
                        </p>
                      </div>
                      <Button
                        onClick={removeImage}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">No logo uploaded</p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  )}

                  {/* File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                    {/* Upload Button */}
                    {formData.logo.logoImage?.asset?.url && (
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        disabled={isSaving}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Logo
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Logo Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logoText">Logo Text</Label>
                      <Input
                        id="logoText"
                        value={formData.logo.logoText}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          logo: { ...prev.logo, logoText: e.target.value }
                        }))}
                        placeholder="Godot Tekko"
                      />
                    </div>

                    <div>
                      <Label htmlFor="altText">Alt Text</Label>
                      <Input
                        id="altText"
                        value={formData.logo.altText}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          logo: { ...prev.logo, altText: e.target.value }
                        }))}
                        placeholder="Logo description"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showText"
                      checked={formData.logo.showText}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        logo: { ...prev.logo, showText: checked }
                      }))}
                    />
                    <Label htmlFor="showText">Show logo text</Label>
                  </div>

                  {/* Logo Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logoWidth">Width (px)</Label>
                      <Input
                        id="logoWidth"
                        type="number"
                        min="16"
                        max="200"
                        value={formData.logo.logoSize.width}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          logo: {
                            ...prev.logo,
                            logoSize: {
                              ...prev.logo.logoSize,
                              width: parseInt(e.target.value) || 32
                            }
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="logoHeight">Height (px)</Label>
                      <Input
                        id="logoHeight"
                        type="number"
                        min="16"
                        max="200"
                        value={formData.logo.logoSize.height}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          logo: {
                            ...prev.logo,
                            logoSize: {
                              ...prev.logo.logoSize,
                              height: parseInt(e.target.value) || 32
                            }
                          }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Colors Tab */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Brand Colors
                  </CardTitle>
                  <CardDescription>
                    Define your brand's color palette
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.branding.primaryColor?.hex || '#3b82f6'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              primaryColor: { hex: e.target.value }
                            }
                          }))}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={formData.branding.primaryColor?.hex || '#3b82f6'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              primaryColor: { hex: e.target.value }
                            }
                          }))}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.branding.secondaryColor?.hex || '#1e40af'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              secondaryColor: { hex: e.target.value }
                            }
                          }))}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={formData.branding.secondaryColor?.hex || '#1e40af'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              secondaryColor: { hex: e.target.value }
                            }
                          }))}
                          placeholder="#1e40af"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.branding.accentColor?.hex || '#10b981'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              accentColor: { hex: e.target.value }
                            }
                          }))}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={formData.branding.accentColor?.hex || '#10b981'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding,
                              accentColor: { hex: e.target.value }
                            }
                          }))}
                          placeholder="#10b981"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="space-y-2">
                    <Label>Color Preview</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        className="h-12 rounded border flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: formData.branding.primaryColor?.hex || '#3b82f6' }}
                      >
                        Primary
                      </div>
                      <div
                        className="h-12 rounded border flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: formData.branding.secondaryColor?.hex || '#1e40af' }}
                      >
                        Secondary
                      </div>
                      <div
                        className="h-12 rounded border flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: formData.branding.accentColor?.hex || '#10b981' }}
                      >
                        Accent
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Site Info Tab */}
            <TabsContent value="info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Type className="w-5 h-5 mr-2" />
                    Site Information
                  </CardTitle>
                  <CardDescription>
                    Configure your site's basic information and SEO
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={formData.siteInfo.siteName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        siteInfo: { ...prev.siteInfo, siteName: e.target.value }
                      }))}
                      placeholder="Godot Tekko"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={formData.siteInfo.tagline}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        siteInfo: { ...prev.siteInfo, tagline: e.target.value }
                      }))}
                      placeholder="Premium Design & Game Development Marketplace"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.siteInfo.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        siteInfo: { ...prev.siteInfo, description: e.target.value }
                      }))}
                      placeholder="Describe your site..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>SEO Keywords</Label>
                      <Button
                        onClick={addKeyword}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.siteInfo.keywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeKeyword(index)}
                        >
                          {keyword}
                          <Trash2 className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                      {formData.siteInfo.keywords.length === 0 && (
                        <p className="text-sm text-gray-500">No keywords added</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media Tab */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>
                    Add your social media profile URLs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={formData.socialMedia.twitter || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                        }))}
                        placeholder="https://twitter.com/username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="github">GitHub</Label>
                      <Input
                        id="github"
                        type="url"
                        value={formData.socialMedia.github || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialMedia: { ...prev.socialMedia, github: e.target.value }
                        }))}
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={formData.socialMedia.linkedin || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                        }))}
                        placeholder="https://linkedin.com/company/name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        type="url"
                        value={formData.socialMedia.instagram || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                        }))}
                        placeholder="https://instagram.com/username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        type="url"
                        value={formData.socialMedia.youtube || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                        }))}
                        placeholder="https://youtube.com/channel/id"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discord">Discord</Label>
                      <Input
                        id="discord"
                        type="url"
                        value={formData.socialMedia.discord || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialMedia: { ...prev.socialMedia, discord: e.target.value }
                        }))}
                        placeholder="https://discord.gg/invite"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your changes will look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview Controls */}
              <div className="flex items-center justify-center gap-1 p-1 bg-gray-100 rounded-md">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>

              {/* Header Preview */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <div
                  className="px-4 py-3 border-b"
                  style={{ backgroundColor: formData.branding.primaryColor?.hex || '#3b82f6' }}
                >
                  <div className="flex items-center gap-3">
                    {formData.logo.useDefaultLogo ? (
                      // Default Godot Tekko logo preview
                      <svg
                        width={formData.logo.logoSize.width}
                        height={formData.logo.logoSize.height}
                        viewBox="0 0 32 32"
                        className="drop-shadow-sm"
                      >
                        <defs>
                          <linearGradient id="previewGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor: formData.branding.primaryColor?.hex || '#3b82f6'}} />
                            <stop offset="100%" style={{stopColor: formData.branding.accentColor?.hex || '#10b981'}} />
                          </linearGradient>
                        </defs>
                        <rect width="32" height="32" rx="6" fill="url(#previewGradient)" />
                        <text
                          x="16"
                          y="20"
                          textAnchor="middle"
                          fill="white"
                          fontSize="13"
                          fontWeight="700"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          style={{letterSpacing: '-0.5px'}}
                        >
                          GT
                        </text>
                        <circle cx="25" cy="7" r="1.5" fill="white" fillOpacity="0.3" />
                        <circle cx="7" cy="25" r="1" fill="white" fillOpacity="0.2" />
                      </svg>
                    ) : formData.logo.logoImage?.asset?.url ? (
                      // Custom uploaded logo preview
                      <img
                        src={formData.logo.logoImage.asset.url}
                        alt={formData.logo.altText}
                        style={{
                          width: `${formData.logo.logoSize.width}px`,
                          height: `${formData.logo.logoSize.height}px`
                        }}
                        className="object-contain"
                      />
                    ) : (
                      // Fallback to default when no custom logo
                      <svg
                        width={formData.logo.logoSize.width}
                        height={formData.logo.logoSize.height}
                        viewBox="0 0 32 32"
                        className="drop-shadow-sm"
                      >
                        <defs>
                          <linearGradient id="fallbackPreviewGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor: formData.branding.primaryColor?.hex || '#3b82f6'}} />
                            <stop offset="100%" style={{stopColor: formData.branding.accentColor?.hex || '#10b981'}} />
                          </linearGradient>
                        </defs>
                        <rect width="32" height="32" rx="6" fill="url(#fallbackPreviewGradient)" />
                        <text
                          x="16"
                          y="20"
                          textAnchor="middle"
                          fill="white"
                          fontSize="13"
                          fontWeight="700"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          style={{letterSpacing: '-0.5px'}}
                        >
                          GT
                        </text>
                        <circle cx="25" cy="7" r="1.5" fill="white" fillOpacity="0.3" />
                        <circle cx="7" cy="25" r="1" fill="white" fillOpacity="0.2" />
                      </svg>
                    )}
                    {formData.logo.showText && (
                      <span className="text-white font-bold text-lg">
                        {formData.logo.logoText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg">{formData.siteInfo.siteName}</h3>
                  <p className="text-sm text-gray-600">{formData.siteInfo.tagline}</p>
                  {formData.siteInfo.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {formData.siteInfo.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Configuration Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Configuration:</span>
                  <span className="font-medium">{formData.title || 'New Config'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={formData.settings.isActive ? 'default' : 'secondary'}>
                    {formData.settings.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-medium capitalize">{formData.settings.environment}</span>
                </div>
                {formData.settings.lastModified && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last modified:</span>
                    <span className="font-medium">
                      {new Date(formData.settings.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Save Reminder */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Remember:</strong> Click "Save Changes" to apply your modifications to the live site.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
