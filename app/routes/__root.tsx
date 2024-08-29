import { Toaster } from '@/components/ui/sonner'
import ogImage from '@/images/og.png'
import { seo } from '@/lib/seo'
import { cn } from '@/lib/utils'
import '@/styles/globals.css'
import appCss from '@/styles/globals.css?url'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  Outlet,
  ScrollRestoration,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { Body, Head, Html, Meta, Scripts } from '@tanstack/start'
import * as React from 'react'

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null // Render nothing in production
  : React.lazy(() =>
      // Lazy load in development
      import('@tanstack/router-devtools').then((res) => ({
        default: res.TanStackRouterDevtools,
        // For Embedded Mode
        // default: res.TanStackRouterDevtoolsPanel
      })),
    )
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  meta: () => [
    {
      charSet: 'utf-8',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    ...seo({
      title: 'Create TSS App',
      description: 'TanStack Start Starter Project',
      image: ogImage,
      keywords:
        'tanstack start,tanstack,react,reactjs,react query,open source,open source software,oss,software',
    }),
  ],
  links: () => [{ rel: 'stylesheet', href: appCss }],
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Head>
        <Meta />
      </Head>
      <Body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          // fontSans.variable,
          // fontHeading.variable,
        )}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <ScrollRestoration />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </Body>
    </Html>
  )
}
