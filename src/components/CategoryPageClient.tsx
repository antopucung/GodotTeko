"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Download,
  Heart,
  ShoppingCart
} from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: number;
  title: string;
  type: string;
  thumbnail: string;
  author: string;
  price?: number;
  originalPrice?: number;
  discount?: string;
  downloads?: number;
  badge: string;
  badgeColor: string;
}

// Mock category data based on UI8.net structure
const categoryData: Record<string, {
  title: string;
  description: string;
  totalCount: number;
  heroImage: string;
  filters: string[];
  products: Product[];
}> = {
  '3d-assets': {
    title: '3D Assets',
    description: '1344 royalty-free 3D assets for web, games, and visual storytelling.',
    totalCount: 1344,
    heroImage: 'https://ext.same-assets.com/1519585551/4004466925.jpeg',
    filters: ['All products', 'AI', 'Animated', 'Business', 'Characters', 'Crypto', 'Ecommerce', 'Education', 'Finance'],
    products: [
      {
        id: 1,
        title: "Abstract Fluffy 3D Assets",
        type: "3d-asset",
        thumbnail: "https://ext.same-assets.com/1519585551/2670651636.webp",
        author: "tridimensi.pro",
        price: 89,
        badge: "3D Assets",
        badgeColor: "bg-purple-600"
      },
      {
        id: 2,
        title: "Banking 3D Icon Set",
        type: "3d-asset",
        thumbnail: "https://ext.same-assets.com/1519585551/4072616059.webp",
        author: "Wily",
        price: 19,
        badge: "3D Assets",
        badgeColor: "bg-purple-600"
      },
      {
        id: 3,
        title: "eCommerce 3D Icon Bundle",
        type: "3d-asset",
        thumbnail: "https://ext.same-assets.com/1519585551/397512238.webp",
        author: "Wily",
        price: 16,
        badge: "3D Assets",
        badgeColor: "bg-purple-600"
      },
      {
        id: 4,
        title: "Bratwurst & Pretzel 3D Icon Set",
        type: "3d-asset",
        thumbnail: "https://ext.same-assets.com/1519585551/3945300535.webp",
        author: "Eklip Studio",
        price: 24,
        badge: "3D Assets",
        badgeColor: "bg-purple-600"
      },
      {
        id: 5,
        title: "Safety & Security 3D Icon Set",
        type: "3d-asset",
        thumbnail: "https://ext.same-assets.com/1519585551/935557652.webp",
        author: "Eklip Studio",
        price: 24,
        badge: "3D Assets",
        badgeColor: "bg-purple-600"
      },
      {
        id: 6,
        title: "Food & Drink 3D Icon Illustrations",
        type: "3d-asset",
        thumbnail: "https://ext.same-assets.com/1519585551/490774211.webp",
        author: "DP Black",
        price: 13,
        badge: "3D Assets",
        badgeColor: "bg-purple-600"
      }
    ]
  },
  'ui-kits': {
    title: 'UI Kits',
    description: '4,874 professional UI kits for web and mobile applications.',
    totalCount: 4874,
    heroImage: 'https://ext.same-assets.com/1519585551/815532373.jpeg',
    filters: ['All products', 'Mobile', 'Web', 'Dashboard', 'E-commerce', 'Finance', 'Travel', 'Health'],
    products: [
      {
        id: 1,
        title: "NexaMart - AI Ecommerce Mobile App UI Kit",
        type: "ui-kit",
        thumbnail: "https://ext.same-assets.com/1519585551/1957131621.webp",
        author: "Orbit Studio 2.0",
        price: 34,
        badge: "UI Kits",
        badgeColor: "bg-blue-600"
      },
      {
        id: 2,
        title: "Freedoom – Part Time Job Finder App UI Kit",
        type: "ui-kit",
        thumbnail: "https://ext.same-assets.com/1519585551/1366248137.webp",
        author: "creliq",
        price: 99,
        badge: "UI Kits",
        badgeColor: "bg-blue-600"
      },
      {
        id: 3,
        title: "Reales - Real Estate App UI Kit",
        type: "ui-kit",
        thumbnail: "https://ext.same-assets.com/1519585551/3459819221.webp",
        author: "Flow Forge",
        price: 24,
        badge: "UI Kits",
        badgeColor: "bg-blue-600"
      }
    ]
  },
  'mockups': {
    title: 'Mockups',
    description: '730 professional mockups for showcasing your designs.',
    totalCount: 730,
    heroImage: 'https://ext.same-assets.com/1519585551/815532373.jpeg',
    filters: ['All products', 'iPhone', 'Android', 'MacBook', 'iPad', 'Desktop', 'Branding'],
    products: [
      {
        id: 1,
        title: "iPhone 17 Pro Max Mockup | Vector Figma",
        type: "mockup",
        thumbnail: "https://ext.same-assets.com/1519585551/4147996209.webp",
        author: "Mrayan Design",
        price: 7,
        badge: "Mockups",
        badgeColor: "bg-green-600"
      },
      {
        id: 2,
        title: "3D App Icon 12 Logo Mockups",
        type: "mockup",
        thumbnail: "https://ext.same-assets.com/1519585551/1096406858.webp",
        author: "Asylab",
        price: 14,
        badge: "Mockups",
        badgeColor: "bg-green-600"
      }
    ]
  }
};

