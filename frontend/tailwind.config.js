module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cmblue: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#b3d9ff',
          300: '#7dbdff',
          400: '#4a9dff',
          500: '#1b7efc',
          600: '#1178fa',
          700: '#0b5fd4',
          800: '#0a4aa8',
          900: '#0a3a7d'
        },
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)',
        'blue-glow': '0 10px 40px rgba(17, 120, 250, 0.25)',
        card: '0 2px 16px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 8px 32px rgba(15, 23, 42, 0.1)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(17,120,250,0.1), rgba(255,255,255,0.08))',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};