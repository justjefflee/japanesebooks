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
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/tts/, '/translate_tts');
          console.log('TTS Proxy rewrite:', path, '->', newPath);
          return newPath;
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying TTS request:', req.url);
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            proxyReq.setHeader('Referer', 'https://translate.google.com/');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('TTS Proxy response:', proxyRes.statusCode);
          });
        }
      }
    }
  }
})
