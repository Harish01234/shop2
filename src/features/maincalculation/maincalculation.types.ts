import type { z } from 'zod'

import type { PaginatedList } from '#/lib/pagination'

import {
  createMainCalculationSchema,
  listAvailableDailyCalculationsSchema,
  listMainCalculationSchema,
  mainCalculationBalanceStatusSchema,
  mainCalculationInputSchema,
  mainCalculationIdSchema,
  mainCalculationRecordStatusSchema,
  mainCalculationSearchSchema,
  mainCalculationViewSchema,
  previewMainCalculationSchema,
  updateMainCalculationSchema,
} from './maincalculation.schema'

export type MainCalculationRecordStatus = z.infer<
  typeof mainCalculationRecordStatusSchema
>
export type MainCalculationBalanceStatus = z.infer<
  typeof mainCalculationBalanceStatusSchema
>
export type MainCalculationView = z.infer<typeof mainCalculationViewSchema>
export type MainCalculationInput = z.infer<typeof mainCalculationInputSchema>
export type CreateMainCalculationInput = z.infer<
  typeof createMainCalculationSchema
>
export type UpdateMainCalculationInput = z.infer<
  typeof updateMainCalculationSchema
>
export type PreviewMainCalculationInput = z.infer<
  typeof previewMainCalculationSchema
>
export type ListMainCalculationInput = z.infer<
  typeof listMainCalculationSchema
>
export type ListAvailableDailyCalculationsInput = z.infer<
  typeof listAvailableDailyCalculationsSchema
>
export type MainCalculationSearch = z.infer<
  typeof mainCalculationSearchSchema
>
export type MainCalculationIdInput = z.infer<typeof mainCalculationIdSchema>

export type MainCalculationTotals = {
  interest: number
  bandak: number
  jinisChara: number
  cash: number
  leftTotal: number
  rightTotal: number
  difference: number
  balanceStatus: MainCalculationBalanceStatus
}

export type AvailableDailyCalculationOption = {
  id: string
  periodStart: Date | string
  periodEnd: Date | string
  recordStatus: 'OPEN' | 'CLOSED'
  sudh: number
  rightTotal: number
  isAvailable: boolean
}

export type MainCalculationRecord = {
  id: string
  calculationDate: Date | string
  totalTabil: number
  dailyCalculationId: string
  interest: number
  bandak: number
  jinisChara: number
  cash: number
  leftTotal: number
  rightTotal: number
  difference: number
  balanceStatus: MainCalculationBalanceStatus
  recordStatus: MainCalculationRecordStatus
  finalizedAt: Date | string | null
  createdById: string
  createdAt: Date | string
  updatedAt: Date | string
  lastEditedById: string | null
  lastEditedAt: Date | string | null
  dailyCalculation: {
    id: string
    periodStart: Date | string
    periodEnd: Date | string
    recordStatus: 'OPEN' | 'CLOSED'
  }
  createdBy?: {
    id: string
    name: string
  }
  lastEditedBy?: {
    id: string
    name: string
  } | null
}

export type MainCalculationListResult = PaginatedList<MainCalculationRecord>
