// Platform Configuration - Centralized settings to replace hardcoded values
export const PLATFORM_CONFIG = {
  // Commission and Revenue Settings
  partner: {
    commissionRate: parseInt(process.env.PARTNER_COMMISSION_RATE || '70'), // 70%
    platformFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE || '0.15'), // 15%
    processingFeeRate: parseFloat(process.env.PROCESSING_FEE_RATE || '0.029'), // 2.9%
    minimumPayout: parseInt(process.env.MINIMUM_PAYOUT || '50'), // $50
    autoApprovalThreshold: parseInt(process.env.AUTO_APPROVAL_THRESHOLD || '80'), // Score >= 80
    reviewTimeframe: process.env.REVIEW_TIMEFRAME || '24-48 hours'
  },

  // Application Scoring Weights
  applicationScoring: {
    portfolio: {
      hasPortfolio: parseInt(process.env.PORTFOLIO_BASE_POINTS || '20'),
      premiumPlatform: parseInt(process.env.PORTFOLIO_PREMIUM_POINTS || '10') // Dribbble/Behance
    },
    experience: {
      expert: parseInt(process.env.EXPERT_POINTS || '25'),
      experienced: parseInt(process.env.EXPERIENCED_POINTS || '20'),
      intermediate: parseInt(process.env.INTERMEDIATE_POINTS || '15'),
      beginner: parseInt(process.env.BEGINNER_POINTS || '10')
    },
    specialties: {
      pointsPerSpecialty: parseInt(process.env.SPECIALTY_POINTS || '3'),
      maxPoints: parseInt(process.env.SPECIALTY_MAX_POINTS || '15')
    },
    tools: {
      pointsPerTool: parseInt(process.env.TOOL_POINTS || '2'),
      maxPoints: parseInt(process.env.TOOL_MAX_POINTS || '15')
    },
    business: {
      hasBusinessType: parseInt(process.env.BUSINESS_TYPE_POINTS || '5'),
      hasMarketingStrategy: parseInt(process.env.MARKETING_POINTS || '5')
    },
    quality: {
      qualityStandards: parseInt(process.env.QUALITY_STANDARDS_POINTS || '2'),
      originalWork: parseInt(process.env.ORIGINAL_WORK_POINTS || '3')
    },
    maxScore: parseInt(process.env.MAX_APPLICATION_SCORE || '100')
  },

  // Email Configuration
  email: {
    fromEmail: process.env.FROM_EMAIL || 'noreply@ui8marketplace.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@ui8marketplace.com',
    partnersEmail: process.env.PARTNERS_EMAIL || 'partners@ui8marketplace.com',
    noReplyEmail: process.env.NO_REPLY_EMAIL || 'noreply@ui8marketplace.com'
  },

  // Email Automation Configuration
  emailAutomation: {
    // Service Configuration
    service: {
      provider: process.env.EMAIL_PROVIDER || 'resend',
      apiKey: process.env.RESEND_API_KEY || '',
      trackingDomain: process.env.EMAIL_TRACKING_DOMAIN || process.env.NEXT_PUBLIC_APP_URL,
      enableTracking: process.env.EMAIL_TRACKING_ENABLED !== 'false',
      enablePersonalization: process.env.EMAIL_PERSONALIZATION_ENABLED !== 'false'
    },

    // Sending Limits and Throttling
    limits: {
      maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '1000'),
      maxEmailsPerDay: parseInt(process.env.MAX_EMAILS_PER_DAY || '10000'),
      maxEmailsPerUser: parseInt(process.env.MAX_EMAILS_PER_USER_PER_DAY || '5'),
      batchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '100'),
      batchDelayMs: parseInt(process.env.EMAIL_BATCH_DELAY_MS || '1000')
    },

    // Default Settings
    defaults: {
      fromName: process.env.DEFAULT_FROM_NAME || 'UI8 Marketplace',
      replyTo: process.env.DEFAULT_REPLY_TO || 'support@ui8marketplace.com',
      timeZone: process.env.DEFAULT_TIMEZONE || 'UTC',
      sendingWindow: {
        startHour: parseInt(process.env.DEFAULT_SEND_START_HOUR || '9'),
        endHour: parseInt(process.env.DEFAULT_SEND_END_HOUR || '17'),
        allowWeekends: process.env.ALLOW_WEEKEND_EMAILS === 'true'
      }
    },

    // Workflow Configuration
    workflows: {
      maxStepsPerWorkflow: parseInt(process.env.MAX_WORKFLOW_STEPS || '20'),
      maxActiveWorkflows: parseInt(process.env.MAX_ACTIVE_WORKFLOWS || '50'),
      defaultCooldownHours: parseInt(process.env.DEFAULT_WORKFLOW_COOLDOWN_HOURS || '24'),
      maxExecutionsPerUser: parseInt(process.env.MAX_WORKFLOW_EXECUTIONS_PER_USER || '5'),
      enableAbTesting: process.env.WORKFLOW_AB_TESTING_ENABLED !== 'false'
    },

    // Template Configuration
    templates: {
      maxTemplatesPerUser: parseInt(process.env.MAX_TEMPLATES_PER_USER || '50'),
      enableVersioning: process.env.TEMPLATE_VERSIONING_ENABLED !== 'false',
      defaultWidth: parseInt(process.env.DEFAULT_EMAIL_WIDTH || '600'),
      maxContentLength: parseInt(process.env.MAX_EMAIL_CONTENT_LENGTH || '100000'),
      allowedImageFormats: (process.env.ALLOWED_EMAIL_IMAGE_FORMATS || 'jpg,jpeg,png,gif,webp').split(',')
    },

    // Campaign Configuration
    campaigns: {
      maxCampaignsPerUser: parseInt(process.env.MAX_CAMPAIGNS_PER_USER || '20'),
      defaultTestDurationHours: parseInt(process.env.DEFAULT_AB_TEST_DURATION_HOURS || '24'),
      enableScheduling: process.env.CAMPAIGN_SCHEDULING_ENABLED !== 'false',
      maxScheduleDays: parseInt(process.env.MAX_CAMPAIGN_SCHEDULE_DAYS || '30')
    },

    // Newsletter Configuration
    newsletter: {
      defaultFrequency: process.env.DEFAULT_NEWSLETTER_FREQUENCY || 'weekly',
      maxSubscribers: parseInt(process.env.MAX_NEWSLETTER_SUBSCRIBERS || '100000'),
      enableSegmentation: process.env.NEWSLETTER_SEGMENTATION_ENABLED !== 'false',
      personalizedContent: process.env.NEWSLETTER_PERSONALIZATION_ENABLED !== 'false',
      contentSections: parseInt(process.env.MAX_NEWSLETTER_SECTIONS || '10')
    },

    // Abandoned Cart Configuration
    abandonedCart: {
      enabled: process.env.ABANDONED_CART_EMAILS_ENABLED !== 'false',
      triggerDelayMinutes: parseInt(process.env.ABANDONED_CART_TRIGGER_DELAY || '30'),
      maxSequenceEmails: parseInt(process.env.MAX_ABANDONED_CART_EMAILS || '3'),
      emailDelays: [
        parseInt(process.env.ABANDONED_CART_EMAIL_1_DELAY || '30'), // 30 minutes
        parseInt(process.env.ABANDONED_CART_EMAIL_2_DELAY || '1440'), // 24 hours
        parseInt(process.env.ABANDONED_CART_EMAIL_3_DELAY || '4320') // 72 hours
      ],
      discountCodes: {
        enabled: process.env.ABANDONED_CART_DISCOUNTS_ENABLED !== 'false',
        defaultDiscount: parseInt(process.env.DEFAULT_ABANDONED_CART_DISCOUNT || '10'),
        expiryHours: parseInt(process.env.ABANDONED_CART_DISCOUNT_EXPIRY_HOURS || '48')
      }
    },

    // Analytics Configuration
    analytics: {
      trackOpens: process.env.TRACK_EMAIL_OPENS !== 'false',
      trackClicks: process.env.TRACK_EMAIL_CLICKS !== 'false',
      trackConversions: process.env.TRACK_EMAIL_CONVERSIONS !== 'false',
      attributionWindowHours: parseInt(process.env.EMAIL_ATTRIBUTION_WINDOW_HOURS || '168'), // 7 days
      enableHeatmaps: process.env.EMAIL_HEATMAPS_ENABLED === 'true',
      enableGeolocation: process.env.EMAIL_GEOLOCATION_ENABLED !== 'false'
    },

    // Suppression and Compliance
    suppression: {
      enableGlobalSuppression: process.env.GLOBAL_SUPPRESSION_ENABLED !== 'false',
      autoSuppressHardBounces: process.env.AUTO_SUPPRESS_HARD_BOUNCES !== 'false',
      autoSuppressSpamComplaints: process.env.AUTO_SUPPRESS_SPAM_COMPLAINTS !== 'false',
      maxConsecutiveBounces: parseInt(process.env.MAX_CONSECUTIVE_BOUNCES || '3'),
      suppressionCooldownDays: parseInt(process.env.SUPPRESSION_COOLDOWN_DAYS || '30')
    },

    // GDPR and Privacy
    privacy: {
      enableDoubleOptIn: process.env.DOUBLE_OPT_IN_ENABLED === 'true',
      enableConsentTracking: process.env.CONSENT_TRACKING_ENABLED !== 'false',
      dataRetentionDays: parseInt(process.env.EMAIL_DATA_RETENTION_DAYS || '365'),
      enableRightToErasure: process.env.RIGHT_TO_ERASURE_ENABLED !== 'false',
      cookieConsent: process.env.EMAIL_COOKIE_CONSENT_REQUIRED === 'true'
    },

    // Performance and Monitoring
    performance: {
      enableCaching: process.env.EMAIL_CACHING_ENABLED !== 'false',
      cacheTtlMinutes: parseInt(process.env.EMAIL_CACHE_TTL_MINUTES || '60'),
      enableQueueMonitoring: process.env.EMAIL_QUEUE_MONITORING_ENABLED !== 'false',
      alertThresholds: {
        bounceRate: parseFloat(process.env.ALERT_BOUNCE_RATE_THRESHOLD || '0.05'), // 5%
        spamRate: parseFloat(process.env.ALERT_SPAM_RATE_THRESHOLD || '0.01'), // 1%
        failureRate: parseFloat(process.env.ALERT_FAILURE_RATE_THRESHOLD || '0.02') // 2%
      }
    }
  },

  // User Onboarding
  onboarding: {
    newUserTimeframe: parseInt(process.env.NEW_USER_HOURS || '24'), // 24 hours
    completionTracking: process.env.ONBOARDING_TRACKING || 'localStorage',
    personalizeRecommendations: process.env.PERSONALIZE_RECOMMENDATIONS !== 'false'
  },

  // Transaction Data Generation (for development)
  dataGeneration: {
    orders: {
      defaultCount: parseInt(process.env.DEMO_ORDERS_COUNT || '150'),
      avgItemsPerOrder: parseFloat(process.env.AVG_ITEMS_PER_ORDER || '2.3'),
      successRate: parseFloat(process.env.TRANSACTION_SUCCESS_RATE || '0.94'),
      refundRate: parseFloat(process.env.REFUND_RATE || '0.05')
    },
    geography: [
      { country: 'United States', weight: 0.35, currency: 'USD' },
      { country: 'United Kingdom', weight: 0.15, currency: 'GBP' },
      { country: 'Germany', weight: 0.12, currency: 'EUR' },
      { country: 'Canada', weight: 0.10, currency: 'CAD' },
      { country: 'Australia', weight: 0.08, currency: 'AUD' },
      { country: 'France', weight: 0.07, currency: 'EUR' },
      { country: 'Netherlands', weight: 0.05, currency: 'EUR' },
      { country: 'Sweden', weight: 0.04, currency: 'SEK' },
      { country: 'Japan', weight: 0.04, currency: 'JPY' }
    ],
    paymentMethods: [
      { method: 'card', weight: 0.78, brands: ['visa', 'mastercard', 'amex'] },
      { method: 'paypal', weight: 0.15 },
      { method: 'apple_pay', weight: 0.04 },
      { method: 'google_pay', weight: 0.03 }
    ]
  },

  // File Upload and Storage
  storage: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '500') * 1024 * 1024, // 500MB default
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'zip,pdf,ai,psd,sketch,xd,fig,png,jpg,jpeg,svg,gif,mp4,mov,avi').split(','),
    downloadTokenExpiry: parseInt(process.env.DOWNLOAD_TOKEN_EXPIRY || '3600'), // 1 hour
    maxDownloadsPerToken: parseInt(process.env.MAX_DOWNLOADS_PER_TOKEN || '10'),
    // AWS S3 Configuration
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'ui8-marketplace-files',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      endpoint: process.env.AWS_ENDPOINT, // For S3-compatible services
      forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === 'true',
      cdnDomain: process.env.AWS_CDN_DOMAIN // CloudFront or similar CDN
    },
    // Upload settings
    upload: {
      tempFileExpiry: parseInt(process.env.TEMP_FILE_EXPIRY_HOURS || '24'), // 24 hours
      chunkSizeLimit: parseInt(process.env.UPLOAD_CHUNK_SIZE || '10') * 1024 * 1024, // 10MB chunks
      presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY || '3600'), // 1 hour
      virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === 'true',
      compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false'
    },
    // Download settings
    download: {
      tokenSecret: process.env.DOWNLOAD_TOKEN_SECRET || 'change-me-in-production',
      maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '3'),
      speedLimitMBps: parseInt(process.env.DOWNLOAD_SPEED_LIMIT || '50'), // 50 MB/s
      ipValidation: process.env.DOWNLOAD_IP_VALIDATION !== 'false',
      userAgentValidation: process.env.DOWNLOAD_UA_VALIDATION !== 'false',
      geoRestrictions: process.env.DOWNLOAD_GEO_RESTRICTIONS?.split(',') || []
    }
  },

  // UI and Display Settings
  ui: {
    itemsPerPage: parseInt(process.env.ITEMS_PER_PAGE || '20'),
    recentProductsCount: parseInt(process.env.RECENT_PRODUCTS_COUNT || '4'),
    featuredProductsCount: parseInt(process.env.FEATURED_PRODUCTS_COUNT || '8'),
    searchResultsLimit: parseInt(process.env.SEARCH_RESULTS_LIMIT || '50')
  },

  // Security Settings
  security: {
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400'), // 24 hours
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false'
  },

  // Business Rules
  business: {
    freeDownloadLimit: parseInt(process.env.FREE_DOWNLOAD_LIMIT || '3'),
    accessPassPrice: parseInt(process.env.ACCESS_PASS_PRICE || '199'),
    accessPassDuration: parseInt(process.env.ACCESS_PASS_DURATION || '365'), // days
    partnerPayoutSchedule: process.env.PAYOUT_SCHEDULE || 'monthly',
    minProductPrice: parseFloat(process.env.MIN_PRODUCT_PRICE || '5.00'),
    maxProductPrice: parseFloat(process.env.MAX_PRODUCT_PRICE || '999.00')
  },

  // Development and Demo Settings
  development: {
    enableDemoMode: process.env.DEMO_MODE === 'true',
    autoApprovePartners: process.env.NODE_ENV === 'development' || process.env.AUTO_APPROVE_PARTNERS === 'true',
    bypassPayments: process.env.BYPASS_PAYMENTS === 'true',
    mockEmailService: process.env.MOCK_EMAIL_SERVICE === 'true'
  }
}

