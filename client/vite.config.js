import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["collinss-macbook-pro-2.local", "dravon-macbook.tail2c66c1.ts.net"],
    proxy: {
      '/api': {
        target: process.env.PFWORDLE_API_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.PFWORDLE_API_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
