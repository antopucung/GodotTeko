import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = params

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Format the product ID for access pass download
    const accessPassId = `ap_${productId}`

    // Redirect to smart download API
    const smartApiUrl = `/api/download/smart/${accessPassId}`

    // Forward the request to the smart API
    const baseUrl = request.nextUrl.origin
    const smartRequest = new Request(`${baseUrl}${smartApiUrl}`, {
      method: 'GET',
      headers: request.headers
    })

    const response = await fetch(smartRequest)
    const data = await response.arrayBuffer()

    // Forward the response with all headers
    return new NextResponse(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-Forwarded-From': '/api/download/access-pass/[productId]',
        'X-Smart-API-Redirect': 'true',
        'X-Original-Product-ID': productId
      }
    })

  } catch (error) {
    console.error('Access pass download redirect error:', error)
    return NextResponse.json(
      {
        error: 'Download failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try using the direct download link or contact support'
      },
      { status: 500 }
    )
  }
}

// POST method for requesting download with additional options (redirected to smart API)
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = params
    const { format = 'all', includeSourceFiles = true } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Format the product ID for access pass download
    const accessPassId = `ap_${productId}`

    // Redirect to smart download API (GET method handles all cases)
    const smartApiUrl = `/api/download/smart/${accessPassId}`

    // Forward the request to the smart API
    const baseUrl = request.nextUrl.origin
    const smartRequest = new Request(`${baseUrl}${smartApiUrl}`, {
      method: 'GET',
      headers: {
        ...request.headers,
        'X-Download-Format': format,
        'X-Include-Source-Files': includeSourceFiles.toString()
      }
    })

    const response = await fetch(smartRequest)
    const data = await response.arrayBuffer()

    // Forward the response with all headers
    return new NextResponse(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-Forwarded-From': '/api/download/access-pass/[productId] POST',
        'X-Smart-API-Redirect': 'true',
        'X-Original-Product-ID': productId,
        'X-Requested-Format': format,
        'X-Source-Files': includeSourceFiles.toString()
      }
    })

  } catch (error) {
    console.error('Enhanced access pass download redirect error:', error)
    return NextResponse.json(
      {
        error: 'Download failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
