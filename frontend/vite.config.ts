import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      // Polling ensures HMR picks up file changes made on the host through
      // a Docker bind mount (needed on Windows/macOS Docker Desktop where
      // native filesystem events aren't propagated into the container).
      usePolling: true,
      interval: 100,
    },
  },
})
