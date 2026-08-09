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
          50: '#eff7ff',
          100: '#d8ecff',
          200: '#b3dbff',
          300: '#7bb9ff',
          400: '#4a92ff',
          500: '#0ea1ff',
          600: '#0087f7',
          700: '#006bd4',
          800: '#0457ad',
          900: '#0a3f7b'
        },
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.12)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(14,161,255,0.14), rgba(255,255,255,0.08))',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
