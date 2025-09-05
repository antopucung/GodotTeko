import { createClient } from '@sanity/client'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'f9wm82yi',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token: process.env.SANITY_API_READ_TOKEN || 'skf7ZcyGQOOWFKOc5hRjagnRlFjiVMl8EUzNiUAVT3r2J4u8XlL6guFE6GdDYh2j2ZuxylNVnALtVCCt9DEIwQ9Llbgy0DdhJHiA8QQRpz5FTveEqkfuP31uluv9i0uNiHf5h8abdqA6NpdKVOuhLtkwpfNRug4zYzGw6uZAJVtvBfyynELG',
  useCdn: false
})

// High-quality UI design images to use
const productImages = {
  'Shadow VPN Mobile UI Kit': 'https://img.freepik.com/premium-photo/health-fitness-tracker-ui-mockup_624163-5946.jpg',
  'DashKit Pro - Admin Dashboard UI': 'https://assets.justinmind.com/wp-content/uploads/2018/12/6-best-practices-for-Dashboard-Design-Justinmind-header-768x492.png',
  'E-Shop Mobile Commerce UI': 'https://static.vecteezy.com/system/resources/previews/045/374/275/non_2x/set-of-ui-ux-gui-screens-booking-app-flat-design-template-for-mobile-apps-responsive-website-wireframes-web-design-ui-kit-booking-dashboard-vector.jpg',
  'FinTech Banking App UI Kit': 'https://www.shutterstock.com/image-vector/user-interface-elements-set-banking-600nw-2444322297.jpg',
  'NextJS SaaS Starter Template': 'https://www.shutterstock.com/image-vector/laptop-showing-charts-graph-analysis-600nw-1890876256.jpg',
  'Vue.js E-commerce Template': 'https://media.istockphoto.com/id/1418233376/vector/user-interface-design-for-business-dashboard-app.jpg',
  'React Admin Dashboard': 'https://www.shutterstock.com/image-vector/finance-app-dashboard-ui-templates-600nw-2121396761.jpg',
  '3D iPhone 15 Pro Mockup Collection': 'https://img.freepik.com/premium-photo/create-mockup-fitness-tracking-mobile-app_624163-3796.jpg',
  'MacBook Pro M3 Workspace Mockups': 'https://www.shutterstock.com/image-vector/laptop-showing-charts-graph-analysis-600nw-1890876256.jpg',
  '3D Character Illustration Pack': 'https://www.shutterstock.com/image-vector/ui-infographic-elements-modern-presentation-260nw-2604046909.jpg',
  'Free Mobile UI Kit Sample': 'https://img.freepik.com/free-psd/template-travel-mobile-app_145275-349.jpg'
}

async function uploadImageFromUrl(imageUrl, filename) {
  try {
    console.log(`🖼️ Uploading image: ${filename}`)

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const imageData = new Uint8Array(imageBuffer)

    // Upload to Sanity
    const asset = await client.assets.upload('image', imageData, {
      filename: filename,
      timeout: 30000
    })

    console.log(`✅ Uploaded: ${filename} - ${asset._id}`)
    return asset
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error.message)
    return null
  }
}

async function updateProductImages() {
  console.log('🚀 Starting to update product images...')

  try {
    // Get all products
    const products = await client.fetch(`*[_type == "product"]{
      _id,
      title,
      images
    }`)

    console.log(`📦 Found ${products.length} products`)

    for (const product of products) {
      const imageUrl = productImages[product.title]
      if (!imageUrl) {
        console.log(`⏭️ Skipping ${product.title} - no image defined`)
        continue
      }

      console.log(`\n🔄 Processing: ${product.title}`)

      // Upload the image
      const filename = `${product.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`
      const imageAsset = await uploadImageFromUrl(imageUrl, filename)

      if (!imageAsset) {
        console.log(`❌ Failed to upload image for ${product.title}`)
        continue
      }

      // Update the product with the new image
      const imageObject = {
        _type: 'image',
        _key: 'main-image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id
        },
        alt: product.title
      }

      await client
        .patch(product._id)
        .set({
          images: [imageObject]
        })
        .commit()

      console.log(`✅ Updated product: ${product.title}`)

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n🎉 Successfully updated product images!')

  } catch (error) {
    console.error('❌ Error updating product images:', error)
  }
}

// Run the update
updateProductImages()
