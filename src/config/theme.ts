export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
    input: string
    ring: string
    destructive: string
    warning: string
    success: string
    info: string
  }
  fonts: {
    sans: string[]
    mono: string[]
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
  }
  breakpoints: {
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  animations: {
    duration: {
      fast: string
      normal: string
      slow: string
    }
    easing: {
      linear: string
      easeIn: string
      easeOut: string
      easeInOut: string
    }
  }
}

export const lightTheme: ThemeConfig = {
  colors: {
    primary: '#4169E1',
    secondary: '#6B7280',
    accent: '#3B51BF',
    background: '#FFFFFF',
    foreground: '#1F2937',
    muted: '#F3F4F6',
    border: '#E5E7EB',
    input: '#F9FAFB',
    ring: '#4169E1',
    destructive: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6'
  },
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Menlo', 'Monaco', 'Courier New', 'monospace']
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
    '3xl': '6rem'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}

export const darkTheme: ThemeConfig = {
  colors: {
    primary: '#4169E1',
    secondary: '#9CA3AF',
    accent: '#3B51BF',
    background: '#161717',
    foreground: '#FFFFFF',
    muted: '#1F2937',
    border: '#374151',
    input: '#1F2937',
    ring: '#4169E1',
    destructive: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6'
  },
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Menlo', 'Monaco', 'Courier New', 'monospace']
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
    '3xl': '6rem'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}

export const defaultTheme = darkTheme // Current default

// Theme utility functions
export const getTheme = (isDark: boolean): ThemeConfig => {
  return isDark ? darkTheme : lightTheme
}

export const generateCSSVariables = (theme: ThemeConfig): Record<string, string> => {
  return {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-accent': theme.colors.accent,
    '--color-background': theme.colors.background,
    '--color-foreground': theme.colors.foreground,
    '--color-muted': theme.colors.muted,
    '--color-border': theme.colors.border,
    '--color-input': theme.colors.input,
    '--color-ring': theme.colors.ring,
    '--color-destructive': theme.colors.destructive,
    '--color-warning': theme.colors.warning,
    '--color-success': theme.colors.success,
    '--color-info': theme.colors.info
  }
}
