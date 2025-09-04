"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface Category {
  _id: string
  name: string
  slug: { current: string }
  description?: string
}

interface CategoryNavigationProps {
  currentCategory: Category | null;
  allCategories: Category[];
}

export default function CategoryNavigation({
  currentCategory,
  allCategories
}: CategoryNavigationProps) {
  const params = useParams();
  const currentSlug = params?.slug as string;
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Get related categories for navigation
  const getNavigationCategories = () => {
    // Always show "All products" first
    const navCategories = [
      {
        id: 'all',
        name: 'All products',
        slug: '',
        productCount: 0, // TODO: calculate total products across categories
        description: 'Browse all available products'
      }
    ];

    if (!currentCategory) return navCategories;

    // Add main content types
    const mainTypes = allCategories.filter(cat =>
      cat.slug?.current && ['assets', 'games', 'tools', 'starter-kits'].includes(cat.slug.current)
    );

    // Add asset formats if we're in assets
    if (currentCategory.slug.current === 'assets') {
      const assetFormats = allCategories.filter(cat =>
        cat.slug?.current && ['2d-graphics', '3d-models', 'user-interface', 'audio', 'pixel-art', 'textures'].includes(cat.slug.current)
      );
      navCategories.push(...assetFormats.map(cat => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug.current,
        productCount: 0, // TODO: implement product count
        description: cat.description || ''
      })));
    } else {
      navCategories.push(...mainTypes.map(cat => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug.current,
        productCount: 0, // TODO: implement product count
        description: cat.description || ''
      })));
    }

    // Add collections
    const collections = allCategories.filter(cat =>
      cat.slug?.current?.includes('-collection')
    );
    navCategories.push(...collections.slice(0, 3).map(cat => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug.current,
      productCount: 0, // TODO: implement product count
      description: cat.description || ''
    })));

    return navCategories;
  };

  const navigationCategories = getNavigationCategories();

  // Check scroll position
  const checkScroll = (element: HTMLElement) => {
    setShowLeftScroll(element.scrollLeft > 0);
    setShowRightScroll(
      element.scrollLeft < element.scrollWidth - element.clientWidth
    );
  };

  useEffect(() => {
    const scrollContainer = document.getElementById('category-nav-scroll');
    if (scrollContainer) {
      checkScroll(scrollContainer);

      const handleScroll = () => checkScroll(scrollContainer);
      scrollContainer.addEventListener('scroll', handleScroll);

      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [navigationCategories]);

  const scroll = (direction: 'left' | 'right') => {
    const scrollContainer = document.getElementById('category-nav-scroll');
    if (scrollContainer) {
      const scrollAmount = 200;
      scrollContainer.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative bg-[#161717] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {/* Left scroll button */}
          {showLeftScroll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('left')}
              className="absolute left-0 z-10 bg-[#161717]/90 backdrop-blur-sm text-gray-400 hover:text-white border-r border-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}

          {/* Scrollable category navigation */}
          <div
            id="category-nav-scroll"
            className="flex overflow-x-auto scrollbar-hide py-4 space-x-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {navigationCategories.map((category) => {
              const isActive = category.slug === currentSlug ||
                             (category.slug === '' && !currentSlug);

              const href = category.slug === '' ? '/' : `/category/${category.slug}`;

              return (
                <Link
                  key={category.id}
                  href={href}
                  className="flex-shrink-0"
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`
                      px-4 py-2 rounded-full whitespace-nowrap transition-all
                      ${isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    <span className="font-medium">{category.name}</span>
                    {category.productCount > 0 && (
                      <Badge
                        variant="secondary"
                        className={`ml-2 text-xs ${
                          isActive
                            ? 'bg-blue-700 text-blue-100'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {category.productCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right scroll button */}
          {showRightScroll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('right')}
              className="absolute right-0 z-10 bg-[#161717]/90 backdrop-blur-sm text-gray-400 hover:text-white border-l border-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <style jsx>{`
        #category-nav-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