interface CategoryPageClientProps {
  slug: string;
}

export default function CategoryPageClient({ slug }: CategoryPageClientProps) {
  const [activeFilter, setActiveFilter] = useState('All products');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const categoryInfo = categoryData[slug];

  useEffect(() => {
    if (categoryInfo) {
      // Filter products based on active filter
      if (activeFilter === 'All products') {
        setFilteredProducts(categoryInfo.products);
      } else {
        // Simple filter simulation - in real app this would be more sophisticated
        setFilteredProducts(categoryInfo.products);
      }
    }
  }, [categoryInfo, activeFilter]);

  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-[#161617]">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh] text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category not found</h1>
            <p className="text-gray-400">The category "{slug}" does not exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161617]">
      <Header />

      {/* Category Hero Section */}
      <section className="relative py-20 px-4">
        {/* Hero background image */}
        <div className="absolute inset-0">
          <Image
            src={categoryInfo.heroImage}
            alt={categoryInfo.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {categoryInfo.title}
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {categoryInfo.description}
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
            <div className="flex justify-center mb-12 overflow-x-auto">
              <TabsList className="bg-transparent border-none p-0 space-x-4 flex-nowrap">
                {categoryInfo.filters.map((filter) => (
                  <TabsTrigger
                    key={filter}
                    value={filter}
                    className="bg-transparent text-gray-400 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-2 rounded-full border border-gray-600 data-[state=active]:border-blue-600 transition-all whitespace-nowrap"
                  >
                    {filter}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeFilter} className="mt-0">
              <ProductGrid products={filteredProducts} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* View More Button */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto text-center">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg"
          >
            View more
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto text-center py-16">
        <p className="text-gray-400 text-lg">No products found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="bg-[#1a1a1a] border-gray-800 overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        {product.badge && (
          <div className="absolute top-3 left-3">
            <Badge className={`${product.badgeColor} text-white text-xs px-2 py-1`}>
              {product.badge}
            </Badge>
          </div>
        )}

        {product.discount && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-red-600 text-white text-xs px-2 py-1">
              {product.discount}
            </Badge>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Action buttons on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Heart className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {product.title}
        </h3>

        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-600 rounded-full" />
            {product.author}
          </span>
          {product.downloads && (
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {product.downloads.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {product.price ? (
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">${product.price}</span>
              {product.originalPrice && (
                <span className="text-gray-500 line-through text-sm">${product.originalPrice}</span>
              )}
            </div>
          ) : (
            <Badge className="bg-blue-600 text-white">All-Access</Badge>
          )}

          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-4">
            Add to cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
