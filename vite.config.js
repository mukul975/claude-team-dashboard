import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            target: '19'
          }]
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: false,
    hmr: { host: 'localhost' },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'icons': ['lucide-react'],
          'charts': ['recharts'],
          'd3-core': ['d3'],
          'utils': ['dayjs', 'react-hot-toast']
        }
      }
    }
  }
});
