import { isNotFound, isRedirect } from '@tanstack/react-router'
import { getTRPCErrorFromUnknown, initTRPC, TRPCError } from '@trpc/server'
import type {
  CallerOverride,
  CreateContextCallback,
  ErrorHandlerOptions,
  MaybePromise,
  Simplify,
} from '@trpc/server/unstable-core-do-not-import'

const createContext = () => ({
  // TODO
  foo: 'bar',
})

const t = initTRPC.context<typeof createContext>().create()

export const serverFnProcedure = t.procedure.experimental_caller(
  tssCaller({
    artificalDelay: t._config.isDev ? Math.random() * 200 + 100 : null,
    createContext,
  }),
)
export const publicAction = serverFnProcedure

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
