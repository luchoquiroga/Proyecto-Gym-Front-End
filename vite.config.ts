import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Con prefijo '' se leen también las variables sin VITE_, que no van al bundle.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // El backend permite el origen http://localhost:5173 por defecto
      // (CORS_ALLOWED_ORIGINS). Si Vite se corre en otro puerto porque el 5173
      // está ocupado, no funciona ni el login: mejor fallar acá y que se vea.
      port: 5173,
      strictPort: true,
      // `pnpm dev:prod`: con VITE_API_URL vacía la web pide /api/... a su
      // propio origen, como en Vercel; acá el que reenvía es Vite.
      proxy: env.API_PROXY_TARGET
        ? { '/api': { target: env.API_PROXY_TARGET, changeOrigin: true, secure: true } }
        : undefined,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Los tests de fechas prueban el borde de medianoche, que depende de la
      // zona: se fija la del gimnasio para que den igual en cualquier máquina.
      env: { TZ: 'America/Argentina/Buenos_Aires' },
    },
  }
})
