"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  Filter,
  X,
  Grid3X3,
  List,
  Search
} from 'lucide-react';
import { useResponsive, useMobileNavigation } from '@/hooks/useResponsive';
import { cn } from '@/styles/component-variants';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface Filters {
  format: string[];
  sortBy: string;
  priceRange: [number, number];
  authors: string[];
}

interface CategoryFiltersProps {
  currentFilters: Filters;
  onFiltersChange: (filters: Filters) => void;
  productCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function CategoryFilters({
  currentFilters,
  onFiltersChange,
  productCount,
  viewMode,
  onViewModeChange
}: CategoryFiltersProps) {
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Format options based on real data
  const formatOptions: FilterOption[] = [
    { id: 'figma', label: 'Figma', count: 1247 },
    { id: 'sketch', label: 'Sketch', count: 892 },
    { id: 'adobe-xd', label: 'Adobe XD', count: 634 },
    { id: 'photoshop', label: 'Photoshop', count: 523 },
    { id: 'png', label: 'PNG', count: 1891 },
    { id: 'svg', label: 'SVG', count: 756 },
    { id: 'ai', label: 'Adobe Illustrator', count: 445 },
    { id: 'pdf', label: 'PDF', count: 234 },
    { id: 'html', label: 'HTML/CSS', count: 189 },
    { id: 'react', label: 'React', count: 156 }
  ];

  // Sort options
  const sortOptions: FilterOption[] = [
    { id: 'popularity', label: 'Most Popular' },
    { id: 'newest', label: 'Newest' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'rating', label: 'Highest Rated' },
    { id: 'downloads', label: 'Most Downloaded' }
  ];

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.id === currentFilters.sortBy);
    return option?.label || 'Sort by';
  };

  const getActiveFormatCount = () => {
    return currentFilters.format.length;
  };

  const toggleFormat = (formatId: string) => {
    const newFormats = currentFilters.format.includes(formatId)
      ? currentFilters.format.filter(f => f !== formatId)
      : [...currentFilters.format, formatId];

    onFiltersChange({
      ...currentFilters,
      format: newFormats
    });
  };

  const updateSort = (sortId: string) => {
    onFiltersChange({
      ...currentFilters,
      sortBy: sortId
    });
    setShowSortDropdown(false);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      format: [],
      sortBy: 'popularity',
      priceRange: [0, 1000],
      authors: []
    });
  };

  const hasActiveFilters = currentFilters.format.length > 0 ||
                          currentFilters.authors.length > 0 ||
                          currentFilters.sortBy !== 'popularity';

  const { isMobile, isTablet } = useResponsive();

  return (
    <div className="bg-ui8-surface border-b border-ui8-border">
      <div className="container-ui8 py-4">
        <div className={cn(
          "flex items-center justify-between space-y-4 lg:space-y-0",
          isMobile ? "flex-col space-y-4" : "flex-row"
        )}>
          {/* Left side - Filters and Results */}
          <div className={cn(
            "flex items-center space-x-2 sm:space-x-4",
            isMobile ? "flex-wrap gap-2" : ""
          )}>
            {/* Format Filter Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                Format
                {getActiveFormatCount() > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white text-xs">
                    {getActiveFormatCount()}
                  </Badge>
                )}
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>

              {showFormatDropdown && (
                <div className={cn(
                  "absolute top-full mt-2 bg-ui8-surface border border-ui8-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto",
                  isMobile ? "left-0 right-0 w-auto" : "left-0 w-64"
                )}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">File Format</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFormatDropdown(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {formatOptions.map((format) => (
                        <label
                          key={format.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-700 cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={currentFilters.format.includes(format.id)}
                              onChange={() => toggleFormat(format.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-300">{format.label}</span>
                          </div>
                          {format.count && (
                            <span className="text-gray-500 text-sm">{format.count}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters Button */}
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              More filters
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4 mr-2" />
                Clear all
              </Button>
            )}

            {/* Results Count */}
            <div className="text-gray-400 text-sm">
              {productCount.toLocaleString()} results
            </div>
          </div>

          {/* Right side - Sort and View Mode */}
          <div className={cn(
            "flex items-center space-x-2 sm:space-x-4",
            isMobile ? "w-full justify-between" : ""
          )}>
            {/* Sort Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 min-w-[140px] justify-between"
              >
                {getSortLabel()}
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>

              {showSortDropdown && (
                <div className={cn(
                  "absolute top-full mt-2 bg-ui8-surface border border-ui8-border rounded-lg shadow-xl z-50",
                  isMobile ? "left-0 right-0 w-auto" : "right-0 w-48"
                )}>
                  <div className="py-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => updateSort(option.id)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                          currentFilters.sortBy === option.id
                            ? 'text-blue-400 bg-gray-700/50'
                            : 'text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-600 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`border-0 rounded-none ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={`border-0 rounded-none ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-800">
            <span className="text-gray-400 text-sm">Active filters:</span>

            {currentFilters.format.map((formatId) => {
              const format = formatOptions.find(f => f.id === formatId);
              return format ? (
                <Badge
                  key={formatId}
                  variant="secondary"
                  className="bg-blue-600/20 text-blue-400 border border-blue-600/50"
                >
                  {format.label}
                  <button
                    onClick={() => toggleFormat(formatId)}
                    className="ml-2 hover:text-blue-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ) : null;
            })}

            {currentFilters.sortBy !== 'popularity' && (
              <Badge
                variant="secondary"
                className="bg-green-600/20 text-green-400 border border-green-600/50"
              >
                {getSortLabel()}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showFormatDropdown || showSortDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFormatDropdown(false);
            setShowSortDropdown(false);
          }}
        />
      )}
    </div>
  );
}
