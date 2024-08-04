import { db } from '@/db/client'
import { Post } from '@/db/schema'
import { CreatePostSchema } from '@/db/schema/post'
import { publicAction } from '@/trpc/init'
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const byId = createServerFn(
  'GET',
  publicAction.input(z.number()).query(async ({ input: postId }) => {
    console.log(`Fetching post with id ${postId}...`)

    const post = await db.query.Post.findFirst({
      where: (fields, { eq }) => eq(fields.id, postId),
    })
    if (!post) throw notFound()

    return post
  }),
)

export const list = createServerFn(
  'GET',
  publicAction.query(async () => {
    console.log('Fetching posts...')

    const posts = await db.query.Post.findMany({
      orderBy: (fields, { desc }) => desc(fields.createdAt),
    })

    return posts
  }),
)

export const remove = createServerFn(
  'POST',
  publicAction.input(z.number()).mutation(async ({ input: postId }) => {
    console.log(`Deleting post with id ${postId}...`)
    return await db
      .delete(Post)
      .where(eq(Post.id, postId))
      .returning({ postId: Post.id })
  }),
)

export const create = createServerFn(
  'POST',
  publicAction.input(CreatePostSchema).mutation(async ({ input }) => {
    console.log(`Creating post with title ${input.title}...`)
    const post = await db
      .insert(Post)
      .values({ title: input.title, body: input.body, author: 'John Doe' })

    return Number(post.lastInsertRowid)
  }),
)
