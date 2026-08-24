import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth'

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

const sessionCache = new Map<string, Promise<AuthSession | null>>()

function sessionCacheKey(headers: Headers) {
  return headers.get('cookie') ?? ''
}

export async function getCachedSession() {
  const headers = getRequestHeaders()
  const key = sessionCacheKey(headers)
  const cached = sessionCache.get(key)

  if (cached) {
    return cached
  }

  const pending = auth.api.getSession({ headers }).then((session) => session ?? null)
  sessionCache.set(key, pending)
  pending.finally(() => {
    setTimeout(() => {
      if (sessionCache.get(key) === pending) {
        sessionCache.delete(key)
      }
    }, 2_000)
  })

  return pending
}
