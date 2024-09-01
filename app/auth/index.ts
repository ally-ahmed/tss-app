import { db } from '@/db/client'
import type { SessionType, UserType } from '@/db/schema/auth'
import { Session, User } from '@/db/schema/auth'
import { GitHub } from 'arctic'
import { eq } from 'drizzle-orm'
import { generateSessionId, Lucia } from 'lucia'

import { env } from '@/env'
import Headers, { Cookie } from '@mjackson/headers'
import type { DatabaseAdapter, SessionAndUser } from 'lucia'
import { storage } from '../lib/cache'
import { cachedFunction } from '../lib/cache'

const adapter: DatabaseAdapter<SessionType, UserType> = {
  getSessionAndUser: async (
    sessionId: string,
  ): Promise<SessionAndUser<SessionType, UserType>> => {
    const result =
      (await db
        .select({
          user: User,
          session: Session,
        })
        .from(Session)
        .innerJoin(User, eq(Session.userId, User.id))
        .where(eq(Session.id, sessionId))
        .get()) ?? null
    if (result === null) {
      return { session: null, user: null }
    }
    return result
  },
  deleteSession: async (sessionId: string): Promise<void> => {
    db.delete(Session).where(eq(Session.id, sessionId)).run()
  },
  updateSessionExpiration: async (
    sessionId: string,
    expiresAt: Date,
  ): Promise<void> => {
    db.update(Session)
      .set({
        expiresAt,
      })
      .where(eq(Session.id, sessionId))
      .run()
  },
}

export const lucia = new Lucia(adapter, {
  secureCookies: !import.meta.env.DEV,
})

export const github = new GitHub(
  env.GITHUB_CLIENT_ID,
  env.GITHUB_CLIENT_SECRET,
  {},
)

export function createSession(userId: string): SessionType {
  const session: SessionType = {
    id: generateSessionId(),
    userId: userId,
    expiresAt: lucia.getNewSessionExpiration(),
    loginAt: new Date(),
  }
  db.insert(Session).values(session).run()
  return session
}

export const auth = async (sessionId: string | null) => {
  console.log(`########### calling auth ${sessionId} ###########`)
  if (!sessionId) {
    return {
      user: null,
      session: null,
      headers: new Headers(),
    }
  }
  const result = await lucia.validateSession(sessionId)
  let headers = new Headers()
  if (
    result.session !== null &&
    Date.now() >= result.session.expiresAt.getTime()
  ) {
    const session = createSession(result.user.id)
    const sessionCookie = lucia.createSessionCookie(
      result.session.id,
      session.expiresAt,
    )
    headers.setCookie = sessionCookie.serialize()
  }
  if (!result.session) {
    const sessionCookie = lucia.createBlankSessionCookie()
    headers.setCookie = sessionCookie.serialize()
  }
  return {
    ...result,
    headers,
  }
}

export function getSessionIdFromCookie(cookie: Cookie) {
  console.log('lucia.sessionCookieName', lucia.sessionCookieName)
  const sessionId = cookie.get(lucia.sessionCookieName) ?? null
  return sessionId
}
// export const authLoader = createServerFn('GET', async (_, { request }) => {})
export type Auth = Omit<Awaited<ReturnType<typeof auth>>, 'headers'>
