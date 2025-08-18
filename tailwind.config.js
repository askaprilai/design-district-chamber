/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Ensure dynamic color classes are included
    'bg-emerald-50', 'bg-emerald-100', 'bg-emerald-500', 'bg-emerald-600',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600',
    'bg-red-50', 'bg-red-100', 'bg-red-500', 'bg-red-600',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'bg-purple-600',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-500', 'bg-orange-600',
    'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-500', 'bg-indigo-600',
    'text-emerald-700', 'text-emerald-800',
    'text-blue-700', 'text-blue-800',
    'text-red-700', 'text-red-800',
    'text-purple-700', 'text-purple-800',
    'text-orange-700', 'text-orange-800',
    'text-indigo-700', 'text-indigo-800',
    'border-emerald-500', 'border-blue-500', 'border-red-500',
    'border-purple-500', 'border-orange-500', 'border-indigo-500',
    'hover:bg-emerald-700', 'hover:bg-blue-700', 'hover:bg-red-700',
    'hover:bg-purple-700', 'hover:bg-orange-700', 'hover:bg-indigo-700',
  ],
};