import type { Config } from "tailwindcss";
import { designTokens } from "./src/styles/design-tokens";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // UI8 Design System Integration
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        display: designTokens.typography.fontFamily.display,
        mono: designTokens.typography.fontFamily.mono,
        circular: ['CircularXX', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },

      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      fontWeight: designTokens.typography.fontWeight,

      colors: {
        // UI8 Color System
        ...designTokens.colors,

        // Keep shadcn/ui compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },

      spacing: designTokens.spacing,
      borderRadius: {
        ...designTokens.borderRadius,
        // Keep shadcn/ui compatibility
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },

      boxShadow: {
        sm: designTokens.boxShadow.sm,
        base: designTokens.boxShadow.base,
        md: designTokens.boxShadow.md,
        lg: designTokens.boxShadow.lg,
        xl: designTokens.boxShadow.xl,
        // UI8 specific shadows
        'ui8-card': designTokens.boxShadow.ui8.card,
        'ui8-card-hover': designTokens.boxShadow.ui8.cardHover,
        'ui8-dropdown': designTokens.boxShadow.ui8.dropdown,
        'ui8-modal': designTokens.boxShadow.ui8.modal,
      },

      screens: {
        'xs': designTokens.breakpoints.xs,
        'sm': designTokens.breakpoints.sm,
        'md': designTokens.breakpoints.md,
        'lg': designTokens.breakpoints.lg,
        'xl': designTokens.breakpoints.xl,
        '2xl': designTokens.breakpoints['2xl'],
      },

      container: {
        center: true,
        padding: '1rem',
        screens: designTokens.breakpoints.container,
      },

      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },

      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' }
        }
      },

      // UI8 specific utilities
      gridTemplateColumns: {
        'products-mobile': 'repeat(1, minmax(0, 1fr))',
        'products-tablet': 'repeat(2, minmax(0, 1fr))',
        'products-desktop': 'repeat(3, minmax(0, 1fr))',
        'products-wide': 'repeat(4, minmax(0, 1fr))',
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom plugin for UI8 utilities
    function({ addUtilities }: { addUtilities: (utilities: Record<string, any>) => void }) {
      addUtilities({
        '.container-ui8': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          maxWidth: '1400px',
          '@screen sm': {
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          },
          '@screen lg': {
            paddingLeft: '2rem',
            paddingRight: '2rem',
          },
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      });
    }
  ],
} satisfies Config;
