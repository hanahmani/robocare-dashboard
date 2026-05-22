import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cible du backend Spring Boot.
//  - En dev local : http://localhost:8081
//  - En Docker (service docker-compose) : http://robocare-notification:8081
//    (surcharger via la variable d'environnement VITE_API_TARGET)
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:8081'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // ── PROXY ──────────────────────────────────────────────────────────
    // Toutes les requêtes commençant par /api et /webhook sont redirigées
    // vers le backend. C'est ce qui permet au front d'appeler "/api/..."
    // sans problème de CORS et sans coder l'URL du backend en dur.
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/webhook': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
