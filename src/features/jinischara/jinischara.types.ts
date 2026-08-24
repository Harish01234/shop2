import type { z } from 'zod'

import type { PaginatedList } from '#/lib/pagination'

import {
  createJinisCharaSchema,
  jinisCharaIdSchema,
  jinisCharaSearchSchema,
  jinisCharaViewSchema,
  listJinisCharaSchema,
  settleJinisCharaSchema,
  updateJinisCharaSchema,
} from './jinischara.schema'

export type CreateJinisCharaInput = z.infer<typeof createJinisCharaSchema>
export type UpdateJinisCharaInput = z.infer<typeof updateJinisCharaSchema>
export type JinisCharaIdInput = z.infer<typeof jinisCharaIdSchema>
export type ListJinisCharaInput = z.infer<typeof listJinisCharaSchema>
export type JinisCharaSearch = z.infer<typeof jinisCharaSearchSchema>
export type JinisCharaView = z.infer<typeof jinisCharaViewSchema>
export type SettleJinisCharaInput = z.infer<typeof settleJinisCharaSchema>

export type JinisCharaLinkOption = {
  id: string
  slNo: number
  name: string
}

export type JinisCharaRecord = {
  id: string
  slNo: number
  name: string
  fatherName: string
  phoneNo: string
  credit: number
  percentage: number
  description: string | null
  date: Date | string
  active: boolean
  settledAt: Date | string | null
  createdById?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export type JinisCharaListResult = PaginatedList<JinisCharaRecord> & {
  allCount: number
  activeCount: number
}
