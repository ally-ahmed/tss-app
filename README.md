# TSS App 

Tanstart Start simple starter project.


![App Screenshot](./app-screenshot.png)


## Tech Stack

- [Tanstack Start](https://tanstack.com/router/latest/docs/framework/react/guide/tanstack-start#tanstack-start)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com/)
- [tRPC](https://trpc.io)
- [Drizzle](https://orm.drizzle.team)
- [Lucia Auth - Adapters Removed RFC](https://github.com/lucia-auth/lucia/issues/1639)


## Acknowledgements

 - [Julius's tss app with tRPC implementation.](https://github.com/juliusmarminge/tss)
 - [tanstack.com for the useMutation wrapper to help with redirects.](https://github.com/TanStack/tanstack.com/blob/b7e54b4fdec169b86dc45b99eb74baa44df998f5/app/hooks/useMutation.ts)
 - [dotnize beat me to it and ceated a starter project. I liked their API routes structure so the API routes for auth is inspired by theirs.](https://github.com/dotnize/tanstarter)
 - [ethanniser drizzle config to handle local, remote, local-replica for libsql.](https://github.com/ethanniser/beth-b2b-saas/blob/main/src/db/primary/index.ts)
 - [create-t3-app I am sure I copied some stuff from here as well](https://github.com/t3-oss/create-t3-app)
 - [UI inspired by again the legend Julius's create-t3-turbo](https://github.com/t3-oss/create-t3-turbo)


## Getting Started

Clone project

```bash
  git clone git@github.com:ally-ahmed/tss-app.git
  cd tss-app
```
    
Install depndencies

```bash
pnpm install
```

Create db and tables
```bash
pnpm db:push
```

Run app
```bash
pnpm dev
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file


`GITHUB_CLIENT_ID=""`

`GITHUB_CLIENT_SECRET=""`



## TODO

- Cache auth validation

- Maybe I don't need superjson

- Custom fonts

- Maybe look at ESLint, Prettier or even jump ship and use biomejs


## challenges/skill issue

- CSS flicker on hard refresh (ctrl/command + shift + r) so I had to import the css like this then it stopped.
```ts
import '@/styles/globals.css'
import appCss from '@/styles/globals.css?url'
```
and also a link to Route options
```ts
  links: () => [{ rel: 'stylesheet', href: appCss }],
```
- useMutation hook considers a server function that return a redirect as an error so you get the result of the redirect in the error channel.
- [mjackson/headers](https://github.com/mjackson/remix-the-web/tree/main/packages/headers) library with redirect doesn't set the cookie so the following doesn't work
```ts
const state = generateState()
const url = await github.createAuthorizationURL(state, {
    scopes: ['user:email'],
})
const headers = new Headers()
headers.setCookie = new SetCookie({
    name: 'github_oauth_state',
    value: state,
    path: '/',
    secure: process.env.NODE_ENV === 'production' || undefined,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'Lax',
})
return redirect({
    to: "/",
    headers,
})
```
instead I need to do
```ts
return redirect({
    to: url.toString(),
    headers: {
        'Set-Cookie': headers.setCookie.toString(),
    },
})
```

