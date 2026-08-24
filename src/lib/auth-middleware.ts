import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'

import { isAdminRole } from '#/lib/admin-role'

export const requireUserMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) => {
  const { getCachedSession } = await import('#/lib/auth-middleware.server')
  const session = await getCachedSession()

  if (!session) {
    throw redirect({ to: '/signin' })
  }

  return next({
    context: { session },
  })
})

export const requireAdminMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) => {
  const { getCachedSession } = await import('#/lib/auth-middleware.server')
  const session = await getCachedSession()

  if (!session) {
    throw redirect({ to: '/signin' })
  }

  if (!isAdminRole(session.user.role)) {
    throw redirect({ to: '/' })
  }

  return next({
    context: { session },
  })
})
