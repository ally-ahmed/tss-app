import * as postActions from '@/actions/post'
import { CreatePost, PostType } from '@/db/schema/post'
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'

export const getPostQuery = (postId: number) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: () => postActions.byId(postId),
  })

export const listPostQuery = () =>
  queryOptions({
    queryKey: ['posts'],
    queryFn: () => postActions.list(),
  })

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postActions.create,
    // onMutate: async (newPost: CreatePost) => {
    //   // Cancel any outgoing refetches
    //   // (so they don't overwrite our optimistic update)
    //   await queryClient.cancelQueries({ queryKey: ['posts'] })
    //   // Snapshot the previous value
    //   const previousPosts = queryClient.getQueryData(['posts'])

    //   // Optimistically update to the new value
    //   queryClient.setQueryData(['posts'], (old: PostType[]) => [
    //     newPost,
    //     ...old,
    //   ])

    //   // Return a context object with the snapshotted value
    //   return { previousPosts }
    // },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    // onError: (err, newPost, context) => {
    //   queryClient.setQueryData(['posts'], context?.previousPosts)
    // },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
export const useDeletePostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postActions.remove,
    onMutate: async (postId: string) => {
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
