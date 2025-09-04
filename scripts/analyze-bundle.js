#!/usr/bin/env node

// Bundle Analysis Script for UI8 Clone
// Run with: bun run analyze

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Starting Bundle Analysis...\n')

// 1. Run Next.js bundle analyzer
console.log('📊 Generating bundle analysis...')
try {
  execSync('ANALYZE=true bun run build', {
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  })
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message)
  process.exit(1)
}

// 2. Analyze package.json dependencies
console.log('\n📦 Analyzing dependencies...')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const dependencies = Object.keys(packageJson.dependencies || {})
const devDependencies = Object.keys(packageJson.devDependencies || {})

console.log(`Dependencies: ${dependencies.length}`)
console.log(`Dev Dependencies: ${devDependencies.length}`)

// 3. Check for large dependencies
const largeDependencies = [
  '@next/bundle-analyzer',
  'next',
  'react',
  'react-dom',
  '@sanity/client',
  'lucide-react',
  'date-fns'
]

console.log('\n📈 Large Dependencies to Monitor:')
largeDependencies.forEach(dep => {
  if (dependencies.includes(dep)) {
    console.log(`  ✓ ${dep}`)
  }
})

// 4. Suggest optimizations
console.log('\n💡 Optimization Suggestions:')
console.log('  1. Use dynamic imports for heavy components')
console.log('  2. Implement code splitting for routes')
console.log('  3. Optimize image loading with next/image')
console.log('  4. Consider lazy loading for admin components')
console.log('  5. Tree-shake unused utility functions')

// 5. Check for duplicate dependencies
console.log('\n🔍 Checking for potential optimizations...')

const optimizationChecks = [
  {
    name: 'Date utilities',
    check: () => dependencies.includes('date-fns'),
    suggestion: 'Consider using lightweight date utilities or tree-shaking date-fns'
  },
  {
    name: 'Icon libraries',
    check: () => dependencies.includes('lucide-react'),
    suggestion: 'Use selective imports: import { Icon } from "lucide-react"'
  },
  {
    name: 'UI library',
    check: () => dependencies.some(dep => dep.includes('ui')),
    suggestion: 'Ensure UI components are tree-shakeable'
  }
]

optimizationChecks.forEach(({ name, check, suggestion }) => {
  if (check()) {
    console.log(`  📋 ${name}: ${suggestion}`)
  }
})

// 6. Generate size report
const buildDir = '.next'
if (fs.existsSync(buildDir)) {
  console.log('\n📊 Build Size Analysis:')

  try {
    // Get build info
    const buildManifest = path.join(buildDir, 'build-manifest.json')
    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'))
      const pages = Object.keys(manifest.pages || {})
      console.log(`  📄 Pages built: ${pages.length}`)

      // Show largest pages
      console.log('  🔍 Main pages:')
      pages.slice(0, 10).forEach(page => {
        console.log(`    - ${page}`)
      })
    }

    // Check static files
    const staticDir = path.join(buildDir, 'static')
    if (fs.existsSync(staticDir)) {
      const getDirectorySize = (dir) => {
        let size = 0
        const files = fs.readdirSync(dir)

        files.forEach(file => {
          const filePath = path.join(dir, file)
          const stats = fs.statSync(filePath)

          if (stats.isDirectory()) {
            size += getDirectorySize(filePath)
          } else {
            size += stats.size
          }
        })

        return size
      }

      const staticSize = getDirectorySize(staticDir)
      const sizeMB = (staticSize / 1024 / 1024).toFixed(2)
      console.log(`  📁 Static assets size: ${sizeMB} MB`)

      // Size recommendations
      if (staticSize > 5 * 1024 * 1024) { // 5MB
        console.log('  ⚠️  Static assets are large. Consider:')
        console.log('    - Image optimization')
        console.log('    - Code splitting')
        console.log('    - Removing unused assets')
      } else {
        console.log('  ✅ Static assets size looks good')
      }
    }

  } catch (error) {
    console.log('  ⚠️  Could not analyze build size:', error.message)
  }
}

// 7. Performance recommendations
console.log('\n🚀 Performance Recommendations:')
console.log('  1. Enable gzip/brotli compression in production')
console.log('  2. Use CDN for static assets')
console.log('  3. Implement service worker for caching')
console.log('  4. Optimize Core Web Vitals')
console.log('  5. Use next/image for all images')
console.log('  6. Implement route-based code splitting')

// 8. Code splitting suggestions
console.log('\n📦 Code Splitting Opportunities:')
const codeSplittingSuggestions = [
  'Admin components (wrap in dynamic imports)',
  'Dashboard components (lazy load)',
  'Charts and analytics (dynamic import)',
  'File upload components (load on demand)',
  'Rich text editors (if any)',
  'Third-party widgets'
]

codeSplittingSuggestions.forEach((suggestion, index) => {
  console.log(`  ${index + 1}. ${suggestion}`)
})

console.log('\n✅ Bundle analysis complete!')
console.log('📊 Check .next/analyze/ for detailed bundle reports')
console.log('🌐 Open server-analyze.html and client-analyze.html in your browser')

// 9. Create optimization todo list
const optimizationTodos = `
# Bundle Optimization TODOs

## Immediate Actions (High Impact)
- [ ] Implement dynamic imports for admin components
- [ ] Add route-based code splitting
- [ ] Optimize image loading with next/image
- [ ] Enable tree-shaking for utility libraries

## Performance Improvements
- [ ] Implement service worker caching
- [ ] Add compression middleware
- [ ] Optimize font loading
- [ ] Minimize render-blocking resources

## Monitoring
- [ ] Set up bundle size monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor real user metrics
- [ ] Regular bundle analysis

Generated: ${new Date().toISOString()}
`

fs.writeFileSync('.bundle-optimization-todos.md', optimizationTodos)
console.log('📝 Created .bundle-optimization-todos.md with action items')
