import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { requireUserMiddleware } from '#/lib/auth-middleware'
import { linkOptionsQuerySchema } from '#/lib/pagination'
import {
  createJinisSchema,
  jinisIdSchema,
  listJinisSchema,
  settleJinisSchema,
  updateJinisSchema,
} from './jinis.schema'
import {
  createJinisRecord,
  deleteJinisRecord,
  getJinisRecord,
  listJinisLinkOptions,
  listJinisRecords,
  settleJinisRecord,
  sumActiveJinisCredit,
  updateJinisRecord,
} from './jinis.server'

export const listJinis = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(listJinisSchema)
  .handler(async ({ data }) => listJinisRecords(data))

export const listJinisOptions = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(linkOptionsQuerySchema)
  .handler(async ({ data }) => listJinisLinkOptions(data.query))

export const getActiveJinisTotal = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .handler(async () => sumActiveJinisCredit())

export const getJinis = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(jinisIdSchema)
  .handler(async ({ data }) => {
    const jinis = await getJinisRecord(data)

    if (!jinis) {
      throw notFound()
    }

    return jinis
  })

export const createJinis = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(createJinisSchema)
  .handler(async ({ data, context }) =>
    createJinisRecord(data, context.session.user.id),
  )

export const updateJinis = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(updateJinisSchema)
  .handler(async ({ data }) => {
    const jinis = await updateJinisRecord(data)

    if (!jinis) {
      throw notFound()
    }

    return jinis
  })

export const settleJinis = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(settleJinisSchema)
  .handler(async ({ data }) => {
    const jinis = await settleJinisRecord(data)

    if (!jinis) {
      throw notFound()
    }

    return jinis
  })

export const deleteJinis = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(jinisIdSchema)
  .handler(async ({ data }) => {
    const result = await deleteJinisRecord(data)

    if (!result) {
      throw notFound()
    }

    return result
  })
