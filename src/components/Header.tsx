'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ShoppingCart, ChevronDown, User, GraduationCap, PlayCircle, Crown, Users, LogOut, Download, Heart, Grid, Package, FileText, Image as ImageIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const BROWSE_CATEGORIES = [
  {
    name: 'UI Kits',
    href: '/category/ui-kits',
    icon: <Grid className="w-4 h-4" />,
    count: '4,874',
    featured: true
  },
  {
    name: '3D Assets',
    href: '/category/3d-assets',
    icon: <Package className="w-4 h-4" />,
    count: '1,344',
    featured: true
  },
  {
    name: 'Illustrations',
    href: '/category/illustrations',
    icon: <ImageIcon className="w-4 h-4" />,
    count: '2,156',
    featured: false
  },
  {
    name: 'Mockups',
    href: '/category/mockups',
    icon: <Download className="w-4 h-4" />,
    count: '730',
    featured: false
  },
  {
    name: 'Coded Templates',
    href: '/category/coded-templates',
    icon: <FileText className="w-4 h-4" />,
    count: '892',
    featured: false
  },
  {
    name: 'Wireframe Kits',
    href: '/category/wireframe-kits',
    icon: <Grid className="w-4 h-4" />,
    count: '345',
    featured: false
  }
]

const POPULAR_SEARCHES = [
  'UI Kit', 'Mobile App', 'Dashboard', 'Landing Page', 'Icons', 'Illustrations', 'Templates', 'Mockups'
]

export function Header() {
  const { data: session } = useSession()
  const [showBrowseDropdown, setShowBrowseDropdown] = useState(false)
  const [showSearchPopup, setShowSearchPopup] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Load search history on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('godot-tekko-search-history')
      if (saved) {
        try {
          setSearchHistory(JSON.parse(saved))
        } catch (e) {
          setSearchHistory([])
        }
      }
    }
  }, [])

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchPopup(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addToSearchHistory = (query: string) => {
    if (!query.trim()) return

    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5)
    setSearchHistory(newHistory)

    if (typeof window !== 'undefined') {
      localStorage.setItem('godot-tekko-search-history', JSON.stringify(newHistory))
    }
  }

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      addToSearchHistory(query.trim())
      setShowSearchPopup(false)
      // Navigate to search results
      window.location.href = `/products/browse?query=${encodeURIComponent(query.trim())}`
    }
  }

  const filteredSuggestions = POPULAR_SEARCHES.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase()) &&
    item.toLowerCase() !== searchQuery.toLowerCase()
  ).slice(0, 3)

  const filteredHistory = searchHistory.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase()) &&
    item.toLowerCase() !== searchQuery.toLowerCase()
  ).slice(0, 3)

  return (
    <header className="border-b border-gray-800 bg-[#161617] relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-white">
                Godot Tekko
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {/* Browse Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrowseDropdown(!showBrowseDropdown)}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                Browse
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>

              {showBrowseDropdown && (
                <div className="absolute top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {BROWSE_CATEGORIES.map((category) => (
                        <Link
                          key={category.href}
                          href={category.href}
                          onClick={() => setShowBrowseDropdown(false)}
                          className="flex items-center p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors group"
                        >
                          <div className="mr-3 text-blue-400 group-hover:text-blue-300">
                            {category.icon}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{category.name}</div>
                            <div className="text-xs text-gray-500">{category.count} items</div>
                          </div>
                          {category.featured && (
                            <Badge className="bg-blue-600 text-white text-xs ml-2">HOT</Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <Link
                        href="/products/browse"
                        onClick={() => setShowBrowseDropdown(false)}
                        className="block text-center text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View all categories →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/learn" className="flex items-center text-gray-300 hover:text-white transition-colors group">
              <GraduationCap className="w-4 h-4 mr-2 text-green-400 group-hover:text-green-300" />
              Learn
            </Link>
            <Link href="/play-station" className="flex items-center text-gray-300 hover:text-white transition-colors group">
              <PlayCircle className="w-4 h-4 mr-2 text-orange-400 group-hover:text-orange-300" />
              GameStation
            </Link>
            <Link href="/all-access" className="flex items-center text-gray-300 hover:text-white transition-colors group">
              <Crown className="w-4 h-4 mr-2 text-blue-400 group-hover:text-blue-300" />
              All-Access
            </Link>
            <Link href="/become-partner" className="flex items-center text-gray-300 hover:text-white transition-colors group">
              <Users className="w-4 h-4 mr-2 text-purple-400 group-hover:text-purple-300" />
              Partner
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button/Popup */}
            <div className="relative" ref={searchRef}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowSearchPopup(!showSearchPopup)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Search Popup */}
              {showSearchPopup && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-50">
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    handleSearchSubmit(searchQuery)
                  }}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </form>

                  {/* Search Suggestions */}
                  {(searchQuery.length > 0 || searchHistory.length > 0) && (
                    <div className="mt-3">
                      {/* Recent Searches */}
                      {filteredHistory.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                            Recent Searches
                          </h4>
                          <div className="space-y-1">
                            {filteredHistory.map((item, index) => (
                              <button
                                key={index}
                                onClick={() => handleSearchSubmit(item)}
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors flex items-center"
                              >
                                <Search className="w-4 h-4 mr-3 text-gray-400" />
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Popular Suggestions */}
                      {filteredSuggestions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                            Popular Searches
                          </h4>
                          <div className="space-y-1">
                            {filteredSuggestions.map((item, index) => (
                              <button
                                key={index}
                                onClick={() => handleSearchSubmit(item)}
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors flex items-center"
                              >
                                <Search className="w-4 h-4 mr-3 text-gray-400" />
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>

            {/* Profile/Auth Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 w-56">
                {session ? (
                  <>
                    <div className="px-3 py-2 border-b border-gray-700">
                      <div className="text-sm font-medium text-white">{session.user?.name}</div>
                      <div className="text-xs text-gray-400">{session.user?.email}</div>
                    </div>
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <Link href="/user/profile" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <Link href="/user/dashboard" className="flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        Downloads
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <Link href="/dashboard" className="flex items-center">
                        <Heart className="w-4 h-4 mr-2" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => signIn()}
                      className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                    >
                      Sign in
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <Link href="/auth/signup">
                        Sign up
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Overlay to close dropdowns */}
      {showBrowseDropdown && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setShowBrowseDropdown(false)}
        />
      )}
    </header>
  )
}
