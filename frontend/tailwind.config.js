/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Grand Slam theme - Tennis elegance
        'slam': {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803d',
          '800': '#166534',
          '900': '#145231',
          'dark': '#064E3B',
          'accent': '#FCD34D',
        },
        'primary': {
          '100': '#dbeafe',
          '600': '#2563eb',
          '700': '#1d4ed8',
        },
        'success': {
          '100': '#dcfce7',
          '500': '#22c55e',
          '600': '#16a34a',
        },
        'warning': {
          '100': '#fef3c7',
          '600': '#d97706',
        },
        'danger': {
          '500': '#ef4444',
        }
      },
      fontFamily: {
        'sans': ['Roboto', 'system-ui', 'sans-serif'],
        'display': ['Roboto Condensed', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-slam': 'linear-gradient(135deg, #15803d 0%, #047857 100%)',
        'gradient-slam-subtle': 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        'gradient-dark': 'linear-gradient(135deg, #064E3B 0%, #15803d 100%)',
      },
      boxShadow: {
        'slam': '0 10px 30px rgba(21, 128, 61, 0.15)',
        'slam-lg': '0 20px 50px rgba(21, 128, 61, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
