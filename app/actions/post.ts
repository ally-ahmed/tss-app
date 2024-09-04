import { CreatePostSchema, Post } from '@/db/schema/post'
import { protectedProcedure, publicProcedure } from '@/trpc/init'
import { createServerFn } from '@tanstack/start'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export const byId = createServerFn(
  'GET',
  publicProcedure.input(z.string()).query(async ({ input: postId, ctx }) => {
    console.log(`Fetching post with id ${postId}...`)

    const post = await ctx.db.query.Post.findFirst({
      where: (fields, { eq }) => eq(fields.id, postId),
    })
    if (!post) throw new TRPCError({ code: 'NOT_FOUND' })
    return post
  }),
)

export const list = createServerFn(
  'GET',
  publicProcedure.query(async ({ ctx }) => {
    console.log('Fetching posts...')
    const posts = await ctx.db.query.Post.findMany({
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      with: {
        user: true,
      },
    })

    return posts
  }),
)

export const remove = createServerFn(
  'POST',
  protectedProcedure
    .input(z.string())
    .mutation(async ({ input: postId, ctx }) => {
      console.log(`Deleting post with id ${postId}...`)
      const post = await ctx.db.query.Post.findFirst({
        where: (fields, { eq }) =>
          and(eq(fields.id, postId), eq(fields.userId, ctx.auth.user.id)),
      })
      if (!post) throw new TRPCError({ code: 'NOT_FOUND' })
      return await ctx.db
        .delete(Post)
        .where(and(eq(Post.id, postId), eq(Post.userId, ctx.auth.user.id)))
        .returning({ postId: Post.id })
    }),
)

export const create = createServerFn(
  'POST',
  protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ input, ctx }) => {
      console.log(`Creating post with title ${input.title}...`)
      const post = await ctx.db.insert(Post).values({
        title: input.title,
        body: input.body,
        userId: ctx.auth.user.id,
      })

      return Number(post.lastInsertRowid)
    }),
)
