import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Kept separate from vite.config.ts: vitest bundles its own copy of Vite,
// whose plugin types don't structurally match the top-level `vite` package's
// types, so merging `test` into the main defineConfig() call fails to
// type-check under `tsc -b`. Vitest resolves this file automatically.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
