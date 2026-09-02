import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Matches Backend/.env.example CORS_ALLOWED_ORIGINS (http://localhost:4200).
    // Change both together if you move off this port.
    port: 4200,
    strictPort: true,
  },
})
