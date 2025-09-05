'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import SearchSuggestions, { addToSearchHistory } from '@/components/SearchSuggestions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  ChevronDown,
  Filter,
  X,
  Search,
  SlidersHorizontal,
  Calendar,
  Star,
  FileType,
  Monitor,
  Grid3X3,
  List,
  TrendingUp,
  Clock,
  Download,
  Heart,
  Sparkles
} from 'lucide-react'
import { SearchFilters, SortOption } from '@/types'
import { CATEGORIES } from '@/config/constants'

interface EnhancedSearchFiltersProps {
  initialFilters?: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onSearchResults?: (results: any) => void
  productCount?: number
  isLoading?: boolean
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  showViewToggle?: boolean
  searchParams?: URLSearchParams | null
}

export default function EnhancedSearchFilters({
  initialFilters = {},
  onFiltersChange,
  onSearchResults,
  productCount = 0,
  isLoading = false,
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = true,
  searchParams
}: EnhancedSearchFiltersProps) {
  const router = useRouter()

  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [searchQuery, setSearchQuery] = useState(initialFilters.query || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchInputFocused, setSearchInputFocused] = useState(false)

  // Available filter options
  const categoryOptions = useMemo(() =>
    Object.entries(CATEGORIES).map(([slug, config]) => ({
      value: slug,
      label: config.name,
      count: config.productCount
    }))
  , [])

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'relevance', label: 'Most Relevant', icon: <Sparkles className="w-4 h-4" /> },
    { value: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'newest', label: 'Newest First', icon: <Clock className="w-4 h-4" /> },
    { value: 'popular', label: 'Most Popular', icon: <Heart className="w-4 h-4" /> },
    { value: 'downloads', label: 'Most Downloaded', icon: <Download className="w-4 h-4" /> },
    { value: 'rating', label: 'Highest Rated', icon: <Star className="w-4 h-4" /> },
    { value: 'price_low', label: 'Price: Low to High', icon: <span className="text-xs">↑$</span> },
    { value: 'price_high', label: 'Price: High to Low', icon: <span className="text-xs">↓$</span> },
    { value: 'alphabetical', label: 'A-Z', icon: <span className="text-xs">Az</span> },
    { value: 'oldest', label: 'Oldest First', icon: <Calendar className="w-4 h-4" /> }
  ]

  const fileTypeOptions = [
    'figma', 'sketch', 'adobe-xd', 'photoshop', 'illustrator',
    'png', 'jpg', 'svg', 'pdf', 'ai', 'psd', 'html', 'css', 'react', 'vue'
  ]

  const compatibleSoftwareOptions = [
    'figma', 'sketch', 'adobe-xd', 'photoshop', 'illustrator',
    'after-effects', 'premiere-pro', 'framer', 'principle', 'invision'
  ]

  const ratingOptions = [
    { value: 4.5, label: '4.5+ stars' },
    { value: 4.0, label: '4.0+ stars' },
    { value: 3.5, label: '3.5+ stars' },
    { value: 3.0, label: '3.0+ stars' }
  ]

  // Handle search input with debouncing
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      const newFilters = { ...filters, query: query.trim() || undefined }
      setFilters(newFilters)
      onFiltersChange(newFilters)
      updateURL(newFilters)

      // Add to search history when user actually searches
      if (query.trim()) {
        addToSearchHistory(query.trim())
      }
    }, 300),
    [filters, onFiltersChange]
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    setSearchInputFocused(false)

    // Trigger immediate search without debounce
    const newFilters = { ...filters, query: suggestion.trim() }
    setFilters(newFilters)
    onFiltersChange(newFilters)
    updateURL(newFilters)
  }, [filters, onFiltersChange])

  // Initialize from URL params
  useEffect(() => {
    const urlFilters = parseFiltersFromURL()
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters)
      setSearchQuery(urlFilters.query || '')
      onFiltersChange(urlFilters)
    }
  }, [searchParams])

  const parseFiltersFromURL = (): SearchFilters => {
    const params = new URLSearchParams(searchParams.toString())
    return {
      query: params.get('query') || undefined,
      categories: params.get('categories')?.split(',').filter(Boolean) || undefined,
      sortBy: (params.get('sortBy') as SortOption) || 'relevance',
      featured: params.get('featured') === 'true' ? true :
                params.get('featured') === 'false' ? false : undefined,
      freebie: params.get('freebie') === 'true' ? true :
               params.get('freebie') === 'false' ? false : undefined,
      author: params.get('author') || undefined,
      priceRange: params.get('priceMin') && params.get('priceMax')
        ? [parseInt(params.get('priceMin')!), parseInt(params.get('priceMax')!)]
        : undefined,
      fileTypes: params.get('fileTypes')?.split(',').filter(Boolean) || undefined,
      compatibleWith: params.get('compatibleWith')?.split(',').filter(Boolean) || undefined,
      minRating: params.get('minRating') ? parseFloat(params.get('minRating')!) : undefined
    }
  }

  const updateURL = (newFilters: SearchFilters) => {
    const params = new URLSearchParams()

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','))
          }
        } else {
          params.set(key, String(value))
        }
      }
    })

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newURL, { scroll: false })
  }

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
    updateURL(newFilters)
  }

  const toggleArrayFilter = (key: 'categories' | 'fileTypes' | 'compatibleWith', value: string) => {
    const currentArray = filters[key] || []
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]

    updateFilter(key, newArray.length > 0 ? newArray : undefined)
  }

  const clearAllFilters = () => {
    const clearedFilters: SearchFilters = { sortBy: 'relevance' }
    setFilters(clearedFilters)
    setSearchQuery('')
    onFiltersChange(clearedFilters)
    router.replace(window.location.pathname, { scroll: false })
  }

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'sortBy') return value !== 'relevance'
      return value !== undefined && value !== null &&
             (!Array.isArray(value) || value.length > 0)
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.query) count++
    if (filters.categories?.length) count += filters.categories.length
    if (filters.featured !== undefined) count++
    if (filters.freebie !== undefined) count++
    if (filters.priceRange) count++
    if (filters.fileTypes?.length) count += filters.fileTypes.length
    if (filters.compatibleWith?.length) count += filters.compatibleWith.length
    if (filters.minRating) count++
    if (filters.author) count++
    return count
  }

  const getCurrentSortOption = () => {
    return sortOptions.find(option => option.value === (filters.sortBy || 'relevance'))
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6 z-10" />
            <Input
              type="text"
              placeholder="Search for UI kits, icons, templates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => {
                setSearchInputFocused(true)
                setShowSuggestions(true)
                setActiveDropdown(null) // Close other dropdowns
              }}
              onBlur={(e) => {
                // Delay hiding suggestions to allow for clicks
                setTimeout(() => {
                  if (!e.currentTarget.contains(document.activeElement)) {
                    setShowSuggestions(false)
                    setSearchInputFocused(false)
                  }
                }, 150)
              }}
              className="pl-12 sm:pl-14 pr-12 sm:pr-16 py-4 sm:py-3 text-base sm:text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 relative z-10 rounded-lg shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  updateFilter('query', undefined)
                  setShowSuggestions(false)
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-20"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Search Suggestions */}
            {showSuggestions && searchInputFocused && (
              <SearchSuggestions
                query={searchQuery}
                onSuggestionSelect={handleSuggestionSelect}
                isVisible={showSuggestions}
              />
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant={filters.featured ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('featured', filters.featured ? undefined : true)}
              className="whitespace-nowrap h-10 sm:h-9 px-4 sm:px-3 text-sm font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Featured
            </Button>

            <Button
              variant={filters.freebie ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('freebie', filters.freebie ? undefined : true)}
              className="whitespace-nowrap h-10 sm:h-9 px-4 sm:px-3 text-sm font-medium"
            >
              Free
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          {/* Left Side - Filters */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Categories Filter */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setActiveDropdown(activeDropdown === 'categories' ? null : 'categories')}
                className="min-w-[120px] sm:min-w-[140px] justify-between h-10 sm:h-9 px-4 sm:px-3 text-sm"
              >
                Categories
                {filters.categories?.length && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.categories.length}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>

              {activeDropdown === 'categories' && (
                <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {categoryOptions.map((category) => (
                        <label key={category.value} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.categories?.includes(category.value) || false}
                            onChange={() => toggleArrayFilter('categories', category.value)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{category.label}</span>
                          <span className="text-xs text-gray-500 ml-auto">{category.count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="min-w-[140px] sm:min-w-[160px] justify-between h-10 sm:h-9 px-4 sm:px-3 text-sm"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Advanced
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Clear all
              </Button>
            )}

            {/* Results Count */}
            <div className="text-sm text-gray-600 flex items-center">
              {isLoading ? (
                <span className="animate-pulse">Searching...</span>
              ) : (
                <>
                  <span className="font-medium">{productCount.toLocaleString()}</span>
                  <span className="ml-1">results found</span>
                </>
              )}
            </div>
          </div>

          {/* Right Side - Sort and View */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                className="min-w-[160px] justify-between"
              >
                <div className="flex items-center">
                  {getCurrentSortOption()?.icon}
                  <span className="ml-2">{getCurrentSortOption()?.label}</span>
                </div>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>

              {activeDropdown === 'sort' && (
                <div className="absolute top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          updateFilter('sortBy', option.value)
                          setActiveDropdown(null)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center ${
                          filters.sortBy === option.value
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700'
                        }`}
                      >
                        {option.icon}
                        <span className="ml-3">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            {showViewToggle && onViewModeChange && (
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="border-0 rounded-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className="border-0 rounded-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Range */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Price Range</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange?.[0] || ''}
                      onChange={(e) => {
                        const min = parseInt(e.target.value) || 0
                        const max = filters.priceRange?.[1] || 1000
                        updateFilter('priceRange', min >= 0 ? [min, max] : undefined)
                      }}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange?.[1] || ''}
                      onChange={(e) => {
                        const max = parseInt(e.target.value) || 1000
                        const min = filters.priceRange?.[0] || 0
                        updateFilter('priceRange', max > 0 ? [min, max] : undefined)
                      }}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Minimum Rating</Label>
                <Select
                  value={filters.minRating?.toString() || ''}
                  onValueChange={(value) => updateFilter('minRating', value ? parseFloat(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any rating</SelectItem>
                    {ratingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Types */}
              <div>
                <Label className="text-sm font-medium mb-2 block">File Types</Label>
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setActiveDropdown(activeDropdown === 'fileTypes' ? null : 'fileTypes')}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <FileType className="w-4 h-4 mr-2" />
                      {filters.fileTypes?.length ? `${filters.fileTypes.length} selected` : 'Any format'}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {activeDropdown === 'fileTypes' && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        {fileTypeOptions.map((fileType) => (
                          <label key={fileType} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.fileTypes?.includes(fileType) || false}
                              onChange={() => toggleArrayFilter('fileTypes', fileType)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm capitalize">{fileType}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compatible Software */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Compatible With</Label>
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setActiveDropdown(activeDropdown === 'compatible' ? null : 'compatible')}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <Monitor className="w-4 h-4 mr-2" />
                      {filters.compatibleWith?.length ? `${filters.compatibleWith.length} selected` : 'Any software'}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {activeDropdown === 'compatible' && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        {compatibleSoftwareOptions.map((software) => (
                          <label key={software} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.compatibleWith?.includes(software) || false}
                              onChange={() => toggleArrayFilter('compatibleWith', software)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm capitalize">{software.replace('-', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Active filters:</span>

            {filters.query && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Search: "{filters.query}"
                <button
                  onClick={() => {
                    setSearchQuery('')
                    updateFilter('query', undefined)
                  }}
                  className="ml-2 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.categories?.map((category) => {
              const categoryData = categoryOptions.find(c => c.value === category)
              return (
                <Badge key={category} variant="secondary" className="bg-purple-100 text-purple-800">
                  {categoryData?.label}
                  <button
                    onClick={() => toggleArrayFilter('categories', category)}
                    className="ml-2 hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
            })}

            {filters.featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Featured
                <button
                  onClick={() => updateFilter('featured', undefined)}
                  className="ml-2 hover:text-yellow-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.freebie && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Free
                <button
                  onClick={() => updateFilter('freebie', undefined)}
                  className="ml-2 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.priceRange && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                ${filters.priceRange[0]} - ${filters.priceRange[1]}
                <button
                  onClick={() => updateFilter('priceRange', undefined)}
                  className="ml-2 hover:text-orange-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.minRating && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {filters.minRating}+ stars
                <button
                  onClick={() => updateFilter('minRating', undefined)}
                  className="ml-2 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(activeDropdown || showSuggestions) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setActiveDropdown(null)
            setShowSuggestions(false)
            setSearchInputFocused(false)
          }}
        />
      )}
    </div>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
