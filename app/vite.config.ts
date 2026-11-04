import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// BASE_PATH: '/' a Netlify o amb domini propi; '/longtails-stcugat/' a GitHub Pages (el posa el workflow).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
