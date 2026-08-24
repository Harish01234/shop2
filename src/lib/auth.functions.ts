import { createServerFn } from '@tanstack/react-start'

import { getCachedSession } from '#/lib/auth-middleware.server'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => getCachedSession(),
)
