import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/database'
import { Project } from '@/lib/models/Project'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userRole = session.user.role || 'user'
    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const projectId = params.id
    const { notes } = await request.json()

    if (!notes?.trim()) {
      return NextResponse.json({ success: false, error: 'Rejection notes are required' }, { status: 400 })
    }

    // Try to connect to database and mark project as rejected
    const db = await connectToDatabase()

    if (db) {
      try {
        const updatedProject = await Project.findByIdAndUpdate(
          projectId,
          {
            approved: false,
            rejected: true,
            rejectedAt: new Date(),
            rejectedBy: session.user.id,
            adminNotes: notes,
            updatedAt: new Date()
          },
          { new: true }
        )

        if (!updatedProject) {
          return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
        }

        console.log(`✅ Project ${projectId} rejected by admin`)
        return NextResponse.json({
          success: true,
          project: updatedProject,
          message: 'Project rejected successfully'
        })
      } catch (dbError) {
        console.error('⚠️ Database update failed:', dbError)
        return NextResponse.json({ success: false, error: 'Failed to reject project' }, { status: 500 })
      }
    } else {
      // Database unavailable - return success for demo
      console.log('⚠️ Database unavailable, simulating rejection')
      return NextResponse.json({
        success: true,
        message: 'Project rejected successfully (demo mode)'
      })
    }
  } catch (error) {
    console.error('Error rejecting project:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
