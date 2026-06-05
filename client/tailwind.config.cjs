/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#F5F2EB',
        foreground: '#1A1A1A',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
          hover: '#FFFDF5'
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
        },
        primary: {
          DEFAULT: '#FFC107', // Primary Yellow
          foreground: '#1A1A1A',
        },
        secondary: {
          DEFAULT: '#FFB300', // Secondary Yellow
          foreground: '#1A1A1A',
        },
        muted: {
          DEFAULT: '#FFFDF5', // Section Background (#FFFDF5) as muted bg
          foreground: '#666666', // Text Secondary (#666666)
        },
        accent: {
          DEFAULT: '#FFD54F', // Accent Yellow
          foreground: '#1A1A1A',
        },
        border: '#EAEAEA',
        input: '#EAEAEA',
        ring: '#FFC107',
        better: '#22C55E', // Success Green
        worse: '#EF4444',  // Danger Red
        similar: '#9CA3AF' // Gray for similar specs
      },
      borderRadius: {
        lg: "1rem", // 16px radius as requested
        md: "0.75rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      boxShadow: {
        glass: '0 4px 20px rgba(0, 0, 0, 0.03)',
        border: '0 0 0 1px #EAEAEA',
      }
    },
  },
  plugins: [],
}
