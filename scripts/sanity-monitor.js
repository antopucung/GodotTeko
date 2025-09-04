#!/usr/bin/env node

/**
 * Enhanced Sanity Monitor - Continuous Health Monitoring
 * Provides detailed monitoring, alerts, and performance tracking
 */

import { config } from 'dotenv'
import { createClient } from '@sanity/client'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
config({ path: '.env.local' })

// Configuration
const MONITOR_CONFIG = {
  interval: 30000, // 30 seconds
  alertThresholds: {
    responseTime: 1000, // 1 second
    criticalResponseTime: 2000, // 2 seconds
    errorRate: 0.1 // 10%
  },
  historyFile: 'sanity-health-history.json',
  maxHistoryEntries: 100
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
  dim: '\x1b[2m'
}

// Helper functions
const log = (message, color = colors.reset) => console.log(`${color}${message}${colors.reset}`)
const success = (message) => log(`✅ ${message}`, colors.green)
const error = (message) => log(`❌ ${message}`, colors.red)
const warning = (message) => log(`⚠️  ${message}`, colors.yellow)
const info = (message) => log(`ℹ️  ${message}`, colors.blue)
const debug = (message) => log(`🔧 ${message}`, colors.dim)
const header = (message) => log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`)

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN
})

// Health check state
let healthHistory = []
let isMonitoring = false
let monitoringInterval = null

// Load existing history
function loadHistory() {
  try {
    if (existsSync(MONITOR_CONFIG.historyFile)) {
      const data = readFileSync(MONITOR_CONFIG.historyFile, 'utf8')
      healthHistory = JSON.parse(data)
      debug(`Loaded ${healthHistory.length} historical health records`)
    }
  } catch (err) {
    warning(`Could not load health history: ${err.message}`)
    healthHistory = []
  }
}

// Save history to file
function saveHistory() {
  try {
    // Keep only the last N entries
    if (healthHistory.length > MONITOR_CONFIG.maxHistoryEntries) {
      healthHistory = healthHistory.slice(-MONITOR_CONFIG.maxHistoryEntries)
    }

    writeFileSync(MONITOR_CONFIG.historyFile, JSON.stringify(healthHistory, null, 2))
  } catch (err) {
    warning(`Could not save health history: ${err.message}`)
  }
}

// Perform quick health check
async function quickHealthCheck() {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    // Test basic connectivity with a simple query
    const response = await client.fetch('*[_type == "product"][0...3]{ _id, title }')
    const responseTime = Date.now() - startTime
    const resultCount = response ? response.length : 0

    const status = responseTime < MONITOR_CONFIG.alertThresholds.responseTime ? 'healthy' :
                   responseTime < MONITOR_CONFIG.alertThresholds.criticalResponseTime ? 'warning' : 'critical'

    return {
      timestamp,
      status,
      responseTime,
      resultCount,
      message: `Query returned ${resultCount} results in ${responseTime}ms`
    }
  } catch (err) {
    return {
      timestamp,
      status: 'critical',
      responseTime: Date.now() - startTime,
      resultCount: 0,
      error: err.message,
      message: `Health check failed: ${err.message}`
    }
  }
}

// Perform detailed health analysis
async function detailedHealthCheck() {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  const checks = {
    connection: null,
    schemas: [],
    performance: [],
    consistency: []
  }

  try {
    // Connection test
    const connectionStart = Date.now()
    await client.fetch('*[_type == "sanity.imageAsset"][0]')
    checks.connection = {
      status: 'healthy',
      responseTime: Date.now() - connectionStart,
      message: 'Connection successful'
    }
  } catch (err) {
    checks.connection = {
      status: 'critical',
      responseTime: Date.now() - connectionStart,
      message: err.message
    }
  }

  // Schema validation
  const schemas = ['product', 'category', 'author', 'user', 'order']
  for (const schemaName of schemas) {
    const schemaStart = Date.now()
    try {
      const count = await client.fetch(`count(*[_type == "${schemaName}"])`)
      checks.schemas.push({
        name: schemaName,
        status: count > 0 ? 'healthy' : 'warning',
        responseTime: Date.now() - schemaStart,
        count,
        message: `${count} documents found`
      })
    } catch (err) {
      checks.schemas.push({
        name: schemaName,
        status: 'critical',
        responseTime: Date.now() - schemaStart,
        count: 0,
        message: err.message
      })
    }
  }

  // Performance tests
  const performanceQueries = [
    { name: 'Product List', query: '*[_type == "product"][0...10]{ _id, title }' },
    { name: 'Category Count', query: 'count(*[_type == "category"])' },
    { name: 'Recent Products', query: '*[_type == "product"] | order(_createdAt desc)[0...5]{ title, _createdAt }' }
  ]

  for (const test of performanceQueries) {
    const perfStart = Date.now()
    try {
      const result = await client.fetch(test.query)
      const responseTime = Date.now() - perfStart
      const status = responseTime < 500 ? 'healthy' : responseTime < 1000 ? 'warning' : 'critical'

      checks.performance.push({
        name: test.name,
        status,
        responseTime,
        resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
        message: `Query completed in ${responseTime}ms`
      })
    } catch (err) {
      checks.performance.push({
        name: test.name,
        status: 'critical',
        responseTime: Date.now() - perfStart,
        resultCount: 0,
        message: err.message
      })
    }
  }

  // Calculate overall status
  let overallStatus = 'healthy'
  let issueCount = 0
  let criticalIssues = 0

  if (checks.connection.status === 'critical') {
    overallStatus = 'critical'
    criticalIssues++
  }

  criticalIssues += checks.schemas.filter(s => s.status === 'critical').length
  criticalIssues += checks.performance.filter(p => p.status === 'critical').length

  issueCount = criticalIssues +
    checks.schemas.filter(s => s.status === 'warning').length +
    checks.performance.filter(p => p.status === 'warning').length

  if (criticalIssues > 0) {
    overallStatus = 'critical'
  } else if (issueCount > 0) {
    overallStatus = 'warning'
  }

  return {
    timestamp,
    status: overallStatus,
    duration: Date.now() - startTime,
    issueCount,
    criticalIssues,
    checks
  }
}

// Display current status
function displayStatus(healthData) {
  const statusColor = healthData.status === 'healthy' ? colors.green :
                     healthData.status === 'warning' ? colors.yellow : colors.red

  const statusIcon = healthData.status === 'healthy' ? '💚' :
                    healthData.status === 'warning' ? '⚠️' : '🚨'

  const timestamp = new Date(healthData.timestamp).toLocaleTimeString()

  log(`${statusIcon} [${timestamp}] ${statusColor}${healthData.status.toUpperCase()}${colors.reset} - ${healthData.message || 'Health check completed'}`)

  if (healthData.responseTime) {
    log(`   Response: ${healthData.responseTime}ms`)
  }

  if (healthData.duration) {
    log(`   Duration: ${healthData.duration}ms`)
  }

  if (healthData.issueCount > 0) {
    log(`   Issues: ${healthData.issueCount} (${healthData.criticalIssues} critical)`)
  }
}

// Generate performance report
function generatePerformanceReport() {
  if (healthHistory.length === 0) {
    warning('No health history available for performance report')
    return
  }

  header('📊 PERFORMANCE REPORT (Last 10 Checks)')

  const recent = healthHistory.slice(-10)
  const avgResponseTime = recent.reduce((sum, h) => sum + (h.responseTime || 0), 0) / recent.length
  const healthyCount = recent.filter(h => h.status === 'healthy').length
  const warningCount = recent.filter(h => h.status === 'warning').length
  const criticalCount = recent.filter(h => h.status === 'critical').length

  log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`)
  log(`Status Distribution:`)
  log(`  ✅ Healthy: ${healthyCount}/10 (${(healthyCount/10*100).toFixed(1)}%)`)
  log(`  ⚠️  Warning: ${warningCount}/10 (${(warningCount/10*100).toFixed(1)}%)`)
  log(`  🚨 Critical: ${criticalCount}/10 (${(criticalCount/10*100).toFixed(1)}%)`)

  // Show trend
  if (recent.length >= 5) {
    const firstHalf = recent.slice(0, Math.floor(recent.length/2))
    const secondHalf = recent.slice(Math.floor(recent.length/2))

    const firstAvg = firstHalf.reduce((sum, h) => sum + (h.responseTime || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, h) => sum + (h.responseTime || 0), 0) / secondHalf.length

    if (secondAvg < firstAvg * 0.9) {
      success(`Trend: Performance improving (${((1 - secondAvg/firstAvg) * 100).toFixed(1)}% faster)`)
    } else if (secondAvg > firstAvg * 1.1) {
      warning(`Trend: Performance degrading (${((secondAvg/firstAvg - 1) * 100).toFixed(1)}% slower)`)
    } else {
      info('Trend: Performance stable')
    }
  }
}

