import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { powerApps } from '@microsoft/power-apps-vite/plugin'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), powerApps()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setupTests.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    env: {
      VITE_APP_DATA_MODE: 'mock',
    },
  },
})
