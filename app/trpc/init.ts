import type { Auth } from '@/auth'
import { auth } from '@/auth'
import { db } from '@/db/client'
import { isNotFound, isRedirect } from '@tanstack/react-router'
import { getTRPCErrorFromUnknown, initTRPC, TRPCError } from '@trpc/server'
import type {
  CallerOverride,
  CreateContextCallback,
  ErrorHandlerOptions,
  MaybePromise,
  Simplify,
} from '@trpc/server/unstable-core-do-not-import'
import superjson from 'superjson'

export const createTRPCContext = async (opts: { auth: Auth }) => {
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
    createContext: async () => createTRPCContext({ auth: await auth() }),
  }),
)
export const publicProcedure = serverFnProcedure
export const protectedProcedure = serverFnProcedure.use(({ ctx, next }) => {
  if (!ctx.auth?.session || !ctx.auth.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      auth: {
        session: ctx?.auth?.session,
        user: ctx?.auth?.user,
      },
    },
  })
})

/**
 * Lib code
 */
export function tssCaller<TContext, TMeta>(
  config: Simplify<
    {
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
    } & CreateContextCallback<TContext, () => MaybePromise<TContext>>
  >,
): CallerOverride<TContext> {
  const createContext = async (): Promise<TContext> => {
    return config?.createContext?.() ?? ({} as TContext)
  }
  return async (opts) => {
    const path = config.pathExtractor?.({ meta: opts._def.meta as TMeta }) ?? ''
    const ctx: TContext = await createContext().catch((cause) => {
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
