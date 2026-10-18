import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    license: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-flow', test: /node_modules[\\/]@xyflow/, priority: 3 },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-)/, priority: 3 },
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-)/, priority: 3 },
            { name: 'vendor', test: /node_modules/, maxSize: 250000, priority: 1 },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