// Type-safe getters for configuration values
export const getPartnerCommissionRate = () => PLATFORM_CONFIG.partner.commissionRate
export const getPlatformFeeRate = () => PLATFORM_CONFIG.partner.platformFeeRate
export const getAutoApprovalThreshold = () => PLATFORM_CONFIG.partner.autoApprovalThreshold
export const getEmailAddresses = () => PLATFORM_CONFIG.email
export const getApplicationScoring = () => PLATFORM_CONFIG.applicationScoring
export const getEmailAutomationConfig = () => PLATFORM_CONFIG.emailAutomation

// Validation function to ensure all required config is present
export function validatePlatformConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required numeric values
  if (PLATFORM_CONFIG.partner.commissionRate < 1 || PLATFORM_CONFIG.partner.commissionRate > 100) {
    errors.push('Partner commission rate must be between 1-100')
  }

  if (PLATFORM_CONFIG.partner.autoApprovalThreshold < 0 || PLATFORM_CONFIG.partner.autoApprovalThreshold > 100) {
    errors.push('Auto-approval threshold must be between 0-100')
  }

  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(PLATFORM_CONFIG.email.fromEmail)) {
    errors.push('Invalid FROM_EMAIL format')
  }

  if (!emailRegex.test(PLATFORM_CONFIG.email.supportEmail)) {
    errors.push('Invalid SUPPORT_EMAIL format')
  }

  // Check email automation config
  if (PLATFORM_CONFIG.emailAutomation.limits.maxEmailsPerHour < 1) {
    errors.push('Max emails per hour must be at least 1')
  }

  if (PLATFORM_CONFIG.emailAutomation.limits.maxEmailsPerDay < 1) {
    errors.push('Max emails per day must be at least 1')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Environment-aware configuration display (for admin panel)
export function getConfigurationStatus() {
  const validation = validatePlatformConfig()

  return {
    environment: process.env.NODE_ENV || 'development',
    isValid: validation.isValid,
    errors: validation.errors,
    isDemoMode: PLATFORM_CONFIG.development.enableDemoMode,
    autoApprovalEnabled: PLATFORM_CONFIG.development.autoApprovePartners,
    commissionRate: PLATFORM_CONFIG.partner.commissionRate,
    autoApprovalThreshold: PLATFORM_CONFIG.partner.autoApprovalThreshold,
    emailConfiguration: {
      fromEmail: PLATFORM_CONFIG.email.fromEmail,
      supportEmail: PLATFORM_CONFIG.email.supportEmail,
      isMockMode: PLATFORM_CONFIG.development.mockEmailService
    },
    emailAutomation: {
      enabled: PLATFORM_CONFIG.emailAutomation.service.enableTracking,
      provider: PLATFORM_CONFIG.emailAutomation.service.provider,
      maxEmailsPerDay: PLATFORM_CONFIG.emailAutomation.limits.maxEmailsPerDay,
      trackingEnabled: PLATFORM_CONFIG.emailAutomation.analytics.trackOpens
    }
  }
}
