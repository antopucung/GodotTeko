'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestCorsPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testDirectSanity = async () => {
    setLoading(true)
    try {
      // Test direct client-side call to Sanity API
      const response = await fetch(
        `https://f9wm82yi.api.sanity.io/v2024-01-01/data/query/production?query=*%5B_type%20%3D%3D%20%22category%22%5D%5B0%5D&perspective=published`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setResult(`✅ CORS Fixed! Category: ${data.result?.name || 'Success'}`)
      } else {
        setResult(`❌ CORS Error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  const testApiRoute = async () => {
    setLoading(true)
    try {
      // Test through API route (should always work)
      const response = await fetch('/api/categories')
      const data = await response.json()

      if (response.ok) {
        setResult(`✅ API Route Works! Found ${data.length} categories`)
      } else {
        setResult(`❌ API Route Error: ${response.status}`)
      }
    } catch (error) {
      setResult(`❌ API Route Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🧪 CORS Test Page</CardTitle>
          <p className="text-gray-600">
            Test Sanity API access after updating CORS settings
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={testDirectSanity}
              disabled={loading}
              variant="outline"
            >
              Test Direct Sanity API
            </Button>

            <Button
              onClick={testApiRoute}
              disabled={loading}
            >
              Test API Route
            </Button>
          </div>

          {result && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <pre className="text-sm">{result}</pre>
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Expected Results:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Before CORS fix:</strong> Direct API = ❌ CORS Error, API Route = ✅ Works</li>
              <li><strong>After CORS fix:</strong> Both should show ✅ Success</li>
            </ul>
          </div>

          <div className="text-sm bg-blue-50 p-3 rounded">
            <strong>💡 CORS Fix Instructions:</strong>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Go to <a href="https://www.sanity.io/manage/personal/project/f9wm82yi/api" target="_blank" rel="noopener" className="text-blue-600 underline">Sanity Console</a></li>
              <li>Add <code>https://3000-xyxdhvkieotplhixqwkibysbjtwkxdge.preview.same-app.com</code> to CORS origins</li>
              <li>Enable credentials for the origin</li>
              <li>Come back and test!</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-100 rounded">
              <strong>⚠️ Current Issue:</strong> App running on Same.new preview URL, not localhost
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
