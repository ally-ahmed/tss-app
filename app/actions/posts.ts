'use server'
import { db } from '@/db/client'
import { Post } from '@/db/schema'
import { publicAction } from '@/trpc/init'
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
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
      orderBy: (fields, { asc }) => asc(fields.createdAt),
    })

    return posts
  }),
)

export const create = createServerFn(
  'POST',
  publicAction
    .input(z.object({ title: z.string(), body: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`Creating post with title ${input.title}...`)

      const post = await db.insert(Post).values({
        title: input.title,
        body: input.body,
      })

      return Number(post.lastInsertRowid)
    }),
)
