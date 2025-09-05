import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

// GET - Track email open
export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const trackingId = params.trackingId

    // Decode tracking ID to get email and metadata
    const trackingData = decodeTrackingId(trackingId)
    if (!trackingData) {
      // Return transparent pixel even if tracking fails
      return createTrackingPixelResponse()
    }

    const { email, campaignId, workflowId } = trackingData

    // Get user data
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0] { _id, email, name }`,
      { email }
    )

    // Extract additional data from request
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const ipAddress = getClientIP(request)
    const deviceData = parseUserAgent(userAgent)

    // Check if this open has already been recorded (prevent duplicate opens from email client prefetching)
    const recentOpen = await client.fetch(`
      *[_type == "emailActivity" &&
        type == "opened" &&
        email.toEmail == $email &&
        dateTime(timestamps.activityAt) > dateTime(now()) - 300 && // Within last 5 minutes
        deviceData.userAgent == $userAgent
      ][0]
    `, { email, userAgent })

    if (recentOpen) {
      // Return tracking pixel without recording duplicate
      return createTrackingPixelResponse()
    }

    // Record email open activity
    const activityId = `open_${Date.now()}_${Math.random().toString(36).substring(2)}`

    await client.create({
      _type: 'emailActivity',
      activityId,
      type: 'opened',
      user: user?._id ? { _type: 'reference', _ref: user._id } : undefined,
      campaign: campaignId ? { _type: 'reference', _ref: campaignId } : undefined,
      workflow: workflowId ? { _type: 'reference', _ref: workflowId } : undefined,
      email: {
        toEmail: email,
        messageId: trackingData.messageId
      },
      deviceData: {
        userAgent,
        device: deviceData.device,
        browser: deviceData.browser,
        operatingSystem: deviceData.os,
        emailClient: detectEmailClient(userAgent),
        ipAddress,
        location: await getLocationFromIP(ipAddress)
      },
      engagement: {
        timeToOpen: calculateTimeToOpen(trackingData.sentAt)
      },
      tracking: {
        openTrackingEnabled: true,
        pixelLoaded: true,
        imagesBlocked: false
      },
      timestamps: {
        activityAt: new Date().toISOString(),
        recordedAt: new Date().toISOString()
      },
      metadata: {
        source: 'tracking_pixel',
        processingStatus: 'processed',
        referer
      }
    })

    // Update campaign/workflow analytics
    if (campaignId) {
      await updateCampaignAnalytics(campaignId, 'open')
    }

    if (workflowId) {
      await updateWorkflowAnalytics(workflowId, 'open')
    }

    // Return transparent tracking pixel
    return createTrackingPixelResponse()

  } catch (error) {
    console.error('Error tracking email open:', error)
    // Always return tracking pixel even on error
    return createTrackingPixelResponse()
  }
}

// Create transparent 1x1 pixel response
function createTrackingPixelResponse() {
  // 1x1 transparent GIF pixel
  const pixel = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x04, 0x01, 0x00, 0x3B
  ])

  return new NextResponse(pixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

// Decode tracking ID
function decodeTrackingId(trackingId: string): any {
  try {
    const decoded = Buffer.from(trackingId, 'base64url').toString('utf-8')
    const [email, campaignId, workflowId, timestamp, messageId] = decoded.split(':')

    return {
      email,
      campaignId: campaignId || undefined,
      workflowId: workflowId || undefined,
      sentAt: timestamp ? new Date(parseInt(timestamp)) : undefined,
      messageId: messageId || undefined
    }
  } catch (error) {
    console.error('Error decoding tracking ID:', error)
    return null
  }
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return realIP || cfConnectingIP || 'unknown'
}

// Parse user agent for device information
function parseUserAgent(userAgent: string) {
  const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' :
                 /Tablet|iPad/.test(userAgent) ? 'tablet' : 'desktop'

  let browser = 'unknown'
  if (/Chrome/.test(userAgent)) browser = 'Chrome'
  else if (/Firefox/.test(userAgent)) browser = 'Firefox'
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari'
  else if (/Edge/.test(userAgent)) browser = 'Edge'

  let os = 'unknown'
  if (/Windows/.test(userAgent)) os = 'Windows'
  else if (/Macintosh|Mac OS X/.test(userAgent)) os = 'macOS'
  else if (/Linux/.test(userAgent)) os = 'Linux'
  else if (/Android/.test(userAgent)) os = 'Android'
  else if (/iOS|iPhone|iPad/.test(userAgent)) os = 'iOS'

  return { device, browser, os }
}

// Detect email client from user agent
function detectEmailClient(userAgent: string): string {
  if (/Outlook/.test(userAgent)) return 'outlook'
  if (/Apple Mail/.test(userAgent)) return 'apple_mail'
  if (/Gmail/.test(userAgent)) return 'gmail'
  if (/Yahoo/.test(userAgent)) return 'yahoo'
  if (/Thunderbird/.test(userAgent)) return 'thunderbird'
  return 'other'
}

// Get location from IP address (placeholder - would use geolocation service)
async function getLocationFromIP(ipAddress: string) {
  // This would integrate with a geolocation service like MaxMind or ipapi
  // For now, return null to avoid external dependencies
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    timezone: 'UTC'
  }
}

// Calculate time from send to open
function calculateTimeToOpen(sentAt?: Date): number {
  if (!sentAt) return 0
  return Math.floor((Date.now() - sentAt.getTime()) / 1000)
}

// Update campaign analytics
async function updateCampaignAnalytics(campaignId: string, eventType: string) {
  try {
    // Increment open count for campaign
    await client
      .patch(campaignId)
      .inc({
        'performance.engagement.opens': 1,
        'performance.engagement.uniqueOpens': 1 // This would need more logic to track unique opens
      })
      .commit()
  } catch (error) {
    console.error('Error updating campaign analytics:', error)
  }
}

// Update workflow analytics
async function updateWorkflowAnalytics(workflowId: string, eventType: string) {
  try {
    // This would update workflow-level analytics
    // Implementation depends on how workflow analytics are structured
  } catch (error) {
    console.error('Error updating workflow analytics:', error)
  }
}
