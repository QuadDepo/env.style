import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { envStyle } from 'env.style/vite'

export default defineConfig({
  plugins: [
    react(),
    envStyle({
      color: {
        development: '#00ff00',
      },
    }),
  ],
})
