/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          black: '#000000',
          dark: '#161617',
          surface: '#1d1d1f',
          surfaceElevated: '#252528',
          text: '#f5f5f7',
          muted: '#86868b',
          subtle: '#424245',
          blue: '#0071e3',
          blueHover: '#0077ed',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(255, 255, 255, 0.16)'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      },
      letterSpacing: {
        appleHero: '-0.035em',
        appleSection: '-0.025em',
        appleTight: '-0.015em'
      },
      borderRadius: {
        'apple-card': '24px',
        'apple-pill': '980px'
      },
      boxShadow: {
        'apple-card': '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'apple-button': '0 4px 12px rgba(0, 113, 227, 0.3)',
        'apple-rim': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)'
      }
    },
  },
  plugins: [],
}
