import type { z } from 'zod'

import type { PaginatedList } from '#/lib/pagination'

import type {
  closeDailyCalculationSchema,
  createDailyCalculationSchema,
  dailyCalculationBalanceStatusSchema,
  dailyCalculationIdSchema,
  dailyCalculationPersonMoneySchema,
  dailyCalculationRecordStatusSchema,
  dailyCalculationSearchSchema,
  dailyCalculationViewSchema,
  exportDailyCalculationSchema,
  listDailyCalculationSchema,
  updateDailyCalculationSchema,
} from './dailycalculation.schema'

export type DailyCalculationRecordStatus = z.infer<
  typeof dailyCalculationRecordStatusSchema
>
export type DailyCalculationBalanceStatus = z.infer<
  typeof dailyCalculationBalanceStatusSchema
>
export type DailyCalculationView = z.infer<typeof dailyCalculationViewSchema>
export type DailyCalculationPersonMoneyInput = z.infer<
  typeof dailyCalculationPersonMoneySchema
>
export type CreateDailyCalculationInput = z.infer<
  typeof createDailyCalculationSchema
>
export type UpdateDailyCalculationInput = z.infer<
  typeof updateDailyCalculationSchema
>
export type DailyCalculationIdInput = z.infer<typeof dailyCalculationIdSchema>
export type CloseDailyCalculationInput = z.infer<
  typeof closeDailyCalculationSchema
>
export type ListDailyCalculationInput = z.infer<
  typeof listDailyCalculationSchema
>
export type DailyCalculationSearch = z.infer<
  typeof dailyCalculationSearchSchema
>
export type DailyCalculationTotals = {
  asol: number
  sudh: number
  deoya: number
  personMoneyTotal: number
  leftTotal: number
  rightTotal: number
  difference: number
  balanceStatus: DailyCalculationBalanceStatus
}

export type DailyCalculationRecord = {
  id: string
  periodStart: Date | string
  periodEnd: Date | string
  tabil: number
  cashInHome: number
  cashInShop: number
  asol: number
  sudh: number
  deoya: number
  personMoneyTotal: number
  leftTotal: number
  rightTotal: number
  difference: number
  balanceStatus: DailyCalculationBalanceStatus
  recordStatus: DailyCalculationRecordStatus
  openedAt: Date | string
  closedAt: Date | string | null
  createdById?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  lastEditedById?: string | null
  lastEditedAt?: Date | string | null
  createdBy?: {
    id: string
    name: string
  }
  lastEditedBy?: {
    id: string
    name: string
  } | null
  personMoneyEntries?: DailyCalculationPersonMoneyRecord[]
}

export type DailyCalculationPersonMoneyRecord = {
  id: string
  personName: string
  amount: number
  remarks: string | null
  dailyCalculationId: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export type DailyCalculationLoanSource = 'Jinis' | 'JinisChara'
export type DailyCalculationDetailSource = DailyCalculationLoanSource | 'Person'

export type DailyCalculationDeoyaRow = {
  recordId: string
  slNo: number
  amount: number
  date: Date | string
  source: DailyCalculationLoanSource
}

export type DailyCalculationAsolSudhRow = {
  recordId: string
  interestId: string | null
  slNo: number
  personName: string | null
  amount: number
  sudh: number
  date: Date | string
  source: DailyCalculationDetailSource
}

export type DailyCalculationDetail = {
  id: string
  periodStart: Date | string
  periodEnd: Date | string
  recordStatus: DailyCalculationRecordStatus
  openedAt: Date | string
  closedAt: Date | string | null
  tabil: number
  cashInHome: number
  cashInShop: number
  asol: number
  sudh: number
  deoya: number
  personMoneyTotal: number
  leftTotal: number
  rightTotal: number
  difference: number
  balanceStatus: DailyCalculationBalanceStatus
  personMoneyEntries: DailyCalculationPersonMoneyRecord[]
  deoyaRows: DailyCalculationDeoyaRow[]
  asolSudhRows: DailyCalculationAsolSudhRow[]
}

export type DailyCalculationListResult = PaginatedList<DailyCalculationRecord>

export type ExportDailyCalculationInput = z.infer<
  typeof exportDailyCalculationSchema
>
export type DailyCalculationExportFormat = ExportDailyCalculationInput['format']
export type DailyCalculationExportScope = ExportDailyCalculationInput['scope']
