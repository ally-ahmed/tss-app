import type { Auth } from '@/auth'
import { auth, getSessionIdFromCookie } from '@/auth'
import { db } from '@/db/client'
import Headers from '@mjackson/headers'
import { isNotFound, isRedirect } from '@tanstack/react-router'
import { getTRPCErrorFromUnknown, initTRPC, TRPCError } from '@trpc/server'
import type {
  CallerOverride,
  ErrorHandlerOptions,
  Simplify,
} from '@trpc/server/unstable-core-do-not-import'
import superjson from 'superjson'

export const createTRPCContext = async (opts: {
  headers: Headers
  auth: Auth
}) => {
  return {
    db,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

export const serverFnProcedure = t.procedure.experimental_caller(
  tssCaller({
    artificalDelay: t._config.isDev ? Math.random() * 200 + 100 : null,
  }),
)
export const publicAction = serverFnProcedure
export const protectedAction = serverFnProcedure.use(({ ctx, next }) => {
  if (!ctx.auth?.session || !ctx.auth.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      auth: {
        session: ctx?.auth?.session,
        user: ctx?.auth?.user,
        headers: ctx.headers,
      },
    },
  })
})

/**
 * Lib code
 */
export function tssCaller<TContext, TMeta>(
  config: Simplify<{
    /**
     * Artifical delay in ms
     */
    artificalDelay?: number | null
    /**
     * Extract the path from the procedure metadata
     */
    pathExtractor?: (opts: { meta: TMeta }) => string
    /**
     * Called when an error occurs in the handler
     */
    onError?: (opts: ErrorHandlerOptions<TContext>) => void
  }>,
): CallerOverride<TContext> {
  return async (opts) => {
    const path = config.pathExtractor?.({ meta: opts._def.meta as TMeta }) ?? ''
    const serverFnArgs = opts.args[1] as { method: string; request: Request }
    const request = serverFnArgs.request
    const requestHeaders = new Headers(request.headers)
    const sessionId = getSessionIdFromCookie(requestHeaders.cookie)
    const { user, session, headers } = await auth(sessionId)
    // Create context
    const createContext = async (): Promise<TContext> => {
      return createTRPCContext({
        headers,
        auth: { user, session },
      }) as TContext
    }
    const ctx = await createContext().catch((cause) => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create context',
        cause,
      })

      throw error
    })

    const input = opts.args[0]

    const handleError = (cause: unknown) => {
      /**
       * Rethrow Tanstack Router errors
       */
      if (cause instanceof Error && isNotFound(cause.cause)) throw cause.cause
      if (cause instanceof Error && isRedirect(cause.cause)) throw cause.cause

      const error = getTRPCErrorFromUnknown(cause)

      config.onError?.({
        ctx,
        error,
        input,
        path,
        type: opts._def.type,
      })

      throw error
    }

    if (typeof config.artificalDelay === 'number') {
      await new Promise((r) => setTimeout(r, config.artificalDelay!))
    }

    return await opts
      .invoke({
        type: opts._def.type,
        ctx,
        getRawInput: async () => input,
        path,
        input,
      })
      .catch(handleError)
  }
}
