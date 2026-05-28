import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// No need to import 'path' for Vite aliasing

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})