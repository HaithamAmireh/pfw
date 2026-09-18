/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#EEEBE1',
        paper: '#FFFFFF',
        ink: '#15130F',
        cash: '#00B86B',
        alert: '#E8262A',
        volt: '#FF7A00',
        sky: '#3D5AFE',
        grape: '#8338EC',
        mint: '#00C2A8',
        tang: '#FF9F1C',
        bubble: '#FF5DA2',
        // category colors (flat, deliberately distinct hues)
        cat: {
          housing: '#3D5AFE',
          food: '#FF9F1C',
          transport: '#06B6D4',
          subscription: '#8338EC',
          utilities: '#FF5DA2',
          debt: '#FF4D4D',
          entertainment: '#FFD400',
          other: '#6B7280',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        brut: '4px 4px 0 0 #15130F',
        'brut-sm': '2px 2px 0 0 #15130F',
        'brut-lg': '8px 8px 0 0 #15130F',
        'brut-press': '1px 1px 0 0 #15130F',
        'brut-cash': '4px 4px 0 0 #00B86B',
        'brut-alert': '4px 4px 0 0 #E8262A',
      },
      borderWidth: {
        3: '3px',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.16s ease-out',
        'slide-up': 'slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
