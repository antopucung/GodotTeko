import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mock data for now - in production, fetch from database
    const stats = {
      totalLicenses: 12,
      activeLicenses: 8,
      totalDownloads: 45,
      recentOrders: 3,
      favoriteProducts: 15,
      accessPass: null // Will be populated if user has an active pass
    }

    // Check for active access pass
    try {
      const accessPassResponse = await fetch(
        `${process.env.NEXTAUTH_URL}/api/user/access-pass-status`,
        {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        }
      )

      if (accessPassResponse.ok) {
        const accessPassData = await accessPassResponse.json()
        if (accessPassData.hasActivePass) {
          stats.accessPass = {
            isActive: true,
            type: 'professional', // Mock data
            downloadsThisPeriod: 23,
            daysRemaining: 45
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch access pass status:', error)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
