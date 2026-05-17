import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function analyticsDevPlugin(): Plugin {
  const distPath = path.resolve(__dirname, 'dist/analytics.js')

  return {
    name: 'analytics-dev',
    configureServer(server) {
      server.middlewares.use('/analytics.js', (_req, res) => {
        if (fs.existsSync(distPath)) {
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(fs.readFileSync(distPath, 'utf-8'))
        } else {
          res.statusCode = 404
          res.end('/* analytics not built. Run: node scripts/build-tracker.mjs */')
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), analyticsDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react-dom/client'],
  },
})
