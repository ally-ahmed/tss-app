import { defineConfig } from '@tanstack/start/config'

import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  vite: {
    plugins: () => [
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
}).addRouter({
  name: 'api',
  type: 'http',
  base: '/api',
  target: 'server',
  handler: 'app/api/index.ts',
  plugins: () => [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
})
