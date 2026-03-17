import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,
    proxy: {
      '/static': 'http://localhost:8084',
      '/events': { target: 'http://localhost:8084', ws: true },
      '/api': 'http://localhost:8084',
      '/gt-source': {
        target: 'http://localhost:8084',
        rewrite: (path) => path.replace(/^\/gt-source/, ''),
      },
    },
  },
})
