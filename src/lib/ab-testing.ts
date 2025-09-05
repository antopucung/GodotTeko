// A/B Testing Framework for Godot Tekko
// Comprehensive experimentation system for conversion optimization

interface Experiment {
  id: string
  name: string
  description: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  startDate: string
  endDate?: string
  targetAudience: AudienceRule[]
  variants: Variant[]
  metrics: ExperimentMetric[]
  trafficAllocation: number // Percentage of users to include (0-100)
  hypothesis: string
  creator: string
  createdAt: string
  updatedAt: string
}

interface Variant {
  id: string
  name: string
  description: string
  isControl: boolean
  allocation: number // Percentage of experiment traffic (0-100)
  config: VariantConfig
}

interface VariantConfig {
  [key: string]: any
  // Examples:
  // buttonColor?: string
  // buttonText?: string
  // price?: number
  // layoutType?: string
  // ctaPosition?: string
}

interface AudienceRule {
  type: 'user_type' | 'location' | 'device' | 'utm_source' | 'custom'
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in'
  value: string | string[]
}

interface ExperimentMetric {
  name: string
  type: 'conversion' | 'revenue' | 'engagement' | 'custom'
  isPrimary: boolean
  description: string
  target?: number // Target improvement percentage
}

interface ExperimentAssignment {
  userId: string
  sessionId: string
  experimentId: string
  variantId: string
  timestamp: number
  sticky: boolean // Should user always see same variant
}

interface ExperimentResult {
  experimentId: string
  variantId: string
  userId?: string
  sessionId: string
  metricName: string
  value: number
  timestamp: number
  properties?: Record<string, any>
}

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

class ABTestingFramework {
  private static instance: ABTestingFramework
  private experiments: Map<string, Experiment> = new Map()
  private assignments: Map<string, ExperimentAssignment[]> = new Map()
  private results: ExperimentResult[] = []
  private userId: string | null = null
  private sessionId: string
  private isInitialized = false

  private constructor() {
    this.sessionId = this.generateSessionId()
  }

