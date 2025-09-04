import { NextRequest, NextResponse } from 'next/server'
import { client as sanityClient } from '@/lib/sanity'

// Cache configuration for better performance
let configCache: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// GET - Fetch active site configuration (public endpoint)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching active site configuration...')

    // Check cache first
    const now = Date.now()
    if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('✅ Returning cached site configuration')
      return NextResponse.json({
        success: true,
        configuration: configCache,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000)
      })
    }

    // Fetch active configuration from Sanity
    const activeConfig = await sanityClient.fetch(`
      *[_type == "siteConfiguration" && settings.isActive == true][0] {
        _id,
        _updatedAt,
        title,
        logo {
          logoImage {
            asset->{
              _id,
              url,
              metadata {
                dimensions,
                lqip,
                hasAlpha,
                isOpaque
              }
            },
            alt,
            hotspot,
            crop
          },
          logoText,
          showText,
          logoSize {
            width,
            height
          },
          altText
        },
        branding {
          primaryColor {
            hex,
            alpha
          },
          secondaryColor {
            hex,
            alpha
          },
          accentColor {
            hex,
            alpha
          }
        },
        siteInfo {
          siteName,
          tagline,
          description,
          keywords
        },
        socialMedia {
          twitter,
          github,
          linkedin,
          instagram,
          youtube,
          discord
        },
        settings {
          environment,
          lastModified
        }
      }
    `)

    // If no active config found, return default
    if (!activeConfig) {
      console.log('⚠️ No active site configuration found, returning default')

      const defaultConfig = {
        _id: 'default',
        title: 'Default Configuration',
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
          description: 'Discover premium UI kits, game assets, Godot templates, and design resources.',
          keywords: ['godot', 'game development', 'ui kits', 'design resources']
        },
        socialMedia: {},
        settings: {
          environment: 'production',
          lastModified: new Date().toISOString()
        }
      }

      return NextResponse.json({
        success: true,
        configuration: defaultConfig,
        fallback: true
      })
    }

    // Update cache
    configCache = activeConfig
    cacheTimestamp = now

    console.log('✅ Active site configuration fetched:', activeConfig._id)

    // Transform response for public consumption with smart logo selection
    const useDefaultLogo = activeConfig.logo?.useDefaultLogo !== false // Default to true if not set
    const hasCustomLogo = activeConfig.logo?.logoImage?.asset?.url

    const publicConfig = {
      id: activeConfig._id,
      siteName: activeConfig.siteInfo?.siteName || 'Godot Tekko',
      tagline: activeConfig.siteInfo?.tagline || 'Premium Design & Game Development Marketplace',
      description: activeConfig.siteInfo?.description || '',
      logo: {
        useDefaultLogo,
        image: (!useDefaultLogo && hasCustomLogo) ? {
          url: activeConfig.logo.logoImage.asset.url,
          width: activeConfig.logo?.logoSize?.width || 32,
          height: activeConfig.logo?.logoSize?.height || 32,
          alt: activeConfig.logo?.altText || 'Logo',
          metadata: activeConfig.logo.logoImage.asset.metadata
        } : null,
        text: activeConfig.logo?.logoText || 'Godot Tekko',
        showText: activeConfig.logo?.showText !== false,
        size: activeConfig.logo?.logoSize || { width: 32, height: 32 }
      },
      branding: {
        primaryColor: activeConfig.branding?.primaryColor?.hex || '#3b82f6',
        secondaryColor: activeConfig.branding?.secondaryColor?.hex || '#1e40af',
        accentColor: activeConfig.branding?.accentColor?.hex || '#10b981'
      },
      socialMedia: activeConfig.socialMedia || {},
      lastModified: activeConfig.settings?.lastModified || activeConfig._updatedAt
    }

    return NextResponse.json({
      success: true,
      configuration: publicConfig,
      lastModified: activeConfig._updatedAt
    })

  } catch (error) {
    console.error('❌ Error fetching site configuration:', error)

    // Return fallback configuration on error (offline mode)
    const fallbackConfig = {
      id: 'fallback',
      siteName: 'Godot Tekko',
      tagline: 'Premium Design & Game Development Marketplace',
      description: 'Discover premium UI kits, game assets, Godot templates, and design resources.',
      logo: {
        useDefaultLogo: true, // Always use default logo in offline mode
        image: null,
        text: 'Godot Tekko',
        showText: true,
        size: { width: 32, height: 32 }
      },
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        accentColor: '#10b981'
      },
      socialMedia: {},
      lastModified: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      configuration: fallbackConfig,
      fallback: true,
      error: 'Failed to fetch configuration, using fallback'
    })
  }
}

// POST - Clear configuration cache (for admin use)
export async function POST(request: NextRequest) {
  try {
    // Clear cache
    configCache = null
    cacheTimestamp = 0

    return NextResponse.json({
      success: true,
      message: 'Site configuration cache cleared'
    })

  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
