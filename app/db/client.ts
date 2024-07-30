import type { Client, Config } from '@libsql/client'
import { createClient } from '@libsql/client'

import { drizzle } from 'drizzle-orm/libsql'

import { env } from '@/env'
import * as schema from './schema'

const options = {
  local: { url: 'file:local.sqlite' },
  remote: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  'local-replica': {
    url: 'file:local.sqlite',
    syncUrl: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
} satisfies Record<typeof env.DATABASE_CONNECTION_TYPE, Config>

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: Client | undefined
}

const config = options[env.DATABASE_CONNECTION_TYPE]
export const client = globalForDb.client ?? createClient(config)
if (env.NODE_ENV !== 'production') globalForDb.client = client

// if (env.DATABASE_CONNECTION_TYPE === "local-replica") {
//   client.sync();
// }
export const db = drizzle(client, { schema })
