/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#0A0A0F',
          surface: '#12121A',
          border: '#1E1E2E',
          accent: '#3B82F6',
          cyan: '#06B6D4',
          text: '#E2E8F0',
          muted: '#64748B',
          success: '#22C55E',
          warning: '#EAB308',
          error: '#EF4444',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"SF Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
