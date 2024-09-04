import { auth, github, lucia } from '@/auth'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import { TRPCError } from '@trpc/server'
import { generateState } from 'arctic'
import { parseCookies, setCookie, setHeader } from 'vinxi/http'

export const authLoader = createServerFn('GET', async () => {
  console.log('########### authLoader ###########')
  return await auth()
})

export const logout = createServerFn('POST', async (_, { request }) => {
  console.log('logout')
  const sessionId = parseCookies()[lucia.sessionCookieName]
  if (!sessionId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  await lucia.invalidateSession(sessionId)
  const sessionCookie = lucia.createBlankSessionCookie()
  setCookie(sessionCookie.name, sessionCookie.value, {
    ...sessionCookie.npmCookieOptions(),
  })
  return redirect({
    to: '/',
    throw: false,
  })
})
export const logInWithGithub = createServerFn('POST', async () => {
  setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
  const state = generateState()
  const url = await github.createAuthorizationURL(state, {
    scopes: ['user:email'],
  })
  setCookie('github_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
  setHeader('Location', url.toString())
  setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3000')
  return {
    to: url.toString(),
  }
})
