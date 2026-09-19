import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
})
