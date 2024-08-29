// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { genId } from '@/lib/utils'
import { relations, sql } from 'drizzle-orm'
import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { SelectUserSchema, User } from './auth'

export const Post = sqliteTable(
  'post',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => genId()),
    title: text('name', { length: 256 }).notNull(),
    body: text('body').notNull(),
    userId: text('user_id', { length: 255 })
      .notNull()
      .references(() => User.id),
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

export const UserRelations = relations(User, ({ many }) => ({
  posts: many(Post),
}))

export const PostsRelations = relations(Post, ({ one }) => ({
  user: one(User, { fields: [Post.userId], references: [User.id] }),
}))

const PostSelectSchema = createSelectSchema(Post)
  .omit({ userId: true, createdAt: true, updatedAt: true })
  .extend({
    user: SelectUserSchema,
  })
export type PostType = z.infer<typeof PostSelectSchema>

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
