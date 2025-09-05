'use client'

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Enhanced cn utility with performance optimizations
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Component variant system for consistent styling
export const componentVariants = {
  // Button variants
  button: {
    base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
        // UI8 specific variants
        ui8Primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        ui8Secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
        ui8Ghost: 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white'
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
        // UI8 specific sizes
        ui8Small: 'h-8 px-3 text-xs',
        ui8Large: 'h-12 px-6 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  },

  // Card variants for different contexts
  card: {
    base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'shadow-md hover:shadow-lg transition-shadow',
        interactive: 'cursor-pointer hover:shadow-md transition-all duration-200',
        ui8Product: 'bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100',
        ui8Dark: 'bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors duration-200'
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md'
    }
  },

  // Input variants
  input: {
    base: 'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variants: {
      variant: {
        default: 'border-border',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
        ui8: 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-transparent'
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  },

  // Text variants for consistent typography
  text: {
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl'
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold'
      },
      color: {
        default: 'text-foreground',
        muted: 'text-muted-foreground',
        destructive: 'text-destructive',
        primary: 'text-primary',
        ui8Light: 'text-gray-300',
        ui8Dark: 'text-gray-900'
      }
    }
  },

  // Loading states
  loading: {
    base: 'animate-pulse',
    variants: {
      variant: {
        skeleton: 'bg-gray-200 rounded',
        shimmer: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded',
        spinner: 'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'
      },
      size: {
        sm: 'h-4',
        md: 'h-6',
        lg: 'h-8',
        xl: 'h-12'
      }
    }
  }
}

// Responsive utility functions
export const responsive = {
  // Grid systems
  grid: {
    responsive: (cols: { mobile?: number; tablet?: number; desktop?: number }) => {
      return cn(
        'grid gap-4',
        cols.mobile ? `grid-cols-${cols.mobile}` : 'grid-cols-1',
        cols.tablet ? `md:grid-cols-${cols.tablet}` : '',
        cols.desktop ? `lg:grid-cols-${cols.desktop}` : ''
      )
    },
    ui8Products: 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  },

  // Spacing utilities
  spacing: {
    responsive: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
      const spacingMap = {
        xs: 'p-2 sm:p-3 lg:p-4',
        sm: 'p-3 sm:p-4 lg:p-6',
        md: 'p-4 sm:p-6 lg:p-8',
        lg: 'p-6 sm:p-8 lg:p-12',
        xl: 'p-8 sm:p-12 lg:p-16'
      }
      return spacingMap[size]
    },
    section: 'py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8',
    container: 'w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl'
  },

  // Typography
  text: {
    responsive: (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl') => {
      const textMap = {
        xs: 'text-xs sm:text-sm',
        sm: 'text-sm sm:text-base',
        base: 'text-base sm:text-lg',
        lg: 'text-lg sm:text-xl lg:text-2xl',
        xl: 'text-xl sm:text-2xl lg:text-3xl',
        '2xl': 'text-2xl sm:text-3xl lg:text-4xl',
        '3xl': 'text-3xl sm:text-4xl lg:text-5xl'
      }
      return textMap[size]
    },
    hero: 'text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight',
    display: 'text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight',
    bodyLarge: 'text-lg sm:text-xl leading-relaxed'
  }
}

// Animation utilities
export const animations = {
  // Entrance animations
  fadeIn: 'animate-in fade-in duration-500',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-500',
  slideDown: 'animate-in slide-in-from-top-4 duration-500',
  slideLeft: 'animate-in slide-in-from-right-4 duration-500',
  slideRight: 'animate-in slide-in-from-left-4 duration-500',
  scaleIn: 'animate-in zoom-in-95 duration-300',

  // Exit animations
  fadeOut: 'animate-out fade-out duration-300',
  slideUpOut: 'animate-out slide-out-to-top-4 duration-300',
  slideDownOut: 'animate-out slide-out-to-bottom-4 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-200',

  // UI8 specific animations
  ui8FadeUp: 'animate-slide-up-fade',
  ui8Stagger: 'animate-stagger-up',
  ui8Bounce: 'animate-bounce-subtle',
  ui8Float: 'animate-float',
  ui8Shimmer: 'animate-shimmer'
}

