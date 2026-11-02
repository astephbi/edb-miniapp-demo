import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build`        -> dist/ classique, à héberger en HTTPS pour Telegram
// `npm run build:single` -> dist-single/index.html autonome (démo à partager)
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [vue(), viteSingleFile()] : [vue()],
  base: './',
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' }
}))