  static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework()
    }
    return ABTestingFramework.instance
  }

  // Initialize the A/B testing framework
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return

    this.userId = userId || null
    await this.loadExperiments()
    await this.loadAssignments()
    this.isInitialized = true
  }

  // Load active experiments from API
  private async loadExperiments(): Promise<void> {
    try {
      const response = await fetch('/api/experiments/active')
      const experiments: Experiment[] = await response.json()

      experiments.forEach(experiment => {
        this.experiments.set(experiment.id, experiment)
      })
    } catch (error) {
      console.warn('Failed to load experiments:', error)
    }
  }

  // Load user assignments
  private async loadAssignments(): Promise<void> {
    if (!this.userId) return

    try {
      const response = await fetch(`/api/experiments/assignments/${this.userId}`)
      const assignments: ExperimentAssignment[] = await response.json()

      assignments.forEach(assignment => {
        const userAssignments = this.assignments.get(assignment.userId) || []
        userAssignments.push(assignment)
        this.assignments.set(assignment.userId, userAssignments)
      })
    } catch (error) {
      console.warn('Failed to load assignments:', error)
    }
  }

  // Get variant for an experiment
  async getVariant(experimentId: string, forceVariant?: string): Promise<Variant | null> {
    const experiment = this.experiments.get(experimentId)
    if (!experiment || experiment.status !== 'running') {
      return null
    }

    // Check if user should be included in experiment
    if (!this.shouldIncludeUser(experiment)) {
      return null
    }

    // Force specific variant (for testing/debugging)
    if (forceVariant) {
      const variant = experiment.variants.find(v => v.id === forceVariant)
      if (variant) {
        await this.recordAssignment(experiment, variant)
        return variant
      }
    }

    // Check existing assignment
    const existingAssignment = this.getExistingAssignment(experimentId)
    if (existingAssignment) {
      const variant = experiment.variants.find(v => v.id === existingAssignment.variantId)
      return variant || null
    }

    // Assign new variant
    const variant = this.assignVariant(experiment)
    if (variant) {
      await this.recordAssignment(experiment, variant)
    }

    return variant
  }

  // Check if user should be included in experiment
  private shouldIncludeUser(experiment: Experiment): boolean {
    // Check traffic allocation
    const userHash = this.hashString(`${this.userId || this.sessionId}_${experiment.id}`)
    const userPercentile = userHash % 100
    if (userPercentile >= experiment.trafficAllocation) {
      return false
    }

    // Check audience rules
    return this.matchesAudienceRules(experiment.targetAudience)
  }

  // Check if user matches audience rules
  private matchesAudienceRules(rules: AudienceRule[]): boolean {
    if (rules.length === 0) return true

    return rules.every(rule => {
      switch (rule.type) {
        case 'user_type':
          return this.matchesUserType(rule)
        case 'location':
          return this.matchesLocation(rule)
        case 'device':
          return this.matchesDevice(rule)
        case 'utm_source':
          return this.matchesUtmSource(rule)
        case 'custom':
          return this.matchesCustomRule(rule)
        default:
          return true
      }
    })
  }

  private matchesUserType(rule: AudienceRule): boolean {
    const userType = this.userId ? 'registered' : 'anonymous'
    return this.evaluateRule(userType, rule)
  }

  private matchesLocation(rule: AudienceRule): boolean {
    // This would need to be implemented with geolocation or IP-based detection
    const location = this.getUserLocation()
    return this.evaluateRule(location, rule)
  }

  private matchesDevice(rule: AudienceRule): boolean {
    const device = this.getDeviceType()
    return this.evaluateRule(device, rule)
  }

  private matchesUtmSource(rule: AudienceRule): boolean {
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source') || ''
    return this.evaluateRule(utmSource, rule)
  }

  private matchesCustomRule(rule: AudienceRule): boolean {
    // Custom rule evaluation can be implemented based on your needs
    return true
  }

  private evaluateRule(value: string, rule: AudienceRule): boolean {
    switch (rule.operator) {
      case 'equals':
        return value === rule.value
      case 'not_equals':
        return value !== rule.value
      case 'contains':
        return value.includes(rule.value as string)
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(value)
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(value)
      default:
        return false
    }
  }

  // Assign variant based on allocation
  private assignVariant(experiment: Experiment): Variant | null {
    const random = Math.random() * 100
    let cumulativeAllocation = 0

    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation
      if (random <= cumulativeAllocation) {
        return variant
      }
    }

    return null
  }

  // Get existing assignment
  private getExistingAssignment(experimentId: string): ExperimentAssignment | null {
    const userId = this.userId || this.sessionId
    const userAssignments = this.assignments.get(userId) || []
    return userAssignments.find(a => a.experimentId === experimentId) || null
  }

  // Record assignment
  private async recordAssignment(experiment: Experiment, variant: Variant): Promise<void> {
    const assignment: ExperimentAssignment = {
      userId: this.userId || '',
      sessionId: this.sessionId,
      experimentId: experiment.id,
      variantId: variant.id,
      timestamp: Date.now(),
      sticky: true
    }

    // Store locally
    const userId = this.userId || this.sessionId
    const userAssignments = this.assignments.get(userId) || []
    userAssignments.push(assignment)
    this.assignments.set(userId, userAssignments)

    // Send to server
    try {
      await fetch('/api/experiments/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment)
      })
    } catch (error) {
      console.warn('Failed to record assignment:', error)
    }
  }

  // Track conversion event
  async trackConversion(experimentId: string, eventType: string, eventValue?: number, properties?: Record<string, any>): Promise<void> {
    const assignment = this.getExistingAssignment(experimentId)
    if (!assignment) return

    const conversion: ConversionEvent = {
      experimentId,
      variantId: assignment.variantId,
      userId: this.userId,
      sessionId: this.sessionId,
      eventType,
      eventValue,
      timestamp: Date.now(),
      properties
    }

    try {
      await fetch('/api/experiments/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversion)
      })
    } catch (error) {
      console.warn('Failed to track conversion:', error)
    }
  }

  // Track metric
  async trackMetric(experimentId: string, metricName: string, value: number, properties?: Record<string, any>): Promise<void> {
    const assignment = this.getExistingAssignment(experimentId)
    if (!assignment) return

    const result: ExperimentResult = {
      experimentId,
      variantId: assignment.variantId,
      userId: this.userId,
      sessionId: this.sessionId,
      metricName,
      value,
      timestamp: Date.now(),
      properties
    }

    this.results.push(result)

    try {
      await fetch('/api/experiments/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      })
    } catch (error) {
      console.warn('Failed to track metric:', error)
    }
  }

  // Get all active experiments for current user
  getActiveExperiments(): string[] {
    const userId = this.userId || this.sessionId
    const userAssignments = this.assignments.get(userId) || []
    return userAssignments.map(a => a.experimentId)
  }

  // Get variant config for experiment
  getVariantConfig(experimentId: string): VariantConfig | null {
    const assignment = this.getExistingAssignment(experimentId)
    if (!assignment) return null

    const experiment = this.experiments.get(experimentId)
    if (!experiment) return null

    const variant = experiment.variants.find(v => v.id === assignment.variantId)
    return variant?.config || null
  }

  // Set user identity
  setUser(userId: string): void {
    this.userId = userId
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private getUserLocation(): string {
    // Implement geolocation detection
    return 'unknown'
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown'

    const userAgent = navigator.userAgent.toLowerCase()
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      return 'mobile'
    }
    return 'desktop'
  }
}

