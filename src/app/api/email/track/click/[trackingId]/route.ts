import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

// GET - Track email link click and redirect
export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const trackingId = params.trackingId
    const { searchParams } = new URL(request.url)
    const originalUrl = searchParams.get('url')

    if (!originalUrl) {
      return NextResponse.json(
        { error: 'Original URL is required' },
        { status: 400 }
      )
    }

    // Decode tracking ID to get email and metadata
    const trackingData = decodeTrackingId(trackingId)

    // If tracking data is invalid, still redirect to preserve user experience
    if (!trackingData) {
      return NextResponse.redirect(decodeURIComponent(originalUrl))
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

    // Parse the clicked URL for link analysis
    const linkData = parseLinkData(originalUrl)

    // Record email click activity
    const activityId = `click_${Date.now()}_${Math.random().toString(36).substring(2)}`

    await client.create({
      _type: 'emailActivity',
      activityId,
      type: 'clicked',
      user: user?._id ? { _type: 'reference', _ref: user._id } : undefined,
      campaign: campaignId ? { _type: 'reference', _ref: campaignId } : undefined,
      workflow: workflowId ? { _type: 'reference', _ref: workflowId } : undefined,
      email: {
        toEmail: email,
        messageId: trackingData.messageId
      },
      clickData: {
        url: originalUrl,
        linkText: searchParams.get('text') || '',
        linkId: searchParams.get('linkId') || '',
        position: searchParams.get('position') || 'body'
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
        timeToClick: calculateTimeToClick(trackingData.sentAt)
      },
      tracking: {
        clickTrackingEnabled: true,
        utmParameters: extractUTMParameters(originalUrl)
      },
      conversion: {
        converted: false, // Will be updated if conversion is detected
        conversionType: await detectConversionType(originalUrl)
      },
      timestamps: {
        activityAt: new Date().toISOString(),
        recordedAt: new Date().toISOString()
      },
      metadata: {
        source: 'click_tracking',
        processingStatus: 'processed',
        referer
      }
    })

    // Update campaign/workflow analytics
    if (campaignId) {
      await updateCampaignAnalytics(campaignId, 'click', linkData)
    }

    if (workflowId) {
      await updateWorkflowAnalytics(workflowId, 'click', linkData)
    }

    // Check if this click should trigger any automation
    await checkForClickTriggers(email, originalUrl, campaignId, workflowId)

    // Add UTM parameters to the URL if not already present
    const finalUrl = addUTMParameters(originalUrl, {
      source: 'email',
      medium: campaignId ? 'campaign' : 'automation',
      campaign: campaignId || workflowId || 'email',
      content: trackingId
    })

    // Redirect to the original URL
    return NextResponse.redirect(finalUrl, { status: 302 })

  } catch (error) {
    console.error('Error tracking email click:', error)

    // Always redirect to preserve user experience, even on tracking error
    try {
      const originalUrl = new URL(request.url).searchParams.get('url')
      if (originalUrl) {
        return NextResponse.redirect(decodeURIComponent(originalUrl))
      }
    } catch (urlError) {
      console.error('Error redirecting after tracking failure:', urlError)
    }

    return NextResponse.json(
      { error: 'Link tracking failed' },
      { status: 500 }
    )
  }
}

// Decode tracking ID (same as open tracking)
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

// Get location from IP address (placeholder)
async function getLocationFromIP(ipAddress: string) {
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    timezone: 'UTC'
  }
}

// Calculate time from send to click
function calculateTimeToClick(sentAt?: Date): number {
  if (!sentAt) return 0
  return Math.floor((Date.now() - sentAt.getTime()) / 1000)
}

// Parse link data for analysis
function parseLinkData(url: string) {
  try {
    const urlObj = new URL(url)
    return {
      domain: urlObj.hostname,
      protocol: urlObj.protocol,
      path: urlObj.pathname,
      query: urlObj.search,
      isExternal: !urlObj.hostname.includes(process.env.NEXT_PUBLIC_APP_URL || ''),
      isSecure: urlObj.protocol === 'https:'
    }
  } catch (error) {
    return {
      domain: 'unknown',
      protocol: 'unknown',
      path: '',
      query: '',
      isExternal: true,
      isSecure: false
    }
  }
}

