# 🔍 Sanity Health Monitoring Tools

## Overview

Our UI8 Clone project includes comprehensive health monitoring tools for Sanity CMS to ensure optimal performance, detect issues early, and maintain system reliability.

## 🛠️ Available Tools

### 1. Basic Health Checker (`test-sanity-health.js`)
- **Purpose**: Complete health assessment with detailed reporting
- **Usage**: One-time comprehensive health checks
- **Output**: Detailed analysis of all system components

### 2. Enhanced Monitor (`sanity-monitor.js`)
- **Purpose**: Continuous monitoring, performance tracking, and alerting
- **Usage**: Real-time monitoring, quick checks, performance reports
- **Output**: Live status updates, historical data, trend analysis

## 🚀 Quick Start

### Run Basic Health Check
```bash
# Complete health assessment
bun run health-check

# Or directly
node scripts/test-sanity-health.js
```

### Enhanced Monitoring Commands
```bash
# Quick health check
bun run monitor

# Detailed analysis
bun run monitor:detailed

# Continuous monitoring (every 30 seconds)
bun run monitor:watch

# Performance statistics
bun run monitor:stats
```

## 📊 What Gets Monitored

### 🔗 Connection Health
- **Sanity API connectivity**
- **Response times**
- **Network latency**
- **Authentication status**

### 📚 Schema Validation
- **Product schema** - Core marketplace items
- **Category schema** - Product categorization
- **Author schema** - Content creators
- **User schema** - Customer accounts
- **Order schema** - Transaction records

### ⚡ Query Performance
- **Product listings** - Homepage and browse pages
- **Product details** - Individual product pages
- **Category filtering** - Search and filter operations
- **Author products** - Creator portfolios
- **Search functionality** - Site-wide search

### 🎯 Data Consistency
- **Reference integrity** - All products have categories/authors
- **Orphaned documents** - Detect unreferenced content
- **Data completeness** - Required fields validation
- **Relationship validation** - Cross-document links

### 🖼️ Asset Delivery
- **Image loading performance**
- **CDN response times**
- **Asset availability**
- **Optimization effectiveness**

## 📈 Health Status Levels

### ✅ HEALTHY
- **Response times** < 500ms
- **All schemas** valid with data
- **No critical issues** detected
- **Full functionality** available

### ⚠️ WARNING
- **Response times** 500ms - 1000ms
- **Some schemas** empty (normal for new data)
- **Minor issues** detected
- **Functionality** mostly intact

### 🚨 CRITICAL
- **Response times** > 1000ms
- **Connection failures** or timeouts
- **Schema errors** or corruption
- **Major functionality** impacted

## 🔧 Detailed Command Reference

### Basic Health Checker

```bash
# Full comprehensive health check
bun run health-check
```

**Output includes:**
- Connection test with response times
- Schema validation for all content types
- Query performance analysis
- Data consistency checks
- Asset delivery verification
- Overall system health score

### Enhanced Monitor

#### Quick Check
```bash
bun run monitor
# or
bun run monitor quick
```
- Fast connectivity test
- Basic performance check
- Status indicator
- Response time measurement

#### Detailed Analysis
```bash
bun run monitor:detailed
# or
bun run monitor detailed
```
- Complete system breakdown
- Individual component status
- Performance metrics per query
- Detailed issue reporting

#### Continuous Monitoring
```bash
bun run monitor:watch
# or
bun run monitor monitor
```
- **Interval**: Every 30 seconds
- **Duration**: Until manually stopped (Ctrl+C)
- **Features**:
  - Real-time status updates
  - Automatic alerting on status changes
  - Historical data collection
  - Trend detection

#### Performance Reports
```bash
bun run monitor:stats
# or
bun run monitor report
```
- **Metrics**: Last 10 health checks
- **Statistics**: Average response times, status distribution
- **Trends**: Performance improvement/degradation analysis
- **Alerts**: Threshold breach notifications

#### History Review
```bash
bun run monitor history
```
- Last 20 health check results
- Timestamps and status codes
- Quick trend visualization

## 📁 Data Storage

### Health History File
- **Location**: `sanity-health-history.json`
- **Purpose**: Store monitoring data for trend analysis
- **Retention**: Last 100 entries (automatic cleanup)
- **Format**: JSON with timestamps, status, metrics

### Example History Entry
```json
{
  "timestamp": "2025-08-25T11:09:26.501Z",
  "status": "warning",
  "responseTime": 384,
  "resultCount": 10,
  "message": "Query returned 10 results in 384ms",
  "issueCount": 4,
  "criticalIssues": 0
}
```

## 🚨 Alerting & Thresholds

