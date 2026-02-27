/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 👈 必須加入這行！告訴系統不要清掉日夜模式的樣式
  theme: {
    extend: {},
  },
  plugins: [],
}