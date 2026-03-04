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
    // Använd test-specifik tsconfig som inkluderar vitest globals + tests/
    typecheck: { tsconfig: './tsconfig.test.json' },
  }
})
