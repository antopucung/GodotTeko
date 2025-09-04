import { NextRequest, NextResponse } from 'next/server'
import { EXPERIMENTS } from '@/lib/ab-testing'

// Mock experiments data - in production, this would come from a database
const activeExperiments = [
  {
    id: EXPERIMENTS.CTA_BUTTON_COLOR,
    name: 'CTA Button Color Test',
    description: 'Testing different button colors for conversion optimization',
    status: 'running' as const,
    startDate: '2024-01-01T00:00:00Z',
    targetAudience: [],
    variants: [
      {
        id: 'control',
        name: 'Control (Blue)',
        description: 'Default blue button',
        isControl: true,
        allocation: 25,
        config: {
          buttonStyle: 'default',
          showPrice: true,
          hoverEffect: 'scale'
        }
      },
      {
        id: 'green',
        name: 'Green Button',
        description: 'Green button variant',
        isControl: false,
        allocation: 25,
        config: {
          buttonStyle: 'green',
          showPrice: true,
          hoverEffect: 'scale'
        }
      },
      {
        id: 'orange',
        name: 'Orange Button',
        description: 'Orange button variant',
        isControl: false,
        allocation: 25,
        config: {
          buttonStyle: 'orange',
          showPrice: true,
          hoverEffect: 'scale'
        }
      },
      {
        id: 'purple',
        name: 'Purple Button',
        description: 'Purple button variant',
        isControl: false,
        allocation: 25,
        config: {
          buttonStyle: 'purple',
          showPrice: true,
          hoverEffect: 'scale'
        }
      }
    ],
    metrics: [
      {
        name: 'add_to_cart_conversion',
        type: 'conversion' as const,
        isPrimary: true,
        description: 'Add to cart conversion rate',
        target: 5 // 5% improvement target
      },
      {
        name: 'purchase_conversion',
        type: 'conversion' as const,
        isPrimary: false,
        description: 'Purchase conversion rate'
      }
    ],
    trafficAllocation: 50, // 50% of users
    hypothesis: 'Different button colors will improve conversion rates',
    creator: 'Product Team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: EXPERIMENTS.PRODUCT_CARD_LAYOUT,
    name: 'Product Card Layout Test',
    description: 'Testing different product card layouts for engagement',
    status: 'running' as const,
    startDate: '2024-01-01T00:00:00Z',
    targetAudience: [],
    variants: [
      {
        id: 'control',
        name: 'Control Layout',
        description: 'Default 4:3 aspect ratio with author',
        isControl: true,
        allocation: 33,
        config: {
          imageAspectRatio: '4/3',
          showAuthor: true,
          pricePosition: 'bottom-right',
          hoverEffect: 'scale'
        }
      },
      {
        id: 'square',
        name: 'Square Layout',
        description: 'Square images without author',
        isControl: false,
        allocation: 33,
        config: {
          imageAspectRatio: '1/1',
          showAuthor: false,
          pricePosition: 'bottom-only',
          hoverEffect: 'scale'
        }
      },
      {
        id: 'minimal',
        name: 'Minimal Layout',
        description: 'Minimal layout with bottom price only',
        isControl: false,
        allocation: 34,
        config: {
          imageAspectRatio: '4/3',
          showAuthor: false,
          pricePosition: 'bottom-only',
          hoverEffect: 'rotate'
        }
      }
    ],
    metrics: [
      {
        name: 'card_click_rate',
        type: 'engagement' as const,
        isPrimary: true,
        description: 'Product card click-through rate',
        target: 10 // 10% improvement target
      },
      {
        name: 'time_on_page',
        type: 'engagement' as const,
        isPrimary: false,
        description: 'Time spent on product listing pages'
      }
    ],
    trafficAllocation: 75, // 75% of users
    hypothesis: 'Simplified layouts will improve engagement and click-through rates',
    creator: 'UX Team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: EXPERIMENTS.PRICING_STRATEGY,
    name: 'Pricing Display Strategy',
    description: 'Testing different ways to display product pricing',
    status: 'running' as const,
    startDate: '2024-01-01T00:00:00Z',
    targetAudience: [
      {
        type: 'user_type' as const,
        operator: 'equals' as const,
        value: 'registered'
      }
    ],
    variants: [
      {
        id: 'control',
        name: 'Standard Pricing',
        description: 'Show regular and sale price',
        isControl: true,
        allocation: 50,
        config: {
          showOriginalPrice: true,
          emphasizeSavings: false,
          currencySymbol: '$'
        }
      },
      {
        id: 'savings',
        name: 'Emphasize Savings',
        description: 'Highlight savings amount and percentage',
        isControl: false,
        allocation: 50,
        config: {
          showOriginalPrice: true,
          emphasizeSavings: true,
          currencySymbol: '$',
          showSavingsPercent: true
        }
      }
    ],
    metrics: [
      {
        name: 'purchase_rate',
        type: 'conversion' as const,
        isPrimary: true,
        description: 'Purchase conversion rate'
      }
    ],
    trafficAllocation: 25, // 25% of users (registered only)
    hypothesis: 'Emphasizing savings will increase purchase conversion rates',
    creator: 'Growth Team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: EXPERIMENTS.HOMEPAGE_HEADLINE,
    name: 'Homepage Headline Test',
    description: 'Testing different homepage headline messages',
    status: 'running' as const,
    startDate: '2024-01-01T00:00:00Z',
    targetAudience: [],
    variants: [
      {
        id: 'control',
        name: 'Current Headline',
        description: 'Curated design resources',
        isControl: true,
        allocation: 50,
        config: {
          headline: '11,529 curated design resources to speed up your creative workflow.',
          subheadline: 'Join a growing family of 951,093 designers and makers from around the world.'
        }
      },
      {
        id: 'benefit',
        name: 'Benefit-Focused',
        description: 'Focus on time-saving benefits',
        isControl: false,
        allocation: 50,
        config: {
          headline: 'Save 10+ hours per project with our premium design resources.',
          subheadline: 'Join 951,093+ professionals who ship faster with Godot Tekko.'
        }
      }
    ],
    metrics: [
      {
        name: 'signup_rate',
        type: 'conversion' as const,
        isPrimary: true,
        description: 'Sign-up conversion rate from homepage'
      },
      {
        name: 'browse_rate',
        type: 'engagement' as const,
        isPrimary: false,
        description: 'Browse products click rate'
      }
    ],
    trafficAllocation: 100, // All users
    hypothesis: 'Benefit-focused messaging will improve sign-up rates',
    creator: 'Marketing Team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    // Filter only running experiments
    const runningExperiments = activeExperiments.filter(
      experiment => experiment.status === 'running'
    )

    // Add current timestamp for cache invalidation
    const response = {
      experiments: runningExperiments,
      timestamp: new Date().toISOString(),
      count: runningExperiments.length
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5 minutes
        'X-Experiments-Count': runningExperiments.length.toString()
      }
    })

  } catch (error) {
    console.error('Error fetching active experiments:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch active experiments',
        experiments: [],
        timestamp: new Date().toISOString(),
        count: 0
      },
      { status: 500 }
    )
  }
}

// Update experiment status (for admin use)
export async function PATCH(request: NextRequest) {
  try {
    const { experimentId, status } = await request.json()

    if (!experimentId || !status) {
      return NextResponse.json(
        { error: 'Missing experimentId or status' },
        { status: 400 }
      )
    }

    // Find and update experiment
    const experimentIndex = activeExperiments.findIndex(
      exp => exp.id === experimentId
    )

    if (experimentIndex === -1) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      )
    }

    // Update experiment status
    activeExperiments[experimentIndex].status = status
    activeExperiments[experimentIndex].updatedAt = new Date().toISOString()

    // If pausing or completing, set end date
    if (status === 'paused' || status === 'completed') {
      activeExperiments[experimentIndex].endDate = new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      experiment: activeExperiments[experimentIndex]
    })

  } catch (error) {
    console.error('Error updating experiment:', error)

    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    )
  }
}
