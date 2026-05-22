/** @type {import('tailwindcss').Config} */
export default {
  // 'class' permet de basculer le thème sombre via la classe .dark (ThemeContext)
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
