import type { z } from 'zod'

import type { PaginatedList } from '#/lib/pagination'

import {
  createInterestSchema,
  deleteAllInterestSchema,
  interestIdSchema,
  interestSearchSchema,
  interestSourceSchema,
  listInterestSchema,
  updateInterestSchema,
} from './interest.schema'

export type CreateInterestInput = z.infer<typeof createInterestSchema>
export type UpdateInterestInput = z.infer<typeof updateInterestSchema>
export type InterestIdInput = z.infer<typeof interestIdSchema>
export type ListInterestInput = z.infer<typeof listInterestSchema>
export type DeleteAllInterestInput = z.infer<typeof deleteAllInterestSchema>
export type InterestSearch = z.infer<typeof interestSearchSchema>
export type InterestSource = z.infer<typeof interestSourceSchema>

export type InterestRecord = {
  id: string
  amount: number
  date: Date | string
  remarks: string | null
  jinisId: string | null
  jinisCharaId: string | null
  personName: string | null
  createdById?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  jinis?: {
    id: string
    slNo: number
    name: string
  } | null
  jinisChara?: {
    id: string
    slNo: number
    name: string
  } | null
}

export type InterestListResult = PaginatedList<InterestRecord>
