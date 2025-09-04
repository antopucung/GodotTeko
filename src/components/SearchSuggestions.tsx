'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Clock, TrendingUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchSuggestionsProps {
  query: string
  onSuggestionSelect: (suggestion: string) => void
  onClearHistory?: () => void
  isVisible?: boolean
}

interface SearchHistory {
  term: string
  count: number
  lastUsed: string
}

// Simple localStorage utilities
const STORAGE_KEY = 'godot-tekko-search-history'
const MAX_HISTORY_ITEMS = 10

const getSearchHistory = (): SearchHistory[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveSearchHistory = (history: SearchHistory[]): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Ignore localStorage errors
  }
}

const addToSearchHistory = (term: string): void => {
  if (!term.trim()) return

  const history = getSearchHistory()
  const existingIndex = history.findIndex(item => item.term.toLowerCase() === term.toLowerCase())

  if (existingIndex >= 0) {
    // Update existing entry
    history[existingIndex].count += 1
    history[existingIndex].lastUsed = new Date().toISOString()
  } else {
    // Add new entry
    history.unshift({
      term: term.trim(),
      count: 1,
      lastUsed: new Date().toISOString()
    })
  }

  // Keep only the most recent items, sorted by frequency and recency
  const sortedHistory = history
    .sort((a, b) => {
      // Primary sort: by count (frequency)
      if (b.count !== a.count) return b.count - a.count
      // Secondary sort: by recency
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    })
    .slice(0, MAX_HISTORY_ITEMS)

  saveSearchHistory(sortedHistory)
}

const clearSearchHistory = (): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore localStorage errors
  }
}

// Popular search suggestions (simple static list)
const POPULAR_SUGGESTIONS = [
  'UI Kit',
  'Mobile App',
  'Dashboard',
  'Landing Page',
  'Icons',
  'Illustrations',
  'Templates',
  'Mockups'
]

export default function SearchSuggestions({
  query,
  onSuggestionSelect,
  onClearHistory,
  isVisible = true
}: SearchSuggestionsProps) {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // Filter suggestions based on current query
  const filteredHistory = searchHistory.filter(item =>
    item.term.toLowerCase().includes(query.toLowerCase()) &&
    item.term.toLowerCase() !== query.toLowerCase()
  )

  const filteredPopular = POPULAR_SUGGESTIONS.filter(item =>
    item.toLowerCase().includes(query.toLowerCase()) &&
    item.toLowerCase() !== query.toLowerCase() &&
    !filteredHistory.some(h => h.term.toLowerCase() === item.toLowerCase())
  ).slice(0, 5) // Limit popular suggestions

  const allSuggestions = [
    ...filteredHistory.map(h => ({ text: h.term, type: 'recent' as const, count: h.count })),
    ...filteredPopular.map(p => ({ text: p, type: 'popular' as const }))
  ]

  // Handle suggestion selection
  const handleSelect = useCallback((suggestion: string) => {
    addToSearchHistory(suggestion)
    onSuggestionSelect(suggestion)
    setSelectedIndex(-1)
  }, [onSuggestionSelect])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isVisible || allSuggestions.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        )
        break

      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break

      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          event.preventDefault()
          handleSelect(allSuggestions[selectedIndex].text)
        }
        break

      case 'Escape':
        setSelectedIndex(-1)
        break
    }
  }, [isVisible, allSuggestions, selectedIndex, handleSelect])

  // Attach keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [query])

  // Handle clear history
  const handleClearHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
    onClearHistory?.()
  }

  // Don't show if no query or no suggestions
  if (!isVisible || !query.trim() || allSuggestions.length === 0) {
    return null
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
      {/* Recent Searches Section */}
      {filteredHistory.length > 0 && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Recent Searches
            </h4>
            {searchHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-1">
            {filteredHistory.map((item, index) => (
              <button
                key={`recent-${index}`}
                ref={el => { suggestionRefs.current[index] = el }}
                onClick={() => handleSelect(item.term)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between group ${
                  selectedIndex === index
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Search className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{item.term}</span>
                </div>
                {item.count > 1 && (
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {item.count}x
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Suggestions Section */}
      {filteredPopular.length > 0 && (
        <div className="p-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Popular Searches
          </h4>

          <div className="space-y-1">
            {filteredPopular.map((item, index) => {
              const suggestionIndex = filteredHistory.length + index
              return (
                <button
                  key={`popular-${index}`}
                  ref={el => { suggestionRefs.current[suggestionIndex] = el }}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
                    selectedIndex === suggestionIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="truncate">{item}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Keyboard Navigation Hint */}
      <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
        <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
      </div>
    </div>
  )
}

// Export utility functions for external use
export {
  addToSearchHistory,
  clearSearchHistory,
  getSearchHistory
}
