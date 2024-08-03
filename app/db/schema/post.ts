// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import type { InferSelectModel } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export const Post = sqliteTable(
  'post',
  {
    id: int('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    title: text('name', { length: 256 }).notNull(),
    body: text('body').notNull(),
    author: text('author', { length: 256 }).notNull(),
    createdAt: int('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int('updated_at', { mode: 'timestamp' })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (post) => ({
    titleIndex: index('title_idx').on(post.title),
  }),
)
export type PostType = InferSelectModel<typeof Post>
export const CreatePostSchema = createInsertSchema(Post, {
  title: z
    .string({ required_error: 'Title is required.' })
    .min(1, 'Title is required.')
    .max(256, 'Title is too long.'),
  body: z
    .string({ required_error: 'Body is required.' })
    .min(1, 'Body is required.')
    .max(256, 'Body is too long.'),
}).pick({ title: true, body: true })
export type CreatePost = z.infer<typeof CreatePostSchema>
