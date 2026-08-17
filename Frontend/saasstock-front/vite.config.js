import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // importo tailwind

// https://vite.dev/config/
export default defineConfig({
  base: './', //  Permite que los archivos estáticos carguen bien desde wwwroot en .NET
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7046', // Tu puerto HTTPS del backend de C#
        changeOrigin: true,
        secure: false, // Necesario para aceptar el certificado HTTPS autofirmado de .NET en local
      }
    }
  }
})