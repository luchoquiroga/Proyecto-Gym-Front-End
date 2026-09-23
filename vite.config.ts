import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // El backend permite el origen http://localhost:5173 por defecto
    // (CORS_ALLOWED_ORIGINS). Si Vite se corre en otro puerto porque el 5173
    // está ocupado, no funciona ni el login: mejor fallar acá y que se vea.
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Los tests de fechas prueban el borde de medianoche, que depende de la
    // zona: se fija la del gimnasio para que den igual en cualquier máquina.
    env: { TZ: 'America/Argentina/Buenos_Aires' },
  },
})
