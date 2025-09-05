#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAPIs() {
  console.log('🔍 Testing UI8 Clone API Endpoints...\n');

  const base = 'http://localhost:3000';

  const endpoints = [
    { url: '/api/products', name: 'Products API' },
    { url: '/api/categories', name: 'Categories API' },
    { url: '/api/authors', name: 'Authors API' },
    { url: '/api/admin/health?type=quick', name: 'Health Check API' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await fetch(base + endpoint.url);

      if (!response.ok) {
        console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (endpoint.url === '/api/products') {
        console.log(`✅ ${endpoint.name}: ${data.total || 0} total products, ${data.products?.length || 0} loaded`);
      } else if (endpoint.url === '/api/categories') {
        console.log(`✅ ${endpoint.name}: ${data.categories?.length || 0} categories loaded`);
      } else if (endpoint.url === '/api/authors') {
        console.log(`✅ ${endpoint.name}: ${data.authors?.length || 0} authors loaded`);
      } else if (endpoint.url.includes('health')) {
        console.log(`✅ ${endpoint.name}: Status ${data.data?.status || 'unknown'}`);
      }

    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }

  console.log('\n🔍 Testing Direct Sanity Connection...');

  try {
    const { createClient } = require('@sanity/client');

    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
      useCdn: false,
      token: process.env.SANITY_API_READ_TOKEN
    });

    console.log('Testing direct Sanity query...');
    const products = await client.fetch('*[_type == "product"][0...3] { _id, title }');
    console.log(`✅ Direct Sanity Query: ${products.length} products found`);

    if (products.length > 0) {
      console.log(`   Sample product: "${products[0].title}"`);
    }

  } catch (error) {
    console.log(`❌ Direct Sanity Connection: ${error.message}`);
  }
}

testAPIs().catch(console.error);
