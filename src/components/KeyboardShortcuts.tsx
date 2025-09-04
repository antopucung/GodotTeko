'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Keyboard, Zap, Grid, Search, Navigation, X } from 'lucide-react'
import { useKeyboardNavigation, KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardNavigation'
import { cn } from '@/lib/utils'

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsProps) {
  const shortcutGroups = [
    {
      title: 'Navigation',
      icon: <Navigation className="w-4 h-4" />,
      shortcuts: [
        { key: 'Cmd/Ctrl + H', description: 'Go to homepage' },
        { key: 'Cmd/Ctrl + P', description: 'Browse products' },
        { key: 'Cmd/Ctrl + C', description: 'View categories' },
        { key: 'Cmd/Ctrl + D', description: 'Open dashboard' },
        { key: 'Cmd/Ctrl + B', description: 'View cart' },
        { key: 'Cmd/Ctrl + R', description: 'Refresh page' }
      ]
    },
    {
      title: 'Search & Actions',
      icon: <Search className="w-4 h-4" />,
      shortcuts: [
        { key: '/', description: 'Focus search' },
        { key: 'L', description: 'Like/unlike item' },
        { key: 'A', description: 'Add to cart' },
        { key: 'Q', description: 'Quick view' },
        { key: 'Enter', description: 'Open/download item' }
      ]
    },
    {
      title: 'Grid Navigation',
      icon: <Grid className="w-4 h-4" />,
      shortcuts: [
        { key: '← →', description: 'Move between items' },
        { key: '↑ ↓', description: 'Move between rows' },
        { key: 'Tab', description: 'Navigate focusable elements' },
        { key: 'Space', description: 'Activate buttons' }
      ]
    },
    {
      title: 'Interface',
      icon: <Zap className="w-4 h-4" />,
      shortcuts: [
        { key: '?', description: 'Show this help' },
        { key: 'Escape', description: 'Close modals/cancel' },
        { key: 'Cmd/Ctrl + K', description: 'Open command palette' },
        { key: 'T', description: 'Toggle theme' }
      ]
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate faster and boost your productivity
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {shortcutGroups.map((group, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {group.icon}
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.shortcuts.map((shortcut, shortcutIndex) => (
                  <div key={shortcutIndex} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <KeyCombo keys={shortcut.key} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Pro Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Most navigation shortcuts require Cmd (Mac) or Ctrl (Windows/Linux)</li>
                <li>• Grid navigation works on product listings and search results</li>
                <li>• Press Tab to navigate through interactive elements in order</li>
                <li>• Use Escape to quickly close any open modals or cancel actions</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => onOpenChange(false)}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Component to display keyboard shortcut combinations
function KeyCombo({ keys }: { keys: string }) {
  const keyParts = keys.split(' + ').map(part => part.trim())

  return (
    <div className="flex items-center gap-1">
      {keyParts.map((key, index) => (
        <React.Fragment key={index}>
          <Badge
            variant="outline"
            className="px-2 py-1 text-xs font-mono bg-gray-50 border-gray-300"
          >
            {key}
          </Badge>
          {index < keyParts.length - 1 && (
            <span className="text-gray-400 text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Global keyboard navigation wrapper component
interface KeyboardNavigationProviderProps {
  children: React.ReactNode
  enableGlobalShortcuts?: boolean
  enableGridNavigation?: boolean
  className?: string
}

export function KeyboardNavigationProvider({
  children,
  enableGlobalShortcuts = true,
  enableGridNavigation = false,
  className
}: KeyboardNavigationProviderProps) {
  const { isHelpVisible, setIsHelpVisible } = useKeyboardNavigation({
    enableGlobalShortcuts,
    enableGridNavigation
  })

  return (
    <div
      className={cn('keyboard-navigation-provider', className)}
      role="application"
      aria-label="Godot Tekko Marketplace with keyboard navigation"
    >
      {children}

      <KeyboardShortcutsModal
        open={isHelpVisible}
        onOpenChange={setIsHelpVisible}
      />

      {/* Accessibility announcements */}
      <div
        id="keyboard-nav-announcements"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  )
}

// Grid navigation wrapper for product grids
interface GridNavigationWrapperProps {
  children: React.ReactNode
  totalItems: number
  columns: number
  onSelectionChange?: (index: number) => void
  className?: string
}

export function GridNavigationWrapper({
  children,
  totalItems,
  columns,
  onSelectionChange,
  className
}: GridNavigationWrapperProps) {
  return (
    <div
      className={cn('grid-navigation-wrapper', className)}
      role="grid"
      aria-label={`Product grid with ${totalItems} items`}
      tabIndex={0}
    >
      {children}
    </div>
  )
}

// Individual grid item wrapper
interface GridItemWrapperProps {
  children: React.ReactNode
  index: number
  onActivate?: () => void
  className?: string
}

export function GridItemWrapper({
  children,
  index,
  onActivate,
  className
}: GridItemWrapperProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate?.()
    }
  }

  return (
    <div
      className={cn('grid-item-wrapper', className)}
      role="gridcell"
      tabIndex={-1}
      data-keyboard-nav-item
      data-index={index}
      onKeyDown={handleKeyDown}
      aria-label={`Product item ${index + 1}`}
    >
      {children}
    </div>
  )
}

// Command palette component
interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('')

  const commands = [
    { id: 'home', title: 'Go Home', shortcut: 'Cmd+H' },
    { id: 'products', title: 'Browse Products', shortcut: 'Cmd+P' },
    { id: 'categories', title: 'View Categories', shortcut: 'Cmd+C' },
    { id: 'dashboard', title: 'My Dashboard', shortcut: 'Cmd+D' },
    { id: 'cart', title: 'Shopping Cart', shortcut: 'Cmd+B' },
    { id: 'search', title: 'Search Products', shortcut: '/' },
    { id: 'help', title: 'Keyboard Shortcuts', shortcut: '?' }
  ]

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
          <DialogDescription>
            Type to search for actions and navigate quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filteredCommands.map((command, index) => (
              <div
                key={command.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  // Execute command
                  onOpenChange(false)
                  setQuery('')
                }}
              >
                <span className="text-sm">{command.title}</span>
                <KeyCombo keys={command.shortcut} />
              </div>
            ))}

            {filteredCommands.length === 0 && query && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No actions found for "{query}"
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Keyboard navigation status indicator
export function KeyboardNavigationStatus() {
  const [showIndicator, setShowIndicator] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setShowIndicator(true)
      }
    }

    const handleMouseDown = () => {
      setShowIndicator(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg">
      <Keyboard className="w-4 h-4 inline mr-1" />
      Keyboard navigation active
    </div>
  )
}
