import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  /**
   * 💡 最終解決方案：
   * 既然自動判定失敗，我們直接鎖定為 '/'。
   * 這會確保 Vercel 能在根目錄找到所有 JS/CSS 檔案。
   * (注意：若之後要回 GitHub Pages，才需改回 '/contact-book/')
   */
  base: '/', 
})