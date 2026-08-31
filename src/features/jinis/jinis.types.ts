import type { z } from 'zod'

import type { PaginatedList } from '#/lib/pagination'

import {
  createJinisSchema,
  jinisIdSchema,
  jinisItemSchema,
  jinisItemTypeSchema,
  jinisTypeSchema,
  jinisViewSchema,
  listJinisSchema,
  jinisSearchSchema,
  settleJinisSchema,
  updateJinisSchema,
} from './jinis.schema'

export type JinisType = z.infer<typeof jinisTypeSchema>
export type JinisItemType = z.infer<typeof jinisItemTypeSchema>
export type JinisItemInput = z.infer<typeof jinisItemSchema>
export type CreateJinisInput = z.infer<typeof createJinisSchema>
export type UpdateJinisInput = z.infer<typeof updateJinisSchema>
export type JinisIdInput = z.infer<typeof jinisIdSchema>
export type ListJinisInput = z.infer<typeof listJinisSchema>
export type JinisSearch = z.infer<typeof jinisSearchSchema>
export type JinisView = z.infer<typeof jinisViewSchema>
export type SettleJinisInput = z.infer<typeof settleJinisSchema>

export type JinisItemRecord = JinisItemInput & {
  id: string
  jinisId: string
}

export type JinisLinkOption = {
  id: string
  slNo: number
  name: string
}

export type JinisCalculatorLookupOption = JinisLinkOption & {
  credit: number
  date: Date | string
  active: boolean
}

export type JinisRecord = {
  id: string
  slNo: number
  name: string
  fatherName: string
  phoneNo: string
  credit: number
  type: JinisType
  goldWeight: number
  silverWeight: number
  date: Date | string
  active: boolean
  settledAt: Date | string | null
  createdById?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  items?: JinisItemRecord[]
}

export type JinisListResult = PaginatedList<JinisRecord> & {
  allCount: number
  activeCount: number
}
