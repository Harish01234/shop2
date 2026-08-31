import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@base-ui/react/avatar',
      '@base-ui/react/button',
      '@base-ui/react/dialog',
      '@base-ui/react/menu',
      '@base-ui/react/separator',
      '@base-ui/react/tooltip',
      '@better-auth/core/env',
      '@better-auth/core/error',
      '@better-auth/core/utils/string',
      '@better-auth/core/utils/url',
      '@better-fetch/fetch',
      '@tanstack/router-core',
      '@tanstack/router-core/isServer',
      '@tanstack/router-core/ssr/client',
      'better-auth/react',
      'class-variance-authority',
      'clsx',
      'defu',
      'lucide-react',
      'nanostores',
      'seroval',
      'tailwind-merge',
    ],
  },
  plugins: [
    devtools({ removeDevtoolsOnBuild: true }),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
