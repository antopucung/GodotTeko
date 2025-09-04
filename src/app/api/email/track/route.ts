import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client as sanityClient } from '@/lib/sanity'
import { PLATFORM_CONFIG } from '@/config/platform'

// Email tracking endpoint for opens and clicks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'open' or 'click'
    const campaignId = searchParams.get('c')
    const workflowId = searchParams.get('w')
    const recipientId = searchParams.get('r')
    const linkId = searchParams.get('l') // for click tracking
    const timestamp = new Date().toISOString()

    // Get IP and user agent for analytics
    const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!type || (!campaignId && !workflowId) || !recipientId) {
      return new NextResponse('Invalid tracking parameters', { status: 400 })
    }

    // Check if tracking is enabled
    const trackingEnabled = type === 'open'
      ? PLATFORM_CONFIG.emailAutomation.analytics.trackOpens
      : PLATFORM_CONFIG.emailAutomation.analytics.trackClicks

    if (!trackingEnabled) {
      return handleTrackingPixel()
    }

    // Record the tracking event
    const trackingData = {
      _type: 'emailActivity',
      type,
      campaignId: campaignId || null,
      workflowId: workflowId || null,
      recipientId,
      linkId: linkId || null,
      timestamp,
      metadata: {
        ip,
        userAgent,
        referer: request.headers.get('referer') || null
      }
    }

    // Save to Sanity
    await sanityClient.create(trackingData)

    // Update campaign/workflow metrics
    if (campaignId) {
      await updateCampaignMetrics(campaignId, type)
    }

    if (workflowId) {
      await updateWorkflowMetrics(workflowId, type)
    }

    // Handle different tracking types
    switch (type) {
      case 'open':
        return handleTrackingPixel()

      case 'click':
        const redirectUrl = searchParams.get('url')
        if (redirectUrl) {
          // Validate URL for security
          try {
            const url = new URL(redirectUrl)
            // Only allow http/https protocols
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              return NextResponse.redirect(redirectUrl)
            }
          } catch (error) {
            console.error('Invalid redirect URL:', error)
          }
        }
        return new NextResponse('Invalid redirect URL', { status: 400 })

      default:
        return new NextResponse('Invalid tracking type', { status: 400 })
    }

  } catch (error) {
    console.error('Email tracking error:', error)

    // For tracking pixels, always return a valid response even on error
    if (request.url.includes('type=open')) {
      return handleTrackingPixel()
    }

    return new NextResponse('Tracking error', { status: 500 })
  }
}

// Handle email open tracking with a 1x1 transparent pixel
function handleTrackingPixel() {
  // 1x1 transparent GIF pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )

  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

// Update campaign metrics
async function updateCampaignMetrics(campaignId: string, type: string) {
  try {
    // Get current campaign
    const campaign = await sanityClient.fetch(`
      *[_type == "emailCampaign" && _id == $campaignId][0] {
        _id,
        metrics
      }
    `, { campaignId })

    if (!campaign) return

    // Increment the appropriate metric
    const currentMetrics = campaign.metrics || {
      sent: 0,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
      complained: 0,
      converted: 0,
      revenue: 0
    }

    const updatedMetrics = {
      ...currentMetrics,
      [type === 'open' ? 'opened' : 'clicked']: currentMetrics[type === 'open' ? 'opened' : 'clicked'] + 1
    }

    // Calculate rates
    updatedMetrics.openRate = updatedMetrics.delivered > 0
      ? (updatedMetrics.opened / updatedMetrics.delivered) * 100
      : 0

    updatedMetrics.clickRate = updatedMetrics.opened > 0
      ? (updatedMetrics.clicked / updatedMetrics.opened) * 100
      : 0

    updatedMetrics.conversionRate = updatedMetrics.sent > 0
      ? (updatedMetrics.converted / updatedMetrics.sent) * 100
      : 0

    // Update campaign
    await sanityClient
      .patch(campaignId)
      .set({ metrics: updatedMetrics })
      .commit()

  } catch (error) {
    console.error('Error updating campaign metrics:', error)
  }
}

// Update workflow metrics
async function updateWorkflowMetrics(workflowId: string, type: string) {
  try {
    // Get current workflow
    const workflow = await sanityClient.fetch(`
      *[_type == "emailWorkflow" && _id == $workflowId][0] {
        _id,
        statistics
      }
    `, { workflowId })

    if (!workflow) return

    // Increment the appropriate statistic
    const currentStats = workflow.statistics || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0
    }

    const updatedStats = {
      ...currentStats,
      [type === 'open' ? 'opened' : 'clicked']: currentStats[type === 'open' ? 'opened' : 'clicked'] + 1
    }

    // Update workflow
    await sanityClient
      .patch(workflowId)
      .set({ statistics: updatedStats })
      .commit()

  } catch (error) {
    console.error('Error updating workflow metrics:', error)
  }
}

// Handle POST requests for conversion tracking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    const { campaignId, workflowId, recipientId, conversionType, value } = body

    if (!recipientId || (!campaignId && !workflowId)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Record conversion event
    const conversionData = {
      _type: 'emailActivity',
      type: 'conversion',
      campaignId: campaignId || null,
      workflowId: workflowId || null,
      recipientId,
      conversionType: conversionType || 'purchase',
      conversionValue: value || 0,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id || null
    }

    await sanityClient.create(conversionData)

    // Update metrics
    if (campaignId) {
      await updateConversionMetrics(campaignId, value || 0)
    }

    if (workflowId) {
      await updateWorkflowConversions(workflowId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Conversion tracking error:', error)
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}

// Update conversion metrics for campaigns
async function updateConversionMetrics(campaignId: string, value: number) {
  try {
    const campaign = await sanityClient.fetch(`
      *[_type == "emailCampaign" && _id == $campaignId][0] {
        _id,
        metrics
      }
    `, { campaignId })

    if (!campaign) return

    const currentMetrics = campaign.metrics || {}
    const updatedMetrics = {
      ...currentMetrics,
      converted: (currentMetrics.converted || 0) + 1,
      revenue: (currentMetrics.revenue || 0) + value
    }

    // Recalculate conversion rate
    updatedMetrics.conversionRate = updatedMetrics.sent > 0
      ? (updatedMetrics.converted / updatedMetrics.sent) * 100
      : 0

    await sanityClient
      .patch(campaignId)
      .set({ metrics: updatedMetrics })
      .commit()

  } catch (error) {
    console.error('Error updating conversion metrics:', error)
  }
}

// Update conversion statistics for workflows
async function updateWorkflowConversions(workflowId: string) {
  try {
    const workflow = await sanityClient.fetch(`
      *[_type == "emailWorkflow" && _id == $workflowId][0] {
        _id,
        statistics
      }
    `, { workflowId })

    if (!workflow) return

    const currentStats = workflow.statistics || {}
    const updatedStats = {
      ...currentStats,
      converted: (currentStats.converted || 0) + 1
    }

    await sanityClient
      .patch(workflowId)
      .set({ statistics: updatedStats })
      .commit()

  } catch (error) {
    console.error('Error updating workflow conversions:', error)
  }
}
