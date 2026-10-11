/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#07090e',
          900: '#0b0f17',
          850: '#101622',
          800: '#172030',
          750: '#1d283c',
          700: '#26344d',
          600: '#384866',
          500: '#4e6284',
        },
        brand: {
          lime: '#ccff00',
          'lime-dim': '#a8d900',
          'lime-glow': 'rgba(204, 255, 0, 0.15)',
          violet: '#8b5cf6',
          'violet-light': '#a78bfa',
          'violet-glow': 'rgba(139, 92, 246, 0.18)',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-lime': '0 0 24px -4px rgba(204, 255, 0, 0.25)',
        'glow-violet': '0 0 24px -4px rgba(139, 92, 246, 0.25)',
        'card-dark': '0 8px 30px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
