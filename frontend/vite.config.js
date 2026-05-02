import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'GOOGLE_'],
    define: {
      __GOOGLE_API_KEY__: JSON.stringify(process.env.GOOGLE_API_KEY || env.GOOGLE_API_KEY || ''),
    },
    server: {
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
  }
})
