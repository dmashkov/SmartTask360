/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary (Blue)
        primary: {
          50: '#DBEAFE',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Status colors
        status: {
          draft: '#9CA3AF',
          new: '#3B82F6',
          assigned: '#8B5CF6',
          'in-progress': '#8B5CF6',
          'on-review': '#F59E0B',
          done: '#10B981',
          cancelled: '#6B7280',
        },
        // Priority colors
        priority: {
          low: '#6B7280',
          medium: '#3B82F6',
          high: '#F59E0B',
          critical: '#EF4444',
        },
        // AI accent
        ai: '#8B5CF6',
      },
    },
  },
  plugins: [],
}
