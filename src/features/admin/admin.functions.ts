import { createServerFn } from '@tanstack/react-start'

import { requireAdminMiddleware } from '#/lib/auth-middleware'
import {
  adminDeleteAllJinisSchema,
  adminDeleteAllJinisCharaSchema,
  adminExportSchema,
  adminJinisImportSchema,
  adminJinisCharaImportSchema,
  adminSessionIdSchema,
} from './admin.schema'
import {
  deleteAllJinisCharaRecords,
  deleteAllJinisRecords,
  exportAdminData,
  getAdminOverview,
  importJinisCharaCsv,
  importJinisCsv,
  listAdminSessions,
  revokeAdminSession,
} from './admin.server'

export const getAdminDashboard = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .handler(async ({ context }) =>
    getAdminOverview(context.session.session.id),
  )

export const listSessions = createServerFn({ method: 'GET' })
  .middleware([requireAdminMiddleware])
  .handler(async ({ context }) =>
    listAdminSessions(context.session.session.id),
  )

export const revokeSession = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(adminSessionIdSchema)
  .handler(async ({ data }) => {
    const result = await revokeAdminSession(data.id)

    if (!result) {
      throw new Error('Session was not found.')
    }

    return result
  })

export const importJinis = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(adminJinisImportSchema)
  .handler(async ({ data, context }) =>
    importJinisCsv(data, context.session.user.id),
  )

export const deleteAllJinis = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(adminDeleteAllJinisSchema)
  .handler(async () => deleteAllJinisRecords())

export const importJinisChara = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(adminJinisCharaImportSchema)
  .handler(async ({ data, context }) =>
    importJinisCharaCsv(data, context.session.user.id),
  )

export const deleteAllJinisChara = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(adminDeleteAllJinisCharaSchema)
  .handler(async () => deleteAllJinisCharaRecords())

export const exportData = createServerFn({ method: 'POST' })
  .middleware([requireAdminMiddleware])
  .validator(adminExportSchema)
  .handler(async ({ data }) => exportAdminData(data))
