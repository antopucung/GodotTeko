import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

// Proxy endpoint to bypass CORS for client-side Sanity calls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const params = searchParams.get('params')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Parse params if provided
    const queryParams = params ? JSON.parse(params) : {}

    // Execute query through server-side client (bypasses CORS)
    const result = await client.fetch(query, queryParams)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Sanity proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Sanity' },
      { status: 500 }
    )
  }
}

// Also handle POST for mutations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, params = {} } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const result = await client.fetch(query, params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Sanity proxy POST error:', error)
    return NextResponse.json(
      { error: 'Failed to execute Sanity query' },
      { status: 500 }
    )
  }
}
