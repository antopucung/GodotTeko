'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import Footer from '@/components/Footer'
import ProductGrid from '@/components/ProductGrid'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('featured')

  return (
    <div className="min-h-screen bg-[#161617]">
      <Header />

      {/* Hero Section with Background */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Hero background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://ext.same-assets.com/1519585551/845175416.jpeg')`
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            11,529 curated design resources to speed up your creative workflow.
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join a growing family of 951,093 designers and makers from around the world.
          </p>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-12">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-black/20 border border-gray-600 p-1 rounded-full">
                <TabsTrigger
                  value="featured"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 px-6 py-2 rounded-full border-0"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Featured
                </TabsTrigger>
                <TabsTrigger
                  value="trending"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 px-6 py-2 rounded-full border-0"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger
                  value="latest"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 px-6 py-2 rounded-full border-0"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Latest
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Real Product Grid Section */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <ProductGrid />
        </div>
      </section>

      <Footer />
    </div>
  )
}
