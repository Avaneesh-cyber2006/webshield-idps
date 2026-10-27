import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../server', '')
  const target = `http://127.0.0.1:${env.PORT || 3000}`
  return {
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target,
        changeOrigin: true
      },
      '/socket.io': {
        target,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  base: '/'
  }
})
