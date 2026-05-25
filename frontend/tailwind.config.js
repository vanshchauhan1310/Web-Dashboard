/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#060D1A',
        surface: '#0A1525',
        card: '#0E1C30',
        'card-hover': '#122340',
        primary: '#3B82F6',
        secondary: '#10B981',
        violet: '#8B5CF6',
        amber: '#F59E0B',
        rose: '#F43F5E',
        cyan: '#06B6D4',
        textMain: '#F1F5F9',
        textSub: '#CBD5E1',
        textMuted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        'card-hover': '0 8px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.1)',
        'glow-blue': '0 0 30px rgba(59, 130, 246, 0.25)',
        'glow-green': '0 0 30px rgba(16, 185, 129, 0.25)',
        'glow-violet': '0 0 30px rgba(139, 92, 246, 0.25)',
      },
    },
  },
  plugins: [],
}
