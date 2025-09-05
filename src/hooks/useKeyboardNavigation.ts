'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  home: { key: 'h', description: 'Go to homepage' },
  products: { key: 'p', description: 'Browse products' },
  categories: { key: 'c', description: 'View categories' },
  dashboard: { key: 'd', description: 'Open dashboard' },
  cart: { key: 'b', description: 'View cart (shopping bag)' },
  search: { key: '/', description: 'Focus search' },

  // Actions
  like: { key: 'l', description: 'Like/unlike current item' },
  addToCart: { key: 'a', description: 'Add to cart' },
  quickView: { key: 'q', description: 'Quick view product' },
  download: { key: 'enter', description: 'Download/view item' },

  // Interface
  toggleTheme: { key: 't', description: 'Toggle theme' },
  showHelp: { key: '?', description: 'Show keyboard shortcuts' },
  escape: { key: 'escape', description: 'Close modals/cancel' },

  // Grid navigation
  nextItem: { key: 'arrowright', description: 'Next item' },
  prevItem: { key: 'arrowleft', description: 'Previous item' },
  nextRow: { key: 'arrowdown', description: 'Next row' },
  prevRow: { key: 'arrowup', description: 'Previous row' },

  // Quick actions
  refresh: { key: 'r', description: 'Refresh page' },
  back: { key: 'backspace', description: 'Go back' },
  forward: { key: 'shift+backspace', description: 'Go forward' }
} as const

export type ShortcutKey = keyof typeof KEYBOARD_SHORTCUTS

interface KeyboardNavigationOptions {
  enableGlobalShortcuts?: boolean
  enableGridNavigation?: boolean
  enableSearch?: boolean
  contextActions?: Record<string, () => void>
  disabled?: boolean
}

interface GridNavigationState {
  focusedIndex: number
  totalItems: number
  columns: number
  rows: number
}

// Main keyboard navigation hook
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    enableGlobalShortcuts = true,
    enableGridNavigation = false,
    enableSearch = true,
    contextActions = {},
    disabled = false
  } = options

  const router = useRouter()
  const [isHelpVisible, setIsHelpVisible] = useState(false)
  const [gridState, setGridState] = useState<GridNavigationState>({
    focusedIndex: -1,
    totalItems: 0,
    columns: 0,
    rows: 0
  })

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event
    const modifierKey = ctrlKey || metaKey
    const target = event.target as HTMLElement

    // Don't interfere with form inputs (unless it's the search shortcut)
    const isFormElement = target.tagName === 'INPUT' ||
                         target.tagName === 'TEXTAREA' ||
                         target.contentEditable === 'true'

    if (isFormElement && key !== '/' && key !== 'Escape') {
      return
    }

    // Global shortcuts (with Cmd/Ctrl modifier)
    if (enableGlobalShortcuts && modifierKey) {
      switch (key.toLowerCase()) {
        case KEYBOARD_SHORTCUTS.home.key:
          event.preventDefault()
          router.push('/')
          break
        case KEYBOARD_SHORTCUTS.products.key:
          event.preventDefault()
          router.push('/products')
          break
        case KEYBOARD_SHORTCUTS.categories.key:
          event.preventDefault()
          router.push('/categories')
          break
        case KEYBOARD_SHORTCUTS.dashboard.key:
          event.preventDefault()
          router.push('/user/dashboard')
          break
        case KEYBOARD_SHORTCUTS.cart.key:
          event.preventDefault()
          router.push('/cart')
          break
        case KEYBOARD_SHORTCUTS.refresh.key:
          event.preventDefault()
          window.location.reload()
          break
      }
      return
    }

    // Single key shortcuts (no modifier)
    if (!modifierKey && !altKey && !shiftKey) {
      switch (key.toLowerCase()) {
        case KEYBOARD_SHORTCUTS.search.key:
          if (enableSearch) {
            event.preventDefault()
            focusSearchInput()
          }
          break
        case KEYBOARD_SHORTCUTS.showHelp.key:
          event.preventDefault()
          setIsHelpVisible(prev => !prev)
          break
        case KEYBOARD_SHORTCUTS.escape.key:
          event.preventDefault()
          handleEscape()
          break
      }
    }

    // Grid navigation
    if (enableGridNavigation && !isFormElement) {
      handleGridNavigation(event)
    }

    // Context-specific actions
    if (contextActions[key.toLowerCase()]) {
      event.preventDefault()
      contextActions[key.toLowerCase()]()
    }
  }, [disabled, enableGlobalShortcuts, enableGridNavigation, enableSearch, contextActions, router, gridState])

  // Grid navigation handler
  const handleGridNavigation = useCallback((event: KeyboardEvent) => {
    const { key } = event
    const { focusedIndex, totalItems, columns } = gridState

    if (totalItems === 0 || focusedIndex === -1) return

    let newIndex = focusedIndex

    switch (key.toLowerCase()) {
      case KEYBOARD_SHORTCUTS.nextItem.key:
        newIndex = Math.min(focusedIndex + 1, totalItems - 1)
        break
      case KEYBOARD_SHORTCUTS.prevItem.key:
        newIndex = Math.max(focusedIndex - 1, 0)
        break
      case KEYBOARD_SHORTCUTS.nextRow.key:
        newIndex = Math.min(focusedIndex + columns, totalItems - 1)
        break
      case KEYBOARD_SHORTCUTS.prevRow.key:
        newIndex = Math.max(focusedIndex - columns, 0)
        break
      default:
        return
    }

    if (newIndex !== focusedIndex) {
      event.preventDefault()
      setGridState(prev => ({ ...prev, focusedIndex: newIndex }))

      // Focus the actual element
      const gridItems = document.querySelectorAll('[data-keyboard-nav-item]')
      const targetItem = gridItems[newIndex] as HTMLElement
      if (targetItem) {
        targetItem.focus()
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [gridState])

  // Focus search input
  const focusSearchInput = useCallback(() => {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }, [])

  // Handle escape key
  const handleEscape = useCallback(() => {
    // Close help modal
    if (isHelpVisible) {
      setIsHelpVisible(false)
      return
    }

    // Close any open modals/dialogs
    const closeButtons = document.querySelectorAll('[data-close], [data-dismiss], .modal-close, .dialog-close')
    if (closeButtons.length > 0) {
      (closeButtons[0] as HTMLElement).click()
      return
    }

    // Blur focused element
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement.blur) {
      activeElement.blur()
    }
  }, [isHelpVisible])

  // Update grid state
  const updateGridState = useCallback((newState: Partial<GridNavigationState>) => {
    setGridState(prev => ({ ...prev, ...newState }))
  }, [])

  // Set up event listeners
  useEffect(() => {
    if (disabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, disabled])

  // Announce shortcuts on load (for screen readers)
  useEffect(() => {
    if (enableGlobalShortcuts) {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = 'Keyboard shortcuts available. Press ? for help.'
      document.body.appendChild(announcement)

      return () => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement)
        }
      }
    }
  }, [enableGlobalShortcuts])

  return {
    isHelpVisible,
    setIsHelpVisible,
    gridState,
    updateGridState,
    focusSearchInput,
    shortcuts: KEYBOARD_SHORTCUTS
  }
}

// Hook for focus management
export function useFocusManagement() {
  const focusHistoryRef = useRef<HTMLElement[]>([])
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null)

  // Save focus
  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      focusHistoryRef.current.push(activeElement)
      setFocusedElement(activeElement)
    }
  }, [])

  // Restore focus
  const restoreFocus = useCallback(() => {
    const lastFocused = focusHistoryRef.current.pop()
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus()
      setFocusedElement(lastFocused)
    }
  }, [])

  // Focus first focusable element in container
  const focusFirst = useCallback((container: HTMLElement | null) => {
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0] as HTMLElement
    if (firstFocusable) {
      firstFocusable.focus()
      setFocusedElement(firstFocusable)
    }
  }, [])

  // Focus last focusable element in container
  const focusLast = useCallback((container: HTMLElement | null) => {
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement
    if (lastFocusable) {
      lastFocusable.focus()
      setFocusedElement(lastFocusable)
    }
  }, [])

  // Trap focus within container
  const trapFocus = useCallback((container: HTMLElement | null) => {
    if (!container) return () => {}

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>

      if (focusableElements.length === 0) return

      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    focusedElement,
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
    trapFocus
  }
}

// Hook for grid keyboard navigation
export function useGridKeyboardNavigation(
  totalItems: number,
  columns: number,
  onSelectionChange?: (index: number) => void
) {
  const { updateGridState, gridState } = useKeyboardNavigation({
    enableGridNavigation: true
  })

  // Update grid configuration
  useEffect(() => {
    const rows = Math.ceil(totalItems / columns)
    updateGridState({
      totalItems,
      columns,
      rows,
      focusedIndex: gridState.focusedIndex >= totalItems ? 0 : gridState.focusedIndex
    })
  }, [totalItems, columns, updateGridState])

  // Notify selection changes
  useEffect(() => {
    if (onSelectionChange && gridState.focusedIndex >= 0) {
      onSelectionChange(gridState.focusedIndex)
    }
  }, [gridState.focusedIndex, onSelectionChange])

  // Set initial focus
  const setInitialFocus = useCallback((index: number = 0) => {
    updateGridState({ focusedIndex: Math.max(0, Math.min(index, totalItems - 1)) })
  }, [updateGridState, totalItems])

  return {
    focusedIndex: gridState.focusedIndex,
    setInitialFocus,
    isItemFocused: (index: number) => gridState.focusedIndex === index
  }
}

// Hook for command palette / quick actions
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const commands = [
    { id: 'home', title: 'Go Home', action: () => router.push('/') },
    { id: 'products', title: 'Browse Products', action: () => router.push('/products') },
    { id: 'categories', title: 'View Categories', action: () => router.push('/categories') },
    { id: 'dashboard', title: 'My Dashboard', action: () => router.push('/user/dashboard') },
    { id: 'cart', title: 'Shopping Cart', action: () => router.push('/cart') },
    { id: 'profile', title: 'My Profile', action: () => router.push('/user/profile') },
    { id: 'settings', title: 'Settings', action: () => router.push('/user/settings') },
    { id: 'help', title: 'Help & Support', action: () => router.push('/help') },
    { id: 'refresh', title: 'Refresh Page', action: () => window.location.reload() }
  ]

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }

      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const executeCommand = useCallback((command: typeof commands[0]) => {
    command.action()
    setIsOpen(false)
    setQuery('')
  }, [])

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    commands: filteredCommands,
    executeCommand
  }
}
