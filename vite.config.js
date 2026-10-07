import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { omastaPlugin } from './server/viteOmasta.mjs'

// https://vite.dev/config/
export default defineConfig(({mode})=>({
  plugins: [react(), omastaPlugin({...loadEnv(mode, process.cwd(), ''), ...process.env})],
}))
