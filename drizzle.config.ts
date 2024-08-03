import type { Config } from 'drizzle-kit'

import { env } from '@/env'

export default {
  schema: './app/db/schema/index.ts',
  out: './app/db/migrations',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN!,
  },
  verbose: true,
} satisfies Config
