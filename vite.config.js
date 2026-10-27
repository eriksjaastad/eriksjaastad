import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'

// `yarn dev` serves the standalone pages in public/ (/gallery/, /flashback/, /memory/ ...) the way Vercel does:
// a real public/<path>/index.html wins over the homepage's SPA fallback. Without this, every one of those URLs
// opened the homepage in dev.
const publicDir = resolve('public')
const publicPages = {
  name: 'public-pages',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const [path, query = ''] = req.url.split(/(?=\?)/)
      const file = resolve(publicDir, `.${decodeURIComponent(path)}`, 'index.html')
      if (path !== '/' && path.endsWith('/') && file.startsWith(publicDir + sep) && existsSync(file)) req.url = `${path}index.html${query}`
      next()
    })
  },
}

export default defineConfig({
  plugins: [react(), publicPages],
  // only the homepage is a Vite entry; the public pages load three.js from a CDN import map, which Vite must not resolve
  optimizeDeps: { entries: ['index.html'] },
  build: {
    outDir: 'dist'
  }
})