// Start continuous monitoring
async function startMonitoring() {
  if (isMonitoring) {
    warning('Monitoring is already active')
    return
  }

  isMonitoring = true
  header('🔄 STARTING CONTINUOUS MONITORING')
  info(`Checking every ${MONITOR_CONFIG.interval/1000} seconds`)
  info('Press Ctrl+C to stop monitoring')

  // Perform initial detailed check
  const initialCheck = await detailedHealthCheck()
  healthHistory.push(initialCheck)
  displayStatus(initialCheck)
  saveHistory()

  // Start interval monitoring with quick checks
  monitoringInterval = setInterval(async () => {
    try {
      const quickCheck = await quickHealthCheck()
      healthHistory.push(quickCheck)
      displayStatus(quickCheck)
      saveHistory()

      // Alert on status changes
      if (healthHistory.length >= 2) {
        const previous = healthHistory[healthHistory.length - 2]
        const current = quickCheck

        if (previous.status !== current.status) {
          if (current.status === 'critical') {
            error(`🚨 ALERT: Status changed from ${previous.status} to CRITICAL!`)
          } else if (current.status === 'healthy' && previous.status !== 'healthy') {
            success(`🎉 RECOVERY: Status back to HEALTHY`)
          }
        }
      }

    } catch (err) {
      error(`Monitoring error: ${err.message}`)
    }
  }, MONITOR_CONFIG.interval)
}

