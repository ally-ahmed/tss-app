import { hash } from 'ohash'
import type { Storage, StorageValue } from 'unstorage'
import { createStorage, prefixStorage } from 'unstorage'

const globalForStorage = globalThis as unknown as {
  storage: Storage | undefined
}
export const storage = globalForStorage.storage ?? createStorage()

export interface CacheEntry<T = any> {
  value?: T
  expires?: number
  mtime?: number
  integrity?: string
}

export interface CacheOptions<T = any> {
  name?: string
  getKey?: (...args: any[]) => string | Promise<string>
  transform?: (entry: CacheEntry<T>, ...args: any[]) => any
  validate?: (entry: CacheEntry<T>) => boolean
  shouldInvalidateCache?: (...args: any[]) => boolean | Promise<boolean>
  shouldBypassCache?: (...args: any[]) => boolean | Promise<boolean>
  group?: string
  integrity?: any
  /**
   * Number of seconds to cache the response. Defaults to 1.
   */
  maxAge?: number
  swr?: boolean
  staleMaxAge?: number
  base?: string
}

export function useStorage<T extends StorageValue = StorageValue>(
  base = '',
): Storage<T> {
  return base ? prefixStorage<T>(storage, base) : storage
}

const defaultCacheOptions = {
  name: '_',
  base: '/cache',
  swr: true,
  maxAge: 1,
}

export function defineCachedFunction<T, ArgsT extends unknown[] = any[]>(
  fn: (...args: ArgsT) => T | Promise<T>,
  opts: CacheOptions<T> = {},
): (...args: ArgsT) => Promise<T> {
  opts = { ...defaultCacheOptions, ...opts }

  const pending: { [key: string]: Promise<T> } = {}

  // Normalize cache params
  const group = opts.group || 'nitro/functions'
  const name = opts.name || fn.name || '_'
  const integrity = opts.integrity || hash([fn, opts])
  const validate = opts.validate || ((entry) => entry.value !== undefined)

  async function get(
    key: string,
    resolver: () => T | Promise<T>,
    shouldInvalidateCache?: boolean,
  ): Promise<CacheEntry<T>> {
    // Use extension for key to avoid conflicting with parent namespace (foo/bar and foo/bar/baz)
    const cacheKey = [opts.base, group, name, key + '.json']
      .filter(Boolean)
      .join(':')
      .replace(/:\/$/, ':index')

    let entry: CacheEntry<T> =
      ((await useStorage().getItem(cacheKey)) as unknown) || {}

    // https://github.com/unjs/nitro/issues/2160
    if (typeof entry !== 'object') {
      entry = {}
      const error = new Error('Malformed data read from cache.')
      console.error('[nitro] [cache]', error)
    }

    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1000
    if (ttl) {
      entry.expires = Date.now() + ttl
    }

    const expired =
      shouldInvalidateCache ||
      entry.integrity !== integrity ||
      (ttl && Date.now() - (entry.mtime || 0) > ttl) ||
      validate(entry) === false

    const _resolve = async () => {
      const isPending = pending[key]
      if (!isPending) {
        if (
          entry.value !== undefined &&
          (opts.staleMaxAge || 0) >= 0 &&
          opts.swr === false
        ) {
          // Remove cached entry to prevent using expired cache on concurrent requests
          entry.value = undefined
          entry.integrity = undefined
          entry.mtime = undefined
          entry.expires = undefined
        }
        pending[key] = Promise.resolve(resolver())
      }

      try {
        entry.value = await pending[key]
      } catch (error) {
        // Make sure entries that reject get removed.
        if (!isPending) {
          delete pending[key]
        }
        // Re-throw error to make sure the caller knows the task failed.
        throw error
      }

      if (!isPending) {
        // Update mtime, integrity + validate and set the value in cache only the first time the request is made.
        entry.mtime = Date.now()
        entry.integrity = integrity
        delete pending[key]
        if (validate(entry) !== false) {
          const promise = useStorage()
            .setItem(cacheKey, entry)
            .catch((error) => {
              console.error(`[nitro] [cache] Cache write error.`, error)
            })
        }
      }
    }

    const _resolvePromise = expired ? _resolve() : Promise.resolve()

    if (entry.value === undefined) {
      await _resolvePromise
    }

    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[nitro] [cache] SWR handler error.`, error)
      })
      return entry
    }

    return _resolvePromise.then(() => entry)
  }

  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args)
    if (shouldBypassCache) {
      return fn(...args)
    }
    const key = await (opts.getKey || getKey)(...args)
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args)
    const entry = await get(key, () => fn(...args), shouldInvalidateCache)
    let value = entry.value
    if (opts.transform) {
      value = (await opts.transform(entry, ...args)) || value
    }
    return value as T
  }
}
function getKey(...args: unknown[]) {
  return args.length > 0 ? hash(args, {}) : ''
}
export const cachedFunction = defineCachedFunction
