import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, isAdmin } from '@/lib/auth'
import { client } from '@/lib/sanity'
import { validatePlatformConfig, getConfigurationStatus, PLATFORM_CONFIG } from '@/config/platform'
import { checkSanityConnection } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !isAdmin(session.user.role as string)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Run comprehensive health checks
    const healthReport = await generateHealthReport()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      healthReport
    })

  } catch (error) {
    console.error('Error generating health report:', error)
    return NextResponse.json(
      { error: 'Failed to generate health report' },
      { status: 500 }
    )
  }
}

async function generateHealthReport() {
  const report = {
    overall: 'healthy' as 'healthy' | 'warning' | 'critical',
    issues: [] as string[],
    warnings: [] as string[],
    sections: {
      configuration: await checkConfiguration(),
      database: await checkDatabase(),
      userJourneys: await checkUserJourneys(),
      partnerJourneys: await checkPartnerJourneys(),
      adminSystems: await checkAdminSystems(),
      security: await checkSecurity(),
      performance: await checkPerformance()
    }
  }

  // Determine overall health
  const allSections = Object.values(report.sections)
  const hasErrors = allSections.some(section => section.status === 'error')
  const hasWarnings = allSections.some(section => section.status === 'warning')

  if (hasErrors) {
    report.overall = 'critical'
  } else if (hasWarnings) {
    report.overall = 'warning'
  }

  // Collect all issues and warnings
  allSections.forEach(section => {
    report.issues.push(...section.issues)
    report.warnings.push(...section.warnings)
  })

  return report
}

async function checkConfiguration() {
  const issues: string[] = []
  const warnings: string[] = []

  // Validate platform configuration
  const configValidation = validatePlatformConfig()
  if (!configValidation.isValid) {
    issues.push(...configValidation.errors)
  }

  // Check for development settings in production
  if (process.env.NODE_ENV === 'production') {
    if (PLATFORM_CONFIG.development.enableDemoMode) {
      warnings.push('Demo mode is enabled in production')
    }
    if (PLATFORM_CONFIG.development.autoApprovePartners) {
      issues.push('Auto-approve partners is enabled in production')
    }
    if (PLATFORM_CONFIG.development.bypassPayments) {
      issues.push('Payment bypass is enabled in production')
    }
    if (PLATFORM_CONFIG.development.mockEmailService) {
      warnings.push('Mock email service is enabled in production')
    }
  }

  // Check required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'NEXTAUTH_SECRET',
    'RESEND_API_KEY'
  ]

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      issues.push(`Missing required environment variable: ${envVar}`)
    }
  })

  // Check commission rate reasonableness
  if (PLATFORM_CONFIG.partner.commissionRate < 50 || PLATFORM_CONFIG.partner.commissionRate > 90) {
    warnings.push(`Partner commission rate (${PLATFORM_CONFIG.partner.commissionRate}%) seems unusual`)
  }

  // Check auto-approval threshold
  if (PLATFORM_CONFIG.partner.autoApprovalThreshold > 90) {
    warnings.push(`Auto-approval threshold (${PLATFORM_CONFIG.partner.autoApprovalThreshold}) is very high`)
  }

  return {
    status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy',
    issues,
    warnings,
    details: getConfigurationStatus()
  }
}

