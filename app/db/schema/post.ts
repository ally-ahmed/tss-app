// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import type { InferSelectModel } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const Post = sqliteTable(
  'post',
  {
    id: int('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    title: text('name', { length: 256 }),
    body: text('body'),
    author: text('author'),
    createdAt: int('created_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: int('updated_at', { mode: 'timestamp' }).$onUpdate(
      () => new Date(),
    ),
  },
  (post) => ({
    titleIndex: index('title_idx').on(post.title),
  }),
)
export type PostType = InferSelectModel<typeof Post>