// Stop monitoring
function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
  isMonitoring = false
  info('Monitoring stopped')
}

// Handle CLI arguments
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'check'

  log(`${colors.bright}${colors.cyan}`)
  log('╔══════════════════════════════════════════════════════════════╗')
  log('║               SANITY HEALTH MONITOR                          ║')
  log('║              Enhanced Monitoring Tools                       ║')
  log('╚══════════════════════════════════════════════════════════════╝')
  log(colors.reset)

  // Load existing history
  loadHistory()

  // Check environment
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
    process.exit(1)
  }

  info(`Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID} (${process.env.NEXT_PUBLIC_SANITY_DATASET})`)

  switch (command) {
    case 'check':
    case 'quick':
      const quickResult = await quickHealthCheck()
      displayStatus(quickResult)
      healthHistory.push(quickResult)
      saveHistory()
      break

    case 'detailed':
    case 'full':
      const detailedResult = await detailedHealthCheck()
      displayStatus(detailedResult)
      healthHistory.push(detailedResult)
      saveHistory()

      // Show breakdown
      if (detailedResult.checks) {
        header('📋 DETAILED BREAKDOWN')

        log(`Connection: ${detailedResult.checks.connection.status} (${detailedResult.checks.connection.responseTime}ms)`)

        log('\nSchemas:')
        detailedResult.checks.schemas.forEach(schema => {
          const icon = schema.status === 'healthy' ? '✅' : schema.status === 'warning' ? '⚠️' : '❌'
          log(`  ${icon} ${schema.name}: ${schema.count} docs (${schema.responseTime}ms)`)
        })

        log('\nPerformance:')
        detailedResult.checks.performance.forEach(perf => {
          const icon = perf.status === 'healthy' ? '✅' : perf.status === 'warning' ? '⚠️' : '❌'
          log(`  ${icon} ${perf.name}: ${perf.responseTime}ms`)
        })
      }
      break

    case 'monitor':
    case 'watch':
      await startMonitoring()
      break

    case 'report':
    case 'stats':
      generatePerformanceReport()
      break

    case 'history':
      header('📈 HEALTH HISTORY')
      const recent = healthHistory.slice(-20).reverse()
      recent.forEach(h => {
        const time = new Date(h.timestamp).toLocaleString()
        const icon = h.status === 'healthy' ? '✅' : h.status === 'warning' ? '⚠️' : '❌'
        log(`${icon} ${time} - ${h.status} (${h.responseTime || h.duration || 0}ms)`)
      })
      break

    case 'help':
      header('📚 AVAILABLE COMMANDS')
      log('  check, quick    - Perform quick health check (default)')
      log('  detailed, full  - Perform comprehensive health check')
      log('  monitor, watch  - Start continuous monitoring')
      log('  report, stats   - Show performance report')
      log('  history         - Show recent health history')
      log('  help            - Show this help message')
      break

    default:
      error(`Unknown command: ${command}`)
      log('Use "help" to see available commands')
      process.exit(1)
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  log('\n\nShutting down gracefully...')
  stopMonitoring()
  saveHistory()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stopMonitoring()
  saveHistory()
  process.exit(0)
})

// Run the monitor
main().catch(err => {
  error(`Monitor failed: ${err.message}`)
  console.error(err)
  process.exit(1)
})
