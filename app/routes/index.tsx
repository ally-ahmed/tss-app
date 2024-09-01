import { authLoader, logInWithGithub, logout } from '@/actions/auth'
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
import {
  listPostQuery,
  useCreatePostMutation,
  useDeletePostMutation,
} from '@/hooks/post'
import { useMutation } from '@/hooks/useMutation'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Github, Loader2, Trash } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/')({
  component: Home,
  beforeLoad: async () => {
    return await authLoader()
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(listPostQuery())
    return {
      randomNumber: Math.random(),
    }
  },
})

function Home() {
  const posts = useSuspenseQuery(listPostQuery())
  const { randomNumber } = Route.useLoaderData()
  const gradients = [
    `from-rose-500 to-yellow-500`,
    `from-yellow-500 to-teal-500`,
    `from-teal-500 to-violet-500`,
    `from-blue-500 to-pink-500`,
  ]
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section id="open-source" className="container py-8 md:py-12 lg:py-12">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4">
            <h2 className="text-3xl leading-[1.1] sm:text-3xl md:text-6xl tracking-tight font-extrabold">
              <span
                className={cn(
                  'text-transparent bg-clip-text bg-gradient-to-r',
                  gradients[Math.floor(randomNumber * gradients.length)],
                )}
              >
                Create TSS App
              </span>{' '}
              🏝️
            </h2>
            <a
              href="https://github.com/ally-ahmed/tss-app"
              target="_blank"
              rel="noreferrer"
              className="flex pb-2"
            >
              <div className="flex h-10 w-10 items-center justify-center space-x-2 rounded-md border border-muted bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-foreground"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                </svg>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 border-y-8 border-l-0 border-r-8 border-solid border-muted border-y-transparent"></div>
                <div className="flex h-10 items-center rounded-md border border-muted bg-muted px-4 font-medium">
                  Star on GitHub
                </div>
              </div>
            </a>
            <Auth />
            <PostForm />
            <PostList posts={posts.data as PostType[]} />
          </div>
        </section>
      </main>
    </div>
  )
}
function Auth() {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const { mutate: logInMutation, status: logInStatus } = useMutation({
    fn: logInWithGithub,
    onSettled: () => {
      // setIsLoggingIn(false)
    },
  })
  const logOutMutation = useMutation({
    fn: logout,
    onSettled: () => {
      setIsLoggingOut(false)
    },
  })
  const { user, session } = Route.useRouteContext()
  return (
    <>
      {!user ? (
        <Button
          disabled={logInStatus === 'pending'}
          onClick={async () => {
            setIsLoggingIn(true)
            await logInMutation()
          }}
        >
          {}
          {isLoggingIn ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4" />
          )}
          Sign In with Github
        </Button>
      ) : (
        <Button
          disabled={logOutMutation.status === 'pending'}
          onClick={() => {
            setIsLoggingOut(true)
            logOutMutation.mutate()
          }}
        >
          {user ? (
            <>{user.name || user.email}</>
          ) : isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}{' '}
          Logout
        </Button>
      )}
    </>
  )
}
type PostProps = Omit<PostType, 'createdAt' | 'updatedAt'>
function Post({ title, body, id, user }: PostProps) {
  const { user: currentUser } = Route.useRouteContext()
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
        <p className="text-sm text-muted-foreground">
          {user.name || user.email}
        </p>
        {currentUser?.id === user.id && (
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
        )}
      </CardFooter>
    </Card>
  )
}
function PostList({ posts }: { posts: PostType[] }) {
  return (
    <div className="flex flex-col gap-y-4 w-full max-w-3xl">
      {posts.length > 0 ? (
        posts.map((post, index) => (
          <Post
            key={index}
            title={post.title}
            body={post.body}
            id={post.id}
            user={post.user}
          />
        ))
      ) : (
        <h3 className="pt-8 text-muted-foreground text-2xl text-center font-semibold">
          No posts yet
        </h3>
      )}
    </div>
  )
}

function PostForm() {
  const { user, session } = Route.useRouteContext()
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
                    <Input disabled={!user} placeholder="Title" {...field} />
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
                    <Textarea disabled={!user} placeholder="Body" {...field} />
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
              disabled={createPost.isPending || !user}
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : !user ? (
                <>Sign in to create</>
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
