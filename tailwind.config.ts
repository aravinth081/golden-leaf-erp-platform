import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FFF9E6',
          100: '#FFF0BF',
          200: '#FFE699',
          300: '#FFDB6B',
          400: '#E8C547',
          500: '#D4AF37', // Primary Gold
          600: '#B8860B', // Deep Gold / Accent
          700: '#9A7209',
          800: '#7C5B07',
          900: '#5E4505',
          950: '#3A2E12',
        },
        surface: {
          white: '#FFFFFF',
          cream: '#FAF8F3',
          warm: '#F5F0E8',
          muted: '#EDE8DD',
        },
        rich: {
          black: '#1A1A1A',
          charcoal: '#2D2D2D',
          gray: '#4A4A4A',
          silver: '#8A8A8A',
          light: '#BDBDBD',
        },
        brand: {
          navy: '#0A1628',
          'navy-light': '#142840',
        },
        status: {
          success: '#2E7D32',
          'success-light': '#E8F5E9',
          error: '#C62828',
          'error-light': '#FFEBEE',
          warning: '#ED6C02',
          'warning-light': '#FFF3E0',
          info: '#1565C0',
          'info-light': '#E3F2FD',
        },
      },
      fontFamily: {
        sans: ['InterWithManropeNumbers', 'Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'InterWithManropeNumbers', 'Inter', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'InterWithManropeNumbers', 'Inter', 'system-ui', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        number: ['Manrope', 'InterWithManropeNumbers', 'sans-serif'],
        numeric: ['Manrope', 'InterWithManropeNumbers', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '8.5': '2.125rem',
      },
      fontSize: {
        'display-xl': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-lg': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-md': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
        'display-sm': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'heading': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'subheading': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26, 26, 26, 0.06), 0 1px 2px rgba(26, 26, 26, 0.04)',
        'card-hover': '0 10px 25px rgba(26, 26, 26, 0.08), 0 4px 10px rgba(26, 26, 26, 0.04)',
        'gold': '0 4px 14px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 8px 30px rgba(212, 175, 55, 0.35)',
        'sidebar': '4px 0 24px rgba(26, 26, 26, 0.06)',
        'modal': '0 20px 60px rgba(26, 26, 26, 0.15)',
        'inner-gold': 'inset 0 0 0 1px rgba(212, 175, 55, 0.2)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #1A1A1A 0%, #3A2E12 50%, #D4AF37 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
        'gradient-card': 'linear-gradient(145deg, #FFFFFF 0%, #FAF8F3 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(212, 175, 55, 0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};

export default config;
