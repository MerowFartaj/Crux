import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        crux: {
          bg: '#0A0A0B',
          surface: '#141415',
          border: '#27272A',
          accent: '#3B82F6',
          purple: '#8B5CF6',
          amber: '#F59E0B',
          text: '#FAFAF9',
          muted: '#52525B',
          caption: '#A1A1AA',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(3rem, 8vw, 7.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'headline': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'subheadline': ['clamp(1.25rem, 2.5vw, 1.5rem)', { lineHeight: '1.5' }],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
