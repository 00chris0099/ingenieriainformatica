import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        surface: {
          base: 'var(--color-bg-base)',
          DEFAULT: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-elevated)',
          overlay: 'var(--color-bg-overlay)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          muted: 'var(--color-accent-muted)',
          glow: 'var(--color-accent-glow)',
        },
        sidebar: {
          DEFAULT: '#0a0a0c',
          foreground: '#a1a1aa',
          accent: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.06)',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        'glass': 'var(--shadow-md)',
        'glass-lg': 'var(--shadow-lg)',
        'glass-xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
        'glow-sm': 'var(--shadow-glow-sm)',
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--ease-out-expo)',
        'fade-in-up': 'fadeInUp var(--duration-smooth) var(--ease-spring)',
        'fade-in-down': 'fadeInDown var(--duration-smooth) var(--ease-spring)',
        'modal-in': 'modalIn var(--duration-smooth) var(--ease-spring)',
        'slide-in-right': 'slideInRight var(--duration-smooth) var(--ease-spring)',
        'slide-in-left': 'slideInLeft var(--duration-smooth) var(--ease-spring)',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
      },
    },
  },
  plugins: [],
};

export default config;
