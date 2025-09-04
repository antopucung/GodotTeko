import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'

// Default site configuration that gets auto-seeded
const DEFAULT_SITE_CONFIG = {
  _type: 'siteConfiguration',
  title: 'Default Godot Tekko Configuration',
  logo: {
    useDefaultLogo: true,
    logoText: 'Godot Tekko',
    showText: true,
    logoSize: {
      width: 32,
      height: 32
    },
    altText: 'Godot Tekko Logo'
  },
  branding: {
    primaryColor: { hex: '#3b82f6' }, // Blue-600
    secondaryColor: { hex: '#1e40af' }, // Blue-800
    accentColor: { hex: '#10b981' } // Green-500
  },
  siteInfo: {
    siteName: 'Godot Tekko',
    tagline: 'Premium Design & Game Development Marketplace',
    description: 'Discover premium UI kits, game assets, Godot templates, and design resources at Godot Tekko. Perfect for game developers, designers, and creative professionals.',
    keywords: ['godot', 'game development', 'ui kits', 'design resources', 'game assets', 'templates']
  },
  socialMedia: {
    twitter: 'https://twitter.com/godottekko',
    github: 'https://github.com/godottekko',
    discord: 'https://discord.gg/godottekko'
  },
  settings: {
    isActive: true,
    environment: 'production',
    lastModified: new Date().toISOString(),
    modifiedBy: 'system'
  }
}

// Auto-seed default configuration if none exists
async function ensureDefaultConfigExists(userId?: string): Promise<void> {
  try {
    console.log('🔍 Checking if site configuration exists...')

    const existingConfig = await sanityClient.fetch(
      '*[_type == "siteConfiguration" && settings.isActive == true][0]'
    )

    if (!existingConfig) {
      console.log('🌱 No active site configuration found, creating default...')

      const configWithMetadata = {
        ...DEFAULT_SITE_CONFIG,
        settings: {
          ...DEFAULT_SITE_CONFIG.settings,
          modifiedBy: userId || 'system',
          lastModified: new Date().toISOString()
        }
      }

      const created = await sanityClient.create(configWithMetadata)
      console.log('✅ Default site configuration created:', created._id)
    } else {
      console.log('✅ Active site configuration found:', existingConfig._id)
    }
  } catch (error) {
    console.error('❌ Error checking/creating site configuration:', error)
  }
}

// GET - Fetch active site configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure default config exists
    await ensureDefaultConfigExists(session.user.id)

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let query = '*[_type == "siteConfiguration"]'
    if (!includeInactive) {
      query = '*[_type == "siteConfiguration" && settings.isActive == true]'
    }

    query += ' | order(settings.lastModified desc)'

    const configurations = await sanityClient.fetch(`
      ${query} {
        _id,
        _createdAt,
        _updatedAt,
        title,
        logo {
          logoImage {
            asset->{
              _id,
              url,
              metadata {
                dimensions,
                lqip
              }
            }
          },
          logoText,
          showText,
          logoSize,
          altText
        },
        branding {
          primaryColor,
          secondaryColor,
          accentColor
        },
        siteInfo {
          siteName,
          tagline,
          description,
          keywords
        },
        socialMedia,
        settings {
          isActive,
          environment,
          lastModified,
          modifiedBy
        }
      }
    `)

    // Get the active configuration (or first one if none active)
    const activeConfig = configurations.find((config: any) => config.settings?.isActive) || configurations[0]

    return NextResponse.json({
      success: true,
      activeConfiguration: activeConfig,
      allConfigurations: configurations,
      total: configurations.length
    })

  } catch (error) {
    console.error('Error fetching site configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site configuration' },
      { status: 500 }
    )
  }
}

// POST - Create new site configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, logo, branding, siteInfo, socialMedia, settings } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // If setting this config as active, deactivate others
    if (settings?.isActive) {
      await sanityClient
        .patch({ query: '*[_type == "siteConfiguration" && settings.isActive == true]' })
        .set({ 'settings.isActive': false })
        .commit()
    }

    // Create new configuration
    const newConfig = await sanityClient.create({
      _type: 'siteConfiguration',
      title,
      logo: {
        logoText: logo?.logoText || 'Godot Tekko',
        showText: logo?.showText !== false,
        logoSize: logo?.logoSize || { width: 32, height: 32 },
        altText: logo?.altText || 'Logo',
        ...(logo?.logoImage && { logoImage: logo.logoImage })
      },
      branding: branding || {},
      siteInfo: siteInfo || {},
      socialMedia: socialMedia || {},
      settings: {
        isActive: settings?.isActive || false,
        environment: settings?.environment || 'production',
        lastModified: new Date().toISOString(),
        modifiedBy: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      configuration: newConfig,
      message: 'Site configuration created successfully'
    })

  } catch (error) {
    console.error('Error creating site configuration:', error)
    return NextResponse.json(
      { error: 'Failed to create site configuration' },
      { status: 500 }
    )
  }
}

// PUT - Update existing site configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { _id, title, logo, branding, siteInfo, socialMedia, settings } = body

    if (!_id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    // If setting this config as active, deactivate others
    if (settings?.isActive) {
      await sanityClient
        .patch({ query: `*[_type == "siteConfiguration" && _id != "${_id}" && settings.isActive == true]` })
        .set({ 'settings.isActive': false })
        .commit()
    }

    // Update configuration
    const updatedConfig = await sanityClient
      .patch(_id)
      .set({
        ...(title && { title }),
        ...(logo && { logo }),
        ...(branding && { branding }),
        ...(siteInfo && { siteInfo }),
        ...(socialMedia && { socialMedia }),
        settings: {
          ...settings,
          lastModified: new Date().toISOString(),
          modifiedBy: session.user.id
        }
      })
      .commit()

    return NextResponse.json({
      success: true,
      configuration: updatedConfig,
      message: 'Site configuration updated successfully'
    })

  } catch (error) {
    console.error('Error updating site configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update site configuration' },
      { status: 500 }
    )
  }
}

// DELETE - Delete site configuration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check admin access
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    // Check if this is the only configuration
    const allConfigs = await sanityClient.fetch('*[_type == "siteConfiguration"]')
    if (allConfigs.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last site configuration' },
        { status: 400 }
      )
    }

    // Delete configuration
    await sanityClient.delete(configId)

    // If deleted config was active, make another one active
    const remainingConfigs = await sanityClient.fetch(
      '*[_type == "siteConfiguration"] | order(settings.lastModified desc)'
    )

    if (remainingConfigs.length > 0 && !remainingConfigs.some((config: any) => config.settings?.isActive)) {
      await sanityClient
        .patch(remainingConfigs[0]._id)
        .set({
          'settings.isActive': true,
          'settings.lastModified': new Date().toISOString(),
          'settings.modifiedBy': session.user.id
        })
        .commit()
    }

    return NextResponse.json({
      success: true,
      message: 'Site configuration deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting site configuration:', error)
    return NextResponse.json(
      { error: 'Failed to delete site configuration' },
      { status: 500 }
    )
  }
}
