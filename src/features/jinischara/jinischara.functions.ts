import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { requireUserMiddleware } from '#/lib/auth-middleware'
import { linkOptionsQuerySchema } from '#/lib/pagination'
import {
  createJinisCharaSchema,
  jinisCharaIdSchema,
  listJinisCharaSchema,
  settleJinisCharaSchema,
  updateJinisCharaSchema,
} from './jinischara.schema'
import {
  createJinisCharaRecord,
  deleteJinisCharaRecord,
  getJinisCharaRecord,
  listJinisCharaLinkOptions,
  listJinisCharaRecords,
  settleJinisCharaRecord,
  sumActiveJinisCharaCredit,
  updateJinisCharaRecord,
} from './jinischara.server'

export const listJinisChara = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(listJinisCharaSchema)
  .handler(async ({ data }) => listJinisCharaRecords(data))

export const listJinisCharaOptions = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(linkOptionsQuerySchema)
  .handler(async ({ data }) => listJinisCharaLinkOptions(data.query))

export const getActiveJinisCharaTotal = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .handler(async () => sumActiveJinisCharaCredit())

export const getJinisChara = createServerFn({ method: 'GET' })
  .middleware([requireUserMiddleware])
  .validator(jinisCharaIdSchema)
  .handler(async ({ data }) => {
    const record = await getJinisCharaRecord(data)

    if (!record) {
      throw notFound()
    }

    return record
  })

export const createJinisChara = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(createJinisCharaSchema)
  .handler(async ({ data, context }) =>
    createJinisCharaRecord(data, context.session.user.id),
  )

export const updateJinisChara = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(updateJinisCharaSchema)
  .handler(async ({ data }) => {
    const record = await updateJinisCharaRecord(data)

    if (!record) {
      throw notFound()
    }

    return record
  })

export const settleJinisChara = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(settleJinisCharaSchema)
  .handler(async ({ data }) => {
    const record = await settleJinisCharaRecord(data)

    if (!record) {
      throw notFound()
    }

    return record
  })

export const deleteJinisChara = createServerFn({ method: 'POST' })
  .middleware([requireUserMiddleware])
  .validator(jinisCharaIdSchema)
  .handler(async ({ data }) => {
    const result = await deleteJinisCharaRecord(data)

    if (!result) {
      throw notFound()
    }

    return result
  })
