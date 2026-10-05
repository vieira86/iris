import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' gera caminhos relativos: funciona no GitHub Pages (qualquer nome
// de repositório) e localmente.
export default defineConfig({
  plugins: [react()],
  base: './'
})
