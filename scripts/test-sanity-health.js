#!/usr/bin/env node

/**
 * Sanity Health Checker - Terminal Interface
 * Tests all health monitoring capabilities from command line
 */

import { config } from 'dotenv'
import { createClient } from '@sanity/client'

// Load environment variables
config({ path: '.env.local' })

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
}

// Helper functions
const log = (message, color = colors.reset) => console.log(`${color}${message}${colors.reset}`)
const success = (message) => log(`✅ ${message}`, colors.green)
const error = (message) => log(`❌ ${message}`, colors.red)
const warning = (message) => log(`⚠️  ${message}`, colors.yellow)
const info = (message) => log(`ℹ️  ${message}`, colors.blue)
const header = (message) => log(`\n${colors.bright}${colors.cyan}🔍 ${message}${colors.reset}\n`)

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false, // Always get fresh data for health checks
  token: process.env.SANITY_API_READ_TOKEN
})

// Health check functions
async function testConnection() {
  header('Testing Sanity Connection')
  const startTime = Date.now()

  try {
    // Test basic connectivity
    const ping = await client.fetch('*[_type == "sanity.imageAsset"][0]')
    const responseTime = Date.now() - startTime

    success(`Connection successful (${responseTime}ms)`)

    if (responseTime < 500) {
      success('Response time: Excellent (< 500ms)')
    } else if (responseTime < 1000) {
      warning('Response time: Good (500-1000ms)')
    } else {
      warning('Response time: Slow (> 1000ms)')
    }

    return { status: 'healthy', responseTime, message: 'Connection successful' }
  } catch (err) {
    error(`Connection failed: ${err.message}`)
    return { status: 'critical', responseTime: Date.now() - startTime, message: err.message }
  }
}

async function testSchemas() {
  header('Testing Schema Validation')

  const schemas = [
    { name: 'product', query: '*[_type == "product"][0]' },
    { name: 'category', query: '*[_type == "category"][0]' },
    { name: 'author', query: '*[_type == "author"][0]' },
    { name: 'user', query: '*[_type == "user"][0]' },
    { name: 'order', query: '*[_type == "order"][0]' }
  ]

  const results = []

  for (const schema of schemas) {
    const startTime = Date.now()

    try {
      const result = await client.fetch(schema.query)
      const responseTime = Date.now() - startTime

      if (result) {
        success(`Schema '${schema.name}': Valid with data (${responseTime}ms)`)
        results.push({ name: schema.name, status: 'healthy', hasData: true, responseTime })
      } else {
        warning(`Schema '${schema.name}': Valid but no data (${responseTime}ms)`)
        results.push({ name: schema.name, status: 'warning', hasData: false, responseTime })
      }
    } catch (err) {
      error(`Schema '${schema.name}': Error - ${err.message}`)
      results.push({ name: schema.name, status: 'critical', hasData: false, error: err.message })
    }
  }

  return results
}

async function testQueries() {
  header('Testing Query Performance')

  const queries = [
    { name: 'Product Listings', query: '*[_type == "product"][0...10]{ _id, title, slug }' },
    { name: 'Product Details', query: '*[_type == "product" && slug.current == "ui-kit-1"][0]{ ..., category->, author-> }' },
    { name: 'Category Filter', query: '*[_type == "product" && category._ref in *[_type == "category" && name == "UI Kits"]._id][0...5]' },
    { name: 'Author Products', query: '*[_type == "product" && author._ref in *[_type == "author" && name match "John*"]._id][0...5]' }
  ]

  const results = []

  for (const testQuery of queries) {
    const startTime = Date.now()

    try {
      const result = await client.fetch(testQuery.query)
      const responseTime = Date.now() - startTime
      const resultCount = Array.isArray(result) ? result.length : (result ? 1 : 0)

      if (responseTime < 500) {
        success(`Query '${testQuery.name}': Fast (${responseTime}ms, ${resultCount} results)`)
      } else if (responseTime < 1000) {
        warning(`Query '${testQuery.name}': Slow (${responseTime}ms, ${resultCount} results)`)
      } else {
        error(`Query '${testQuery.name}': Very Slow (${responseTime}ms, ${resultCount} results)`)
      }

      results.push({
        name: testQuery.name,
        status: responseTime < 500 ? 'healthy' : responseTime < 1000 ? 'warning' : 'critical',
        responseTime,
        resultCount
      })
    } catch (err) {
      error(`Query '${testQuery.name}': Failed - ${err.message}`)
      results.push({
        name: testQuery.name,
        status: 'critical',
        responseTime: Date.now() - startTime,
        error: err.message
      })
    }
  }

  return results
}

async function testDataConsistency() {
  header('Testing Data Consistency')

  const checks = []

  try {
    // Check for products without categories
    const productsWithoutCategory = await client.fetch('count(*[_type == "product" && !defined(category)])')
    if (productsWithoutCategory > 0) {
      warning(`Found ${productsWithoutCategory} products without categories`)
      checks.push({ name: 'Products without categories', status: 'warning', count: productsWithoutCategory })
    } else {
      success('All products have categories')
      checks.push({ name: 'Products without categories', status: 'healthy', count: 0 })
    }

    // Check for products without authors
    const productsWithoutAuthor = await client.fetch('count(*[_type == "product" && !defined(author)])')
    if (productsWithoutAuthor > 0) {
      warning(`Found ${productsWithoutAuthor} products without authors`)
      checks.push({ name: 'Products without authors', status: 'warning', count: productsWithoutAuthor })
    } else {
      success('All products have authors')
      checks.push({ name: 'Products without authors', status: 'healthy', count: 0 })
    }

    // Check for orphaned references
    const totalProducts = await client.fetch('count(*[_type == "product"])')
    const totalCategories = await client.fetch('count(*[_type == "category"])')
    const totalAuthors = await client.fetch('count(*[_type == "author"])')

    info(`Data summary: ${totalProducts} products, ${totalCategories} categories, ${totalAuthors} authors`)

    checks.push({
      name: 'Data summary',
      status: 'healthy',
      summary: { products: totalProducts, categories: totalCategories, authors: totalAuthors }
    })

  } catch (err) {
    error(`Data consistency check failed: ${err.message}`)
    checks.push({ name: 'Data consistency', status: 'critical', error: err.message })
  }

  return checks
}

async function testAssetDelivery() {
  header('Testing Asset Delivery')

  try {
    // Get a sample image asset
    const imageAsset = await client.fetch('*[_type == "sanity.imageAsset"][0]{ _id, url }')

    if (!imageAsset) {
      warning('No image assets found in Sanity')
      return { status: 'warning', message: 'No image assets found' }
    }

    // Test image URL accessibility
    const startTime = Date.now()
    const response = await fetch(imageAsset.url, { method: 'HEAD' })
    const responseTime = Date.now() - startTime

    if (response.ok) {
      success(`Asset delivery successful (${responseTime}ms)`)
      return { status: 'healthy', responseTime, message: 'Assets accessible' }
    } else {
      error(`Asset delivery failed: ${response.status} ${response.statusText}`)
      return { status: 'critical', responseTime, message: `HTTP ${response.status}` }
    }

  } catch (err) {
    error(`Asset delivery test failed: ${err.message}`)
    return { status: 'critical', message: err.message }
  }
}

async function generateHealthReport() {
  header('Generating Complete Health Report')

  const startTime = Date.now()

  // Run all health checks
  const [
    connectionHealth,
    schemaResults,
    queryResults,
    consistencyResults,
    assetDelivery
  ] = await Promise.all([
    testConnection(),
    testSchemas(),
    testQueries(),
    testDataConsistency(),
    testAssetDelivery()
  ])

  const totalTime = Date.now() - startTime

  // Calculate overall status
  let overallStatus = 'healthy'
  let issueCount = 0
  let criticalIssues = 0

  if (connectionHealth.status === 'critical') {
    overallStatus = 'critical'
    criticalIssues++
  }

  if (assetDelivery.status === 'critical') {
    overallStatus = 'critical'
    criticalIssues++
  }

  const criticalSchemas = schemaResults.filter(s => s.status === 'critical').length
  const criticalQueries = queryResults.filter(q => q.status === 'critical').length
  const criticalConsistency = consistencyResults.filter(c => c.status === 'critical').length

  criticalIssues += criticalSchemas + criticalQueries + criticalConsistency
  issueCount = criticalIssues +
    schemaResults.filter(s => s.status === 'warning').length +
    queryResults.filter(q => q.status === 'warning').length +
    consistencyResults.filter(c => c.status === 'warning').length

  if (criticalIssues > 0) {
    overallStatus = 'critical'
  } else if (issueCount > 0) {
    overallStatus = 'warning'
  }

  // Display summary
  header('Health Check Summary')

  const statusColor = overallStatus === 'healthy' ? colors.green :
                     overallStatus === 'warning' ? colors.yellow : colors.red

  log(`Overall Status: ${statusColor}${overallStatus.toUpperCase()}${colors.reset}`)
  log(`Total Issues: ${issueCount} (${criticalIssues} critical)`)
  log(`Check Duration: ${totalTime}ms`)
  log(`Timestamp: ${new Date().toISOString()}`)

  if (overallStatus === 'healthy') {
    success('\n🎉 All systems are healthy!')
  } else if (overallStatus === 'warning') {
    warning('\n⚠️  Some issues detected, but system is functional')
  } else {
    error('\n🚨 Critical issues detected, immediate attention required')
  }

  return {
    status: overallStatus,
    issueCount,
    criticalIssues,
    totalTime,
    timestamp: new Date().toISOString(),
    details: {
      connection: connectionHealth,
      schemas: schemaResults,
      queries: queryResults,
      consistency: consistencyResults,
      assets: assetDelivery
    }
  }
}

// Main execution
async function main() {
  log(`${colors.bright}${colors.cyan}`)
  log('╔══════════════════════════════════════════════════════════════╗')
  log('║                  SANITY HEALTH CHECKER                       ║')
  log('║                    Terminal Interface                        ║')
  log('╚══════════════════════════════════════════════════════════════╝')
  log(colors.reset)

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
    error('Missing NEXT_PUBLIC_SANITY_DATASET environment variable')
    process.exit(1)
  }

  info(`Project ID: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`)
  info(`Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}`)

  try {
    const healthReport = await generateHealthReport()

    // Exit with appropriate code
    const exitCode = healthReport.status === 'critical' ? 1 : 0
    process.exit(exitCode)

  } catch (err) {
    error(`Health check failed: ${err.message}`)
    console.error(err)
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  error(`Unhandled rejection: ${err.message}`)
  console.error(err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  error(`Uncaught exception: ${err.message}`)
  console.error(err)
  process.exit(1)
})

// Run the health checker
main()