// Extract UTM parameters from URL
function extractUTMParameters(url: string) {
  try {
    const urlObj = new URL(url)
    return {
      source: urlObj.searchParams.get('utm_source'),
      medium: urlObj.searchParams.get('utm_medium'),
      campaign: urlObj.searchParams.get('utm_campaign'),
      content: urlObj.searchParams.get('utm_content'),
      term: urlObj.searchParams.get('utm_term')
    }
  } catch (error) {
    return {}
  }
}

// Detect conversion type based on URL
async function detectConversionType(url: string): Promise<string | undefined> {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname.toLowerCase()

    if (path.includes('/checkout') || path.includes('/purchase')) return 'purchase'
    if (path.includes('/signup') || path.includes('/register')) return 'signup'
    if (path.includes('/download')) return 'download'
    if (path.includes('/trial')) return 'trial'
    if (path.includes('/contact') || path.includes('/demo')) return 'form_submit'

    return undefined
  } catch (error) {
    return undefined
  }
}

// Add UTM parameters to URL
function addUTMParameters(url: string, utmParams: Record<string, string>): string {
  try {
    const urlObj = new URL(url)

    // Only add UTM parameters if they don't already exist
    Object.entries(utmParams).forEach(([key, value]) => {
      const utmKey = `utm_${key}`
      if (!urlObj.searchParams.has(utmKey) && value) {
        urlObj.searchParams.set(utmKey, value)
      }
    })

    return urlObj.toString()
  } catch (error) {
    return url
  }
}

// Update campaign analytics
async function updateCampaignAnalytics(campaignId: string, eventType: string, linkData: any) {
  try {
    await client
      .patch(campaignId)
      .inc({
        'performance.engagement.clicks': 1,
        'performance.engagement.uniqueClicks': 1 // This would need more logic to track unique clicks
      })
      .commit()
  } catch (error) {
    console.error('Error updating campaign analytics:', error)
  }
}

// Update workflow analytics
async function updateWorkflowAnalytics(workflowId: string, eventType: string, linkData: any) {
  try {
    // This would update workflow-level analytics
    // Implementation depends on how workflow analytics are structured
  } catch (error) {
    console.error('Error updating workflow analytics:', error)
  }
}

// Check for automation triggers based on clicks
async function checkForClickTriggers(email: string, clickedUrl: string, campaignId?: string, workflowId?: string) {
  try {
    // This would check if clicking specific links should trigger other workflows
    // For example, clicking a product link might trigger a product recommendation workflow

    // Check for product page clicks
    if (clickedUrl.includes('/products/')) {
      // Could trigger product interest workflow
    }

    // Check for pricing page clicks
    if (clickedUrl.includes('/pricing')) {
      // Could trigger sales workflow
    }

    // Check for unsubscribe clicks
    if (clickedUrl.includes('/unsubscribe')) {
      // Update user preferences
      await updateUnsubscribeStatus(email)
    }

  } catch (error) {
    console.error('Error checking click triggers:', error)
  }
}

// Update unsubscribe status
async function updateUnsubscribeStatus(email: string) {
  try {
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0] { _id }`,
      { email }
    )

    if (user) {
      // Update newsletter preferences
      const preferences = await client.fetch(
        `*[_type == "newsletterPreferences" && user._ref == $userId][0]`,
        { userId: user._id }
      )

      if (preferences) {
        await client
          .patch(preferences._id)
          .set({
            globalStatus: 'unsubscribed',
            'timestamps.unsubscribedAt': new Date().toISOString()
          })
          .commit()
      }
    }
  } catch (error) {
    console.error('Error updating unsubscribe status:', error)
  }
}
