import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8090,
    strictPort: true,
    host: true,
    proxy: {
      '/api': 'http://localhost:8080',
      '/docs': 'http://localhost:8080',
      '/openapi.json': 'http://localhost:8080'
    }
  }
})
