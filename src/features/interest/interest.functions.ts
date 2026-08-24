import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { requireUserMiddleware } from '#/lib/auth-middleware'
import {
  createInterestSchema,
  interestIdSchema,
  listInterestSchema,
  updateInterestSchema,
} from './interest.schema'
import {
  createInterestRecord,
  deleteInterestRecord,
  getInterestRecord,
  listInterestRecords,
  sumInterestAmount,
  updateInterestRecord,
} from './interest.server'

export const listInterest = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(listInterestSchema)
  .handler(async ({ data }) => listInterestRecords(data))

export const getTotalInterest = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .handler(async () => sumInterestAmount())

export const getInterest = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(interestIdSchema)
  .handler(async ({ data }) => {
    const record = await getInterestRecord(data)

    if (!record) {
      throw notFound()
    }

    return record
  })

export const createInterest = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(createInterestSchema)
  .handler(async ({ data, context }) =>
    createInterestRecord(data, context.session.user.id),
  )

export const updateInterest = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(updateInterestSchema)
  .handler(async ({ data }) => {
    const record = await updateInterestRecord(data)

    if (!record) {
      throw notFound()
    }

    return record
  })

export const deleteInterest = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(interestIdSchema)
  .handler(async ({ data }) => {
    const result = await deleteInterestRecord(data)

    if (!result) {
      throw notFound()
    }

    return result
  })
