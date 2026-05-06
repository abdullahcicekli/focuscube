import path from 'node:path'
import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cloudflare Pages serves /privacy → /privacy.html automatically. Vite dev
// doesn't, so the SPA fallback hijacks those routes. This rewrites the URL
// before any Vite middleware sees it, keeping dev parity with prod.
const cleanHtmlUrls = (paths: string[]): PluginOption => ({
  name: 'clean-html-urls',
  configureServer(server) {
    const set = new Set(paths)
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? ''
      const [pathname, search = ''] = url.split('?')
      if (pathname && set.has(pathname)) {
        req.url = `${pathname}.html${search ? '?' + search : ''}`
      }
      next()
    })
  },
})

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  return {
    plugins: [react(), tailwindcss(), cleanHtmlUrls(['/privacy', '/terms'])],
    server: {
      port: 5173,
      strictPort: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    esbuild: {
      pure: isProd
        ? [
            'console.log',
            'console.warn',
            'console.info',
            'console.debug',
            'console.trace',
          ]
        : [],
    },
  }
})