async function checkDatabase() {
  const issues: string[] = []
  const warnings: string[] = []

  try {
    // Test Sanity connection
    const sanityHealth = await checkSanityConnection()
    if (sanityHealth.status !== 'connected') {
      issues.push(`Sanity connection failed: ${sanityHealth.error}`)
    }

    // Check for required document types
    const requiredTypes = ['user', 'product', 'category', 'order', 'partnerApplication', 'userOnboarding']

    for (const type of requiredTypes) {
      try {
        const count = await client.fetch(`count(*[_type == "${type}"])`)
        if (type === 'user' && count === 0) {
          warnings.push('No users found in database')
        }
        if (type === 'product' && count === 0) {
          warnings.push('No products found in database')
        }
      } catch (error) {
        issues.push(`Cannot access ${type} documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Check for data consistency
    const userCount = await client.fetch(`count(*[_type == "user"])`)
    const partnerCount = await client.fetch(`count(*[_type == "user" && role == "partner"])`)
    const adminCount = await client.fetch(`count(*[_type == "user" && role == "admin"])`)

    if (adminCount === 0) {
      warnings.push('No admin users found')
    }

    if (userCount > 0 && partnerCount === 0) {
      warnings.push('No partner users found despite having users')
    }

  } catch (error) {
    issues.push(`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy',
    issues,
    warnings,
    details: {
      connectionStatus: 'checked',
      requiredTypesChecked: true
    }
  }
}

async function checkUserJourneys() {
  const issues: string[] = []
  const warnings: string[] = []

  try {
    // Check user onboarding completion rates
    const totalUsers = await client.fetch(`count(*[_type == "user"])`)
    const onboardedUsers = await client.fetch(`count(*[_type == "userOnboarding"])`)

    if (totalUsers > 10 && onboardedUsers / totalUsers < 0.5) {
      warnings.push(`Low onboarding completion rate: ${Math.round((onboardedUsers / totalUsers) * 100)}%`)
    }

    // Check for users with incomplete profiles
    const usersWithoutBio = await client.fetch(`count(*[_type == "user" && !defined(bio)])`)
    if (usersWithoutBio / totalUsers > 0.8) {
      warnings.push('Most users have incomplete profiles')
    }

    // Check for authentication issues
    const recentSignups = await client.fetch(`count(*[_type == "user" && _createdAt > dateTime(now()) - 60*60*24*7])`)
    if (recentSignups === 0 && totalUsers < 5) {
      warnings.push('Very low user engagement - no recent signups')
    }

  } catch (error) {
    issues.push(`User journey check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy',
    issues,
    warnings,
    details: {
      onboardingAnalyzed: true,
      profileCompletenessChecked: true
    }
  }
}

async function checkPartnerJourneys() {
  const issues: string[] = []
  const warnings: string[] = []

  try {
    // Check partner application flow
    const totalApplications = await client.fetch(`count(*[_type == "partnerApplication"])`)
    const pendingApplications = await client.fetch(`count(*[_type == "partnerApplication" && status == "pending"])`)
    const approvedApplications = await client.fetch(`count(*[_type == "partnerApplication" && status == "approved"])`)

    if (pendingApplications > 10) {
      warnings.push(`${pendingApplications} partner applications are pending review`)
    }

    if (totalApplications > 0 && approvedApplications / totalApplications < 0.3) {
      warnings.push(`Low partner approval rate: ${Math.round((approvedApplications / totalApplications) * 100)}%`)
    }

    // Check auto-approval functioning
    const autoApprovedCount = await client.fetch(`count(*[_type == "partnerApplication" && autoApproved == true])`)
    if (PLATFORM_CONFIG.development.autoApprovePartners && autoApprovedCount === 0 && totalApplications > 0) {
      warnings.push('Auto-approval is enabled but no applications were auto-approved')
    }

    // Check for partners without products
    const partnersWithoutProducts = await client.fetch(`
      count(*[_type == "user" && role == "partner" &&
               count(*[_type == "product" && author._ref == ^._id]) == 0])
    `)

    const totalPartners = await client.fetch(`count(*[_type == "user" && role == "partner"])`)
    if (totalPartners > 0 && partnersWithoutProducts / totalPartners > 0.7) {
      warnings.push('Most partners have not uploaded any products')
    }

  } catch (error) {
    issues.push(`Partner journey check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy',
    issues,
    warnings,
    details: {
      applicationFlowChecked: true,
      productUploadAnalyzed: true
    }
  }
}

async function checkAdminSystems() {
  const issues: string[] = []
  const warnings: string[] = []

  try {
    // Check admin user count
    const adminCount = await client.fetch(`count(*[_type == "user" && role == "admin"])`)
    if (adminCount === 0) {
      issues.push('No admin users found - cannot manage the platform')
    } else if (adminCount === 1) {
      warnings.push('Only one admin user - consider adding backup admins')
    }

    // Check for unreviewed partner applications
    const oldPendingApplications = await client.fetch(`
      count(*[_type == "partnerApplication" && status == "pending" &&
               submittedAt < dateTime(now()) - 60*60*48])
    `)

    if (oldPendingApplications > 0) {
      warnings.push(`${oldPendingApplications} partner applications are overdue for review (>48h)`)
    }

    // Check system health monitoring
    const recentErrors = [] // Would integrate with logging system
    if (recentErrors.length > 0) {
      warnings.push(`${recentErrors.length} recent system errors detected`)
    }

  } catch (error) {
    issues.push(`Admin system check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy',
    issues,
    warnings,
    details: {
      adminAccessChecked: true,
      reviewBacklogAnalyzed: true
    }
  }
}

async function checkSecurity() {
  const issues: string[] = []
  const warnings: string[] = []

  // Check authentication configuration
  if (!process.env.NEXTAUTH_SECRET) {
    issues.push('NEXTAUTH_SECRET is not configured')
  }

  // Check for weak configuration in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXTAUTH_SECRET === 'development-secret') {
      issues.push('Using development secret in production')
    }

    // Check email verification requirements
    if (!PLATFORM_CONFIG.security.requireEmailVerification) {
      warnings.push('Email verification is disabled in production')
    }

    // Check session timeout
    if (PLATFORM_CONFIG.security.sessionTimeout > 24 * 60 * 60) {
      warnings.push('Session timeout is longer than 24 hours')
    }
  }

  // Check for default admin credentials (would need to implement)

  return {
    status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy',
    issues,
    warnings,
    details: {
      authenticationChecked: true,
      productionSecurityChecked: process.env.NODE_ENV === 'production'
    }
  }
}

async function checkPerformance() {
  const issues: string[] = []
  const warnings: string[] = []

  try {
    // Check database query performance (basic)
    const start = Date.now()
    await client.fetch(`*[_type == "product"][0...5]`)
    const queryTime = Date.now() - start

    if (queryTime > 2000) {
      warnings.push(`Slow database queries detected (${queryTime}ms)`)
    }

    // Check for large datasets that might need pagination
    const productCount = await client.fetch(`count(*[_type == "product"])`)
    if (productCount > 1000) {
      warnings.push(`Large product dataset (${productCount}) - ensure pagination is implemented`)
    }

    const userCount = await client.fetch(`count(*[_type == "user"])`)
    if (userCount > 10000) {
      warnings.push(`Large user dataset (${userCount}) - consider archiving inactive users`)
    }

  } catch (error) {
    issues.push(`Performance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy',
    issues,
    warnings,
    details: {
      queryPerformanceChecked: true,
      datasetSizeAnalyzed: true
    }
  }
}