### Performance Thresholds
- **Healthy**: < 500ms response time
- **Warning**: 500ms - 1000ms response time
- **Critical**: > 1000ms response time

### Alert Conditions
- **Status Changes**: Automatic alerts when health status changes
- **Critical Issues**: Immediate notification for critical problems
- **Recovery**: Alerts when system returns to healthy state
- **Trend Detection**: Performance degradation warnings

### Alert Channels
- **Terminal Output**: Real-time console notifications
- **Status Changes**: Highlighted in monitoring output
- **Historical Tracking**: Logged for later analysis

## 🛠️ Troubleshooting Guide

### Common Issues

#### ❌ "Connection Failed"
**Possible Causes:**
- Invalid Sanity project ID
- Wrong dataset name
- Missing API token
- Network connectivity issues

**Solutions:**
1. Check `.env.local` file for correct Sanity configuration
2. Verify project ID matches Sanity dashboard
3. Confirm API token has read permissions
4. Test internet connectivity

#### ⚠️ "Slow Response Times"
**Possible Causes:**
- Complex queries without optimization
- Large dataset without proper indexing
- Network latency issues
- Sanity API rate limiting

**Solutions:**
1. Optimize GROQ queries with better filtering
2. Add indexes in Sanity for frequently queried fields
3. Consider query result caching
4. Review API usage patterns

#### ⚠️ "Schema Empty"
**Common for New Projects:**
- `user` schema - Normal until customers register
- `order` schema - Normal until first purchases
- Custom schemas - Normal until content added

**Actions:**
- Monitor if these populate during normal usage
- Consider seeding with test data for development

### Environment Configuration

```bash
# Required Environment Variables
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_READ_TOKEN=your-read-token
```

### Testing Environment Setup

```bash
# Verify environment
echo $NEXT_PUBLIC_SANITY_PROJECT_ID

# Test basic connectivity
bun run monitor quick

# Run full health assessment
bun run health-check

# Start monitoring for development
bun run monitor:watch
```

## 📊 Performance Optimization

### Best Practices
1. **Regular Monitoring**: Run health checks daily
2. **Trend Analysis**: Review weekly performance reports
3. **Proactive Alerts**: Set up continuous monitoring during critical periods
4. **Query Optimization**: Address slow queries promptly
5. **Data Maintenance**: Clean up unused content regularly

### Optimization Targets
- **Connection**: < 300ms average
- **Queries**: < 400ms for complex operations
- **Assets**: < 200ms for image delivery
- **Overall**: 95%+ healthy status

### Monitoring Schedule
- **Development**: Continuous monitoring during active development
- **Staging**: Health checks before each deployment
- **Production**: Automated monitoring every 5 minutes
- **Maintenance**: Weekly detailed health reports

## 🎯 Integration with Admin Dashboard

### Web Interface
The health monitoring tools integrate with the admin dashboard at `/admin/health`:

- **Real-time Status**: Live health indicators
- **Visual Charts**: Performance trend graphs
- **Alert History**: Past issues and resolutions
- **System Overview**: Overall platform health

### API Endpoints
- `GET /api/admin/health` - Current health status
- `GET /api/admin/health?type=full` - Detailed health report
- `GET /api/admin/health?format=json` - JSON export
- `GET /api/admin/health?format=csv` - CSV export

## 🔄 Automation & CI/CD

### Pre-deployment Checks
```bash
#!/bin/bash
# Add to your deployment scripts
echo "Running Sanity health check..."
bun run health-check

if [ $? -eq 0 ]; then
    echo "✅ Health check passed - proceeding with deployment"
else
    echo "❌ Health check failed - aborting deployment"
    exit 1
fi
```

### Monitoring Scripts
```bash
# Cron job for regular monitoring (every 5 minutes)
*/5 * * * * cd /path/to/ui8-clone && bun run monitor quick >> /var/log/sanity-health.log

# Daily detailed report (every day at 9 AM)
0 9 * * * cd /path/to/ui8-clone && bun run monitor:detailed >> /var/log/sanity-detailed.log
```

## 🎉 Success Metrics

### Target KPIs
- **Uptime**: 99.9% healthy status
- **Response Time**: < 500ms average
- **Query Performance**: < 400ms for complex operations
- **Issue Resolution**: < 5 minutes for critical problems

### Current Performance
Based on our latest health checks:
- ✅ **Connection**: Excellent (300-400ms)
- ✅ **Data Integrity**: All products properly linked
- ✅ **Asset Delivery**: Fast (< 100ms)
- ⚠️ **Some Queries**: Need optimization (500-600ms)

The health monitoring tools provide comprehensive visibility into your Sanity CMS performance and help maintain optimal system reliability! 🚀
