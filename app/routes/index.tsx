import {
  listPostQuery,
  useCreatePostMutation,
  useDeletePostMutation,
} from '@/actions/posts'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CreatePostSchema, PostType } from '@/db/schema/post'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Trash } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/')({
  component: Home,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(listPostQuery())
  },
})

function Home() {
  const posts = useSuspenseQuery(listPostQuery())
  console.log('home index.tsx')
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section id="open-source" className="container py-8 md:py-12 lg:py-12">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4">
            <h2 className="text-3xl leading-[1.1] sm:text-3xl md:text-6xl tracking-tight font-extrabold">
              Create TSS App 🏝️
            </h2>
            <PostForm />
            <PostList posts={posts.data as PostType[]} />
          </div>
        </section>
      </main>
    </div>
  )
}

type PostProps = Omit<PostType, 'createdAt' | 'updatedAt'>
function Post({ title, body, author, id }: PostProps) {
  const deletePostMutation = useDeletePostMutation()
  const deletePost = (e: React.MouseEvent<HTMLButtonElement>) => {
    deletePostMutation.mutate(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg capitalize">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">{author}</p>
        <Button
          variant="outline"
          size="icon"
          disabled={deletePostMutation.isPending}
          onClick={deletePost}
        >
          {deletePostMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            </>
          ) : (
            <Trash className="h-4 w-4 stroke-red-600" />
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
function PostList({ posts }: { posts: PostType[] }) {
  return (
    <div className="flex flex-col gap-y-4 w-full max-w-3xl">
      {posts.map((post, index) => (
        // Optimistic update so id is not known. This is throwing an error
        <Post
          key={index}
          title={post.title}
          body={post.body}
          author={post.author}
          id={post.id}
        />
      ))}
    </div>
  )
}

function PostForm() {
  const form = useForm<z.infer<typeof CreatePostSchema>>({
    resolver: zodResolver(CreatePostSchema),
    defaultValues: {
      title: '',
      body: '',
    },
  })
  const createPost = useCreatePostMutation()

  function onSubmit(values: z.infer<typeof CreatePostSchema>) {
    createPost.mutate(values, {
      onSuccess: () => {
        form.reset()
        toast.success('Post created')
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }
  return (
    <Card className="w-full max-w-3xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className=" pt-6">
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Body" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              type="submit"
              disabled={createPost.isPending}
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>Create</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
