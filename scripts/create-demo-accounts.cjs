const { createClient } = require('@sanity/client')
const bcrypt = require('bcryptjs')

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'f9wm82yi',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2024-01-01',
})

async function createDemoAccounts() {
  console.log('🚀 Creating demo accounts for all user roles...\n')

  const demoAccounts = [
    {
      role: 'user',
      email: 'demo.user@ui8.net',
      password: 'demo123',
      name: 'Demo User',
      bio: 'Regular user account for testing basic features'
    },
    {
      role: 'partner',
      email: 'demo.partner@ui8.net',
      password: 'demo123',
      name: 'Demo Partner',
      bio: 'Partner account for testing content creation and analytics',
      company: 'Demo Design Studio',
      website: 'https://demo-studio.com'
    },
    {
      role: 'admin',
      email: 'demo.admin@ui8.net',
      password: 'demo123',
      name: 'Demo Admin',
      bio: 'Admin account for testing all features and management',
      company: 'UI8 Demo Team'
    }
  ]

  for (const account of demoAccounts) {
    try {
      // Check if user already exists
      const existingUser = await client.fetch(
        `*[_type == "user" && email == $email][0]`,
        { email: account.email }
      )

      if (existingUser) {
        console.log(`⚠️  User ${account.email} already exists, skipping...`)
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(account.password, 12)

      // Create user object
      const newUser = {
        _type: 'user',
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        verified: true, // Demo accounts are pre-verified
        provider: 'credentials',
        bio: account.bio,
        company: account.company,
        website: account.website,
        preferences: {
          newsletter: true,
          notifications: true,
          theme: 'system'
        },
        stats: {
          totalPurchases: account.role === 'user' ? 5 : 0,
          totalSpent: account.role === 'user' ? 125.99 : 0,
          favoriteCategories: ['ui-kits', 'templates'],
          lastLoginAt: new Date().toISOString()
        }
      }

      // Add partner-specific fields
      if (account.role === 'partner' || account.role === 'admin') {
        newUser.partnerInfo = {
          approved: true,
          approvedAt: new Date().toISOString(),
          commissionRate: 0.7,
          totalEarnings: account.role === 'partner' ? 850.25 : 0,
          productsPublished: account.role === 'partner' ? 12 : 0
        }
      }

      // Create user in Sanity
      const result = await client.create(newUser)

      console.log(`✅ Created ${account.role} account:`)
      console.log(`   Email: ${account.email}`)
      console.log(`   Password: ${account.password}`)
      console.log(`   Name: ${account.name}`)
      console.log(`   ID: ${result._id}\n`)

    } catch (error) {
      console.error(`❌ Error creating ${account.role} account:`, error.message)
    }
  }

  console.log('🎉 Demo account creation complete!')
  console.log('\n📋 Demo Account Summary:')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ Role    │ Email                │ Password │ Access Level  │')
  console.log('├─────────────────────────────────────────────────────────┤')
  console.log('│ User    │ demo.user@ui8.net    │ demo123  │ Basic         │')
  console.log('│ Partner │ demo.partner@ui8.net │ demo123  │ Content+Sales │')
  console.log('│ Admin   │ demo.admin@ui8.net   │ demo123  │ Full Access   │')
  console.log('└─────────────────────────────────────────────────────────┘')
  console.log('\n🧪 Now you can test:')
  console.log('• Login with any account at /auth/signin')
  console.log('• Test CORS at /test-cors (now public!)')
  console.log('• User dashboard at /user/dashboard')
  console.log('• Partner features at /partner')
  console.log('• Admin panel at /admin')
  console.log('• Sanity Studio at /studio (admin only)')
}

// Run the script
createDemoAccounts().catch(console.error)
