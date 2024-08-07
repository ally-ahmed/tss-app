## Features
- TRPC
- Shadcn
- API routes for callback URLs and webhooks

## Create Turso DB
[Turso Quickstart (TypeScript / JS)](https://docs.turso.tech/sdk/ts/quickstart)

Create database in US east
```bash
    turso db create <database-name> --location iad
```
Get the database URL:
```
    turso db show --url <database-name>
```
Get the database authentication token:
```
    turso db tokens create <database-name>
```
```txt
#.env
# Drizzle
DATABASE_URL=""
DATABASE_CONNECTION_TYPE=""
DATABASE_AUTH_TOKEN=""
```

#### TODO
- ✅ Get counter demo app 
- ✅ Deploy to vercel
- ✅ tailwindcss + shadcn
- ✅ Add seo util
- ✅ add react query
- ✅ Drizzle + Turso + Trpc + env.ts
- 🚧 UI functionality
- 🚧 setup Eslint + Prettier
- 🚧 Set usememo on routes to avoid double renders need to confirm if this fixed or not
- 🚧 Test hosting on Cloudflare
- 🚧 Dockerize so that can host anywhere
- 🚧 serverFunction

### Next Time TODO
- remove super JSON, I don't thin we need it at the moment
- Add font
- Add auth
- Read up on preload and navigation

### Gotchas
- IDE error on routerWIthQueryClient so added ts-ignore on that line

#### Learnt
- Namespace vs Modularization https://www.reddit.com/r/typescript/comments/146qecv/using_namespaces_to_avoid_object_creation/
- Double renders
  https://discord.com/channels/719702312431386674/1007702008448426065/1260562722408628336
  https://github.com/TanStack/router/issues/182
#### Questions
- Is there a risk of leaking data/functions definitions from the server to the client? Looking at the source in the browser of the deployed application I am not seeing any leaks.
- Do we ned a loading state for post list? 
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
- Do I need trp?, I guess we get the benefit of the middlewares also easily do input validations insteady of calling `schema.parse()`
- Calling a serverFn from a loader and access the data vs using tanstack query `queryClient.ensureQueryData` and `useSuspenseQuery` . I need to read up Data loading.
- Is it better to have the `defaultPreload: 'intent',` or set the preload on a link by link basis? Need to read up tanstack-router docs on navigation.
- Is it possible to have dynamic og images?
- start-trellaux
- Can I stream data ? or a RSC e.g. with ai-sdk
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
- hono router https://github.com/orgs/honojs/discussions/2606 for callback url routing or just any API endpoints accessed from outside the app.