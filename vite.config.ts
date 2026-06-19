import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const srcPath = new URL('./src', import.meta.url).pathname

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcPath,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
