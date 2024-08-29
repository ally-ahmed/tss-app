import { auth, getSessionIdFromCookie, github, lucia } from '@/auth'
import Headers, { SetCookie } from '@mjackson/headers'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import { TRPCError } from '@trpc/server'
import { generateState } from 'arctic'

export const authLoader = createServerFn('GET', async (_, { request }) => {
  console.log('########### authLoader ###########')
  const requestHeaders = new Headers(request.headers)
  const sessionId = getSessionIdFromCookie(requestHeaders.cookie)
  return await auth(sessionId)
})

export const logInWithGithub = createServerFn('POST', async () => {
  console.log('logInWithGithub')
  try {
    const state = generateState()
    const url = await github.createAuthorizationURL(state, {
      scopes: ['user:email'],
    })
    const setCookie = new SetCookie({
      name: 'github_oauth_state',
      value: state,
      path: '/',
      secure: process.env.NODE_ENV === 'production' || undefined,
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'Lax',
    }).toString()
    const headers = new Headers()
    headers.setCookie = setCookie
    // TODO headers doesn't work with redirect
    return redirect({
      to: url.toString(),
      headers: {
        'Set-Cookie': headers.setCookie.toString(),
      },
      throw: false,
    })
  } catch (error) {
    console.error('Error logging in with GitHub:', error)
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error })
  }
})

export const logout = createServerFn('POST', async (_, { request }) => {
  console.log('logout')
  const requestHeaders = new Headers(request.headers)
  const sessionId = getSessionIdFromCookie(requestHeaders.cookie)
  if (!sessionId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  await lucia.invalidateSession(sessionId)
  const sessionCookie = lucia.createBlankSessionCookie()
  return redirect({
    to: '/',
    headers: {
      'Set-Cookie': sessionCookie.serialize(),
    },
    throw: false,
  })
})