// Export singleton instance
export const abTesting = ABTestingFramework.getInstance()

// React hook for A/B testing
export const useABTest = (experimentId: string, defaultConfig: VariantConfig = {}) => {
  const [variant, setVariant] = React.useState<Variant | null>(null)
  const [config, setConfig] = React.useState<VariantConfig>(defaultConfig)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadVariant = async () => {
      try {
        const assignedVariant = await abTesting.getVariant(experimentId)
        setVariant(assignedVariant)
        setConfig(assignedVariant?.config || defaultConfig)
      } catch (error) {
        console.warn('Failed to load A/B test variant:', error)
        setConfig(defaultConfig)
      } finally {
        setIsLoading(false)
      }
    }

    loadVariant()
  }, [experimentId, defaultConfig])

  const trackConversion = async (eventType: string, eventValue?: number, properties?: Record<string, any>) => {
    return abTesting.trackConversion(experimentId, eventType, eventValue, properties)
  }

  const trackMetric = async (metricName: string, value: number, properties?: Record<string, any>) => {
    return abTesting.trackMetric(experimentId, metricName, value, properties)
  }

  return {
    variant,
    config,
    isLoading,
    trackConversion,
    trackMetric,
    isControl: variant?.isControl || false,
    variantName: variant?.name || 'control'
  }
}

// Predefined experiment configurations
export const EXPERIMENTS = {
  // Pricing experiments
  PRICING_STRATEGY: 'pricing_strategy_2024',
  SUBSCRIPTION_PRICING: 'subscription_pricing_v2',

  // UI/UX experiments
  CTA_BUTTON_COLOR: 'cta_button_color_test',
  HERO_LAYOUT: 'hero_layout_optimization',
  NAVIGATION_STYLE: 'navigation_style_test',
  PRODUCT_CARD_LAYOUT: 'product_card_layout',

  // Conversion experiments
  CHECKOUT_FLOW: 'checkout_flow_optimization',
  ONBOARDING_FLOW: 'user_onboarding_v3',
  EMAIL_SIGNUP: 'email_signup_modal',

  // Content experiments
  HOMEPAGE_HEADLINE: 'homepage_headline_test',
  PRODUCT_DESCRIPTIONS: 'product_description_length',

  // Feature experiments
  SEARCH_SUGGESTIONS: 'search_suggestions_algorithm',
  RECOMMENDATION_ENGINE: 'recommendation_engine_v2'
} as const

// Export types
export type {
  Experiment,
  Variant,
  VariantConfig,
  AudienceRule,
  ExperimentMetric,
  ExperimentAssignment,
  ExperimentResult,
  ConversionEvent
}

// Import React for the hook (this would need to be properly imported in a real file)
declare const React: any
