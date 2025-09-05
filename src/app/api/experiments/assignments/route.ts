import { NextRequest, NextResponse } from 'next/server'

interface ExperimentAssignment {
  userId: string
  sessionId: string
  experimentId: string
  variantId: string
  timestamp: number
  sticky: boolean
}

// In-memory storage for demo - replace with database in production
const assignments: ExperimentAssignment[] = []

export async function POST(request: NextRequest) {
  try {
    const assignment: ExperimentAssignment = await request.json()

    // Validate assignment data
    if (!assignment.experimentId || !assignment.variantId || !assignment.sessionId) {
      return NextResponse.json(
        { error: 'Missing required assignment data' },
        { status: 400 }
      )
    }

    // Check if assignment already exists for this user/session
    const existingAssignment = assignments.find(
      a => a.experimentId === assignment.experimentId &&
           (a.userId === assignment.userId || a.sessionId === assignment.sessionId)
    )

    if (existingAssignment) {
      // Return existing assignment
      return NextResponse.json({
        success: true,
        assignment: existingAssignment,
        isNew: false
      })
    }

    // Create new assignment
    const newAssignment: ExperimentAssignment = {
      ...assignment,
      timestamp: Date.now(),
      sticky: true
    }

    assignments.push(newAssignment)

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
      isNew: true
    })

  } catch (error) {
    console.error('Error creating assignment:', error)

    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')
    const experimentId = searchParams.get('experimentId')

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId required' },
        { status: 400 }
      )
    }

    // Filter assignments
    let filteredAssignments = assignments.filter(assignment => {
      if (experimentId && assignment.experimentId !== experimentId) {
        return false
      }

      return assignment.userId === userId || assignment.sessionId === sessionId
    })

    return NextResponse.json({
      assignments: filteredAssignments,
      count: filteredAssignments.length
    })

  } catch (error) {
    console.error('Error fetching assignments:', error)

    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
