import { db } from '@/db/client'
import { Post } from '@/db/schema'
import { CreatePost, CreatePostSchema, PostType } from '@/db/schema/post'
import { publicAction } from '@/trpc/init'
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'
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
export const getPostQuery = (postId: number) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: () => byId(postId),
  })

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

export const listPostQuery = () =>
  queryOptions({
    queryKey: ['posts'],
    queryFn: () => list(),
  })

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

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: create,
    onMutate: async (newPost: CreatePost) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(['posts'])

      // Optimistically update to the new value
      queryClient.setQueryData(['posts'], (old: PostType[]) => [
        newPost,
        ...old,
      ])

      // Return a context object with the snapshotted value
      return { previousPosts }
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (err, newPost, context) => {
      queryClient.setQueryData(['posts'], context?.previousPosts)
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export const useDeletePostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: remove,
    onMutate: async (postId: number) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])
      queryClient.setQueryData(['posts'], (old: PostType[]) =>
        old.filter((p) => p.id !== postId),
      )
      return { previousPosts }
    },
    onError: (err, deletedPostId, context) => {
      queryClient.setQueryData(['posts'], context?.previousPosts)
      // We have to do this here because the component is removed from the DOM
      toast.error(err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      // We have to do this here because the component is removed from the DOM
      toast.success('Post deleted')
    },
  })
}
