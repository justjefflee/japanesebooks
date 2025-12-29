import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      path: 'path-browserify'
    }
  },
  server: {
    proxy: {
      '/anki': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anki/, ''),
      },
      '/api/tts': {
        target: 'https://translate.google.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/tts/, '/translate_tts'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying TTS request:', req.url);
          });
        }
      }
    }
  }
})
