import { NextRequest, NextResponse } from 'next/server'
import { client, queries, transformSanityProduct } from '@/lib/sanity'
import { getProductById } from '@/data/mock-data'

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (USE_MOCK_DATA) {
      console.log(`Using mock data for product ${id}`)
      const product = await getProductById(id)
      return NextResponse.json(product)
    }

    // Try to get by slug first, then by ID
    console.log(`Fetching product from Sanity with ID/slug: ${id}`)
    let sanityProduct = await client.fetch(queries.product, { slug: id })

    if (!sanityProduct) {
      sanityProduct = await client.fetch(`*[_type == "product" && _id == $id][0]`, { id })
    }

    if (!sanityProduct) {
      console.log(`Product not found: ${id}`)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = transformSanityProduct(sanityProduct)
    console.log(`Successfully fetched product: ${product.title}`)

    return NextResponse.json(product)

  } catch (error) {
    console.error('Error in product API route:', error)

    // Fallback to mock data on error
    console.log('Falling back to mock data due to error')
    const { id } = await params
    const product = await getProductById(id)
    return NextResponse.json(product)
  }
}
