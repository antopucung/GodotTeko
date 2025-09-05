import { NextRequest, NextResponse } from 'next/server'

interface ConversionEvent {
  experimentId: string
  variantId: string
  userId?: string
  sessionId: string
  eventType: string
  eventValue?: number
  timestamp: number
  properties?: Record<string, any>
}

// In-memory storage for demo - replace with database in production
const conversions: ConversionEvent[] = []

export async function POST(request: NextRequest) {
  try {
    const conversion: ConversionEvent = await request.json()

    // Validate conversion data
    if (!conversion.experimentId || !conversion.variantId || !conversion.eventType || !conversion.sessionId) {
      return NextResponse.json(
        { error: 'Missing required conversion data' },
        { status: 400 }
      )
    }

    // Add timestamp if not provided
    if (!conversion.timestamp) {
      conversion.timestamp = Date.now()
    }

    // Store conversion
    conversions.push(conversion)

    // Log conversion for monitoring
    console.log('Conversion tracked:', {
      experiment: conversion.experimentId,
      variant: conversion.variantId,
      event: conversion.eventType,
      value: conversion.eventValue,
      userId: conversion.userId
    })

    return NextResponse.json({
      success: true,
      conversion: {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...conversion
      }
    })

  } catch (error) {
    console.error('Error tracking conversion:', error)

    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const experimentId = searchParams.get('experimentId')
    const variantId = searchParams.get('variantId')
    const eventType = searchParams.get('eventType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Filter conversions
    let filteredConversions = conversions

    if (experimentId) {
      filteredConversions = filteredConversions.filter(
        c => c.experimentId === experimentId
      )
    }

    if (variantId) {
      filteredConversions = filteredConversions.filter(
        c => c.variantId === variantId
      )
    }

    if (eventType) {
      filteredConversions = filteredConversions.filter(
        c => c.eventType === eventType
      )
    }

    if (startDate) {
      const start = new Date(startDate).getTime()
      filteredConversions = filteredConversions.filter(
        c => c.timestamp >= start
      )
    }

    if (endDate) {
      const end = new Date(endDate).getTime()
      filteredConversions = filteredConversions.filter(
        c => c.timestamp <= end
      )
    }

    // Generate conversion summary if experiment specified
    let summary = null
    if (experimentId) {
      summary = generateConversionSummary(filteredConversions, experimentId)
    }

    return NextResponse.json({
      conversions: filteredConversions.slice(-100), // Last 100 conversions
      summary,
      count: filteredConversions.length,
      filters: {
        experimentId,
        variantId,
        eventType,
        startDate,
        endDate
      }
    })

  } catch (error) {
    console.error('Error fetching conversions:', error)

    return NextResponse.json(
      { error: 'Failed to fetch conversions' },
      { status: 500 }
    )
  }
}

// Generate conversion summary for an experiment
function generateConversionSummary(conversions: ConversionEvent[], experimentId: string) {
  const experimentConversions = conversions.filter(c => c.experimentId === experimentId)

  // Group by variant
  const variantGroups = experimentConversions.reduce((groups, conversion) => {
    if (!groups[conversion.variantId]) {
      groups[conversion.variantId] = []
    }
    groups[conversion.variantId].push(conversion)
    return groups
  }, {} as Record<string, ConversionEvent[]>)

  // Calculate metrics per variant
  const variantMetrics = Object.entries(variantGroups).map(([variantId, variantConversions]) => {
    const eventTypes = variantConversions.reduce((types, conversion) => {
      if (!types[conversion.eventType]) {
        types[conversion.eventType] = {
          count: 0,
          totalValue: 0,
          averageValue: 0
        }
      }
      types[conversion.eventType].count++
      types[conversion.eventType].totalValue += conversion.eventValue || 0
      return types
    }, {} as Record<string, { count: number; totalValue: number; averageValue: number }>)

    // Calculate averages
    Object.values(eventTypes).forEach(eventType => {
      eventType.averageValue = eventType.count > 0 ? eventType.totalValue / eventType.count : 0
    })

    return {
      variantId,
      totalConversions: variantConversions.length,
      uniqueUsers: new Set(variantConversions.map(c => c.userId).filter(Boolean)).size,
      uniqueSessions: new Set(variantConversions.map(c => c.sessionId)).size,
      eventTypes,
      firstConversion: variantConversions.length > 0 ? Math.min(...variantConversions.map(c => c.timestamp)) : null,
      lastConversion: variantConversions.length > 0 ? Math.max(...variantConversions.map(c => c.timestamp)) : null
    }
  })

  // Calculate overall experiment metrics
  const totalConversions = experimentConversions.length
  const totalUniqueUsers = new Set(experimentConversions.map(c => c.userId).filter(Boolean)).size
  const totalUniqueSessions = new Set(experimentConversions.map(c => c.sessionId)).size

  // Event type breakdown across all variants
  const overallEventTypes = experimentConversions.reduce((types, conversion) => {
    if (!types[conversion.eventType]) {
      types[conversion.eventType] = {
        count: 0,
        totalValue: 0,
        averageValue: 0
      }
    }
    types[conversion.eventType].count++
    types[conversion.eventType].totalValue += conversion.eventValue || 0
    return types
  }, {} as Record<string, { count: number; totalValue: number; averageValue: number }>)

  Object.values(overallEventTypes).forEach(eventType => {
    eventType.averageValue = eventType.count > 0 ? eventType.totalValue / eventType.count : 0
  })

  return {
    experimentId,
    totalConversions,
    totalUniqueUsers,
    totalUniqueSessions,
    variantMetrics,
    overallEventTypes,
    generatedAt: new Date().toISOString()
  }
}