// State utilities
export const states = {
  loading: 'opacity-50 pointer-events-none animate-pulse',
  disabled: 'opacity-50 cursor-not-allowed',
  active: 'ring-2 ring-primary ring-offset-2',
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  hover: 'hover:opacity-80 transition-opacity',
  interactive: 'cursor-pointer transition-colors duration-200'
}

// Layout utilities
export const layout = {
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',

  // Full height layouts
  fullHeight: 'min-h-screen',
  fullWidth: 'w-full',

  // Positioning
  absolute: 'absolute inset-0',
  fixed: 'fixed inset-0',
  sticky: 'sticky top-0',

  // Aspect ratios
  aspectSquare: 'aspect-square',
  aspectVideo: 'aspect-video',
  aspectProduct: 'aspect-[4/3]',

  // Overflow
  hidden: 'overflow-hidden',
  scroll: 'overflow-auto',

  // Z-index layers
  zIndex: {
    base: 'z-0',
    dropdown: 'z-10',
    modal: 'z-50',
    toast: 'z-[100]'
  }
}

// Mobile-specific utilities
export const mobile = {
  only: 'block sm:hidden',
  hidden: 'hidden sm:block',
  touchTarget: 'min-h-[44px] min-w-[44px]',
  safeArea: 'pb-safe',
  scrollable: 'overflow-auto -webkit-overflow-scrolling-touch'
}

// Accessibility utilities
export const a11y = {
  srOnly: 'sr-only',
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  highContrast: 'contrast-more:border-black contrast-more:text-black',
  reducedMotion: 'motion-reduce:animate-none motion-reduce:transition-none'
}

// Performance utilities
export const performance = {
  willChange: 'will-change-transform',
  gpuAccelerated: 'transform-gpu',
  backfaceHidden: 'backface-visibility-hidden',
  optimizeText: 'optimize-text',
  contentVisibility: 'content-visibility-auto'
}

// Theme utilities
export const theme = {
  ui8: {
    background: 'bg-[#161717]',
    card: 'bg-gray-800',
    cardHover: 'hover:bg-gray-700',
    text: 'text-white',
    textMuted: 'text-gray-400',
    border: 'border-gray-700',
    accent: 'bg-blue-600 hover:bg-blue-700'
  },
  light: {
    background: 'bg-white',
    card: 'bg-white',
    cardHover: 'hover:bg-gray-50',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    border: 'border-gray-200',
    accent: 'bg-blue-600 hover:bg-blue-700'
  }
}

// Export commonly used combinations
export const common = {
  // Cards
  productCard: cn(
    componentVariants.card.base,
    componentVariants.card.variants.variant.ui8Product,
    'cursor-pointer group'
  ),

  // Buttons
  primaryButton: cn(
    componentVariants.button.base,
    componentVariants.button.variants.variant.ui8Primary,
    componentVariants.button.variants.size.default
  ),

  // Containers
  pageContainer: cn(
    responsive.spacing.container,
    responsive.spacing.section
  ),

  // Text
  heroText: cn(
    responsive.text.hero,
    'text-white font-circular'
  ),

  // Loading states
  skeleton: cn(
    componentVariants.loading.base,
    componentVariants.loading.variants.variant.shimmer
  )
}

// Utility for creating variant functions
export function createVariants<T extends Record<string, any>>(config: T) {
  return (variants: Partial<Record<keyof T['variants'], keyof T['variants'][keyof T['variants']]>>) => {
    const classes = [config.base]

    Object.entries(variants).forEach(([key, value]) => {
      if (config.variants[key] && config.variants[key][value as string]) {
        classes.push(config.variants[key][value as string])
      }
    })

    return cn(...classes)
  }
}
