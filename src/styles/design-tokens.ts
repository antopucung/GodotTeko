// Design tokens system matching UI8.net aesthetic
// This centralizes all design decisions for consistent responsive design

export const designTokens = {
  // Colors matching UI8.net's dark theme
  colors: {
    // Primary blues (matching UI8's brand)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa', // UI8's main blue
      500: '#3b82f6',
      600: '#2563eb', // UI8's button blue
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },

    // Dark theme grays (matching UI8's background)
    dark: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b', // UI8's secondary background
      900: '#0f172a', // UI8's main background
      950: '#020617'
    },

    // Semantic colors
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },

    // UI8 specific colors
    ui8: {
      background: '#0a0b0d', // Main dark background
      surface: '#161717', // Card/component background
      surfaceHover: '#1a1b1c', // Hover states
      border: '#2a2b2c', // Subtle borders
      borderLight: '#3a3b3c', // Lighter borders
      text: {
        primary: '#ffffff',
        secondary: '#a1a1aa',
        muted: '#71717a',
        accent: '#60a5fa'
      }
    }
  },

  // Typography system matching UI8's clean approach
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Inter', 'system-ui', 'sans-serif'], // For headings
      mono: ['JetBrains Mono', 'monospace']
    },

    fontSize: {
      // Mobile-first approach
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],

      // Responsive hero text (like UI8's main heading)
      hero: {
        mobile: ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        tablet: ['3rem', { lineHeight: '3.5rem', fontWeight: '700' }],
        desktop: ['4rem', { lineHeight: '4.5rem', fontWeight: '700' }]
      }
    },

    fontWeight: {
      normal: '400',
      medium: '500', // UI8's preferred weight
      semibold: '600',
      bold: '700'
    }
  },

  // Spacing system (8px base, matching UI8's consistent spacing)
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem'
  },

  // Enhanced responsive breakpoints (optimized for common devices)
  breakpoints: {
    xs: '360px',    // Smallest phones (Galaxy S21, etc.)
    sm: '640px',    // Large phones landscape / Small tablets
    md: '768px',    // Tablets portrait (iPad, etc.)
    lg: '1024px',   // Tablets landscape / Small laptops
    xl: '1280px',   // Laptops / Small desktops
    '2xl': '1440px', // Large desktops / iMacs
    '3xl': '1920px', // Ultra-wide screens

    // Device-specific breakpoints for precise targeting
    devices: {
      iphoneSE: '375px',      // iPhone SE
      iphone: '390px',        // iPhone 12/13/14
      iphoneMax: '430px',     // iPhone 14 Pro Max
      ipadPortrait: '768px',  // iPad portrait
      ipadLandscape: '1024px', // iPad landscape
      macbookAir: '1440px',   // MacBook Air 13"
      macbookPro: '1512px',   // MacBook Pro 14"
      imac: '1920px'          // iMac 24"
    },

    // Container max-widths with smooth scaling
    container: {
      xs: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1400px', // UI8's max content width
      '3xl': '1400px'  // Keep max width even on ultra-wide
    }
  },

  // Border radius (UI8 uses consistent rounded corners)
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',  // UI8's card radius
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px' // Pills/badges
  },

  // Shadows (UI8's subtle elevation system)
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',

    // UI8 specific shadows
    ui8: {
      card: '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      cardHover: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      dropdown: '0 25px 50px -12px rgb(0 0 0 / 0.4)',
      modal: '0 25px 50px -12px rgb(0 0 0 / 0.5)'
    }
  },

  // Animation & transitions (UI8's smooth interactions)
  animation: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms'
    },

    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)', // UI8's preferred easing
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // Component specific tokens
  components: {
    button: {
      height: {
        sm: '2rem',     // 32px
        md: '2.5rem',   // 40px - UI8's standard
        lg: '3rem',     // 48px
        xl: '3.5rem'    // 56px
      },
      padding: {
        sm: '0.5rem 0.75rem',
        md: '0.75rem 1.5rem',  // UI8's standard
        lg: '1rem 2rem',
        xl: '1.25rem 2.5rem'
      }
    },

    card: {
      padding: {
        sm: '1rem',
        md: '1.5rem',   // UI8's standard
        lg: '2rem',
        xl: '2.5rem'
      }
    },

    input: {
      height: {
        sm: '2rem',
        md: '2.5rem',   // UI8's standard
        lg: '3rem'
      }
    }
  },

  // Grid systems
  grid: {
    // Product grid configurations
    products: {
      mobile: 'repeat(1, minmax(0, 1fr))',
      tablet: 'repeat(2, minmax(0, 1fr))',
      desktop: 'repeat(3, minmax(0, 1fr))',
      wide: 'repeat(4, minmax(0, 1fr))'
    },

    // Container configurations
    container: {
      padding: {
        mobile: '1rem',    // 16px
        tablet: '1.5rem',  // 24px
        desktop: '2rem'    // 32px
      }
    }
  }
};

// Type-safe design token access
export type DesignTokens = typeof designTokens;

// Helper functions for responsive values
export const getResponsiveValue = (
  mobile: string,
  tablet?: string,
  desktop?: string
) => ({
  mobile,
  tablet: tablet || mobile,
  desktop: desktop || tablet || mobile
});

// Utility for creating responsive classes
export const responsive = {
  text: (mobile: string, tablet?: string, desktop?: string) =>
    `text-${mobile} md:text-${tablet || mobile} lg:text-${desktop || tablet || mobile}`,

  spacing: (mobile: string, tablet?: string, desktop?: string) =>
    `${mobile} md:${tablet || mobile} lg:${desktop || tablet || mobile}`,

  grid: (mobile: number, tablet?: number, desktop?: number) =>
    `grid-cols-${mobile} md:grid-cols-${tablet || mobile} lg:grid-cols-${desktop || tablet || mobile}`
};
