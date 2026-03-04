import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/lonessystem/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lönesystem',
        short_name: 'Lönesystem',
        description: 'Lönesystem för tjänstemän',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/lonessystem/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/lonessystem/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/engine/**', 'src/store/**'],
      exclude: ['src/main.tsx', 'src/App.tsx'],
      // Tröskel på 50% — höjs gradvis när fler tester läggs till
      thresholds: {
        lines: 50,
        functions: 50,
      }
    }
  }
})
