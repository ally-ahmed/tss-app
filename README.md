# TSS App 🏝️

Tanstack Start simple starter project.


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
- [shadcn-ui/taxonomy](https://github.com/shadcn-ui/taxonomy/tree/651f984e52edd65d40ccd55e299c1baeea3ff017)

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
- Custom fonts

- Investigate if there is a way to return a redirect from the server function without it being an error and 
it automatically does the redirect in the client. Tanner suggest `userServerFn` should work and it does for only URLs within the app but not external URL. So the `useServerFn` works for logout but not for Github login. And even with the logout it still goes throw the error channel

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
```

