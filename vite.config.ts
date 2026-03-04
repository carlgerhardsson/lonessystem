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
    // Separata miljöer per testmapp:
    // - frontend-tester kör i jsdom (DOM-stöd)
    // - engine/config-tester kör i node (filsystem-stöd)
    environmentMatchGlobs: [
      ['tests/frontend/**', 'jsdom'],
      ['tests/config/**', 'node'],
      ['tests/engine/**', 'node'],
    ],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**'],
      exclude: ['src/main.tsx'],
      thresholds: {
        // Minsta testtäckning — CI misslyckas om vi faller under dessa
        lines: 70,
        functions: 70,
      }
    }
  }
})
