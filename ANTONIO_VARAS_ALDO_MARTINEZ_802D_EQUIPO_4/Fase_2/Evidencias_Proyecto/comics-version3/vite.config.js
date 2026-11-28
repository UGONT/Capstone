// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // El proxy solo se activa en modo 'development'
  const isDev = mode === 'development';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Si no estamos en desarrollo, 'server' queda vacío y no hay proxy.
      ...(isDev && {
        proxy: {
          '/api': {
            target: 'http://backend:8000',
            changeOrigin: true,
          },
        },
      }),
    },
  };
});