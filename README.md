
#### TODO
- ✅ Get counter demo app 
- ✅ Deploy to vercel
- ✅ tailwindcss + shadcn
- ✅ Add seo util
- ✅ add react query
- 🚧 setup Eslint + Prettier
- 🚧 Drizzle + Turso + Trpc + env.ts
- 🚧 Set usememo on routes to avoid double renders
- 🚧 Dockerize

#### Learnt
- Namespace vs Modularization https://www.reddit.com/r/typescript/comments/146qecv/using_namespaces_to_avoid_object_creation/
- Double renders
  https://discord.com/channels/719702312431386674/1007702008448426065/1260562722408628336
  https://github.com/TanStack/router/issues/182
#### Questions
- Why do we need to set in router.tsx
```
 defaultErrorComponent: DefaultCatchBoundary,
 defaultNotFoundComponent: () => <NotFound />,
```
and also in _root.tsx
```
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
  notFoundComponent: () => <NotFound />,
```
I get that we can do this on a specific route if needed to have a custom one for a route. 
But I think the one in router.tsx should be enough, probably enough need to investigate and learn. 
- Do I need trp?, I guess we get the benefit of the middlewares also easily do input validations
- Calling a serverFn from a loader and access the data vs using tanstack query `queryClient.ensureQueryData` and `useSuspenseQuery`
- Is it better to have the `defaultPreload: 'intent',` or set the preload on a link by link basis?
- Is it possible to have dynamic og images?
- start-trellaux
```ts
export function createRouter() {
  if (typeof document !== 'undefined') {
    notifyManager.setScheduler(window.requestAnimationFrame)
  }

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnReconnect: () => !queryClient.isMutating(),
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast(error.message, { className: 'bg-red-500 text-white' })
      },
      onSettled: () => {
        if (queryClient.isMutating() === 1) {
          return queryClient.invalidateQueries()
        }
      },
    }),
  })

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: 'intent',
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
    }),
    queryClient,
  )

  return router
}
```
IDE error on routerWIthQueryClient