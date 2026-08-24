import type { z } from 'zod'

import {
  adminExportFormatSchema,
  adminExportSchema,
  adminExportTypeSchema,
  adminJinisImportSchema,
  adminJinisCharaImportSchema,
  adminSessionIdSchema,
} from './admin.schema'

export type AdminSessionIdInput = z.infer<typeof adminSessionIdSchema>
export type AdminExportType = z.infer<typeof adminExportTypeSchema>
export type AdminExportFormat = z.infer<typeof adminExportFormatSchema>
export type AdminExportInput = z.infer<typeof adminExportSchema>
export type AdminJinisImportInput = z.infer<typeof adminJinisImportSchema>
export type AdminJinisCharaImportInput = z.infer<
  typeof adminJinisCharaImportSchema
>

export type AdminSessionRecord = {
  id: string
  userId: string
  userName: string
  userEmail: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date | string
  updatedAt: Date | string
  expiresAt: Date | string
  active: boolean
  current: boolean
}

export type AdminOverview = {
  userCount: number
  activeSessionCount: number
  jinisCount: number
  jinisCharaCount: number
  recentSessions: AdminSessionRecord[]
}

export type AdminExportResult = {
  filename: string
  mimeType: string
  content: string
}
