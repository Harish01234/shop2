import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query'

import {
  detailQueryDefaults,
  listQueryDefaults,
  previewQueryDefaults,
} from '#/lib/query-options'
import { parseDateInput } from '#/lib/calendar-date'

import {
  listDailyCalculation,
  previewDailyCalculation,
  getDailyCalculation,
  getDailyCalculationDetail,
} from './dailycalculation.functions'
import {
  toListDailyCalculationInput,
  type DailyCalculationFilterValues,
} from './dailycalculation.filters'
import type {
  DailyCalculationDetail,
  DailyCalculationListResult,
  DailyCalculationRecord,
  DailyCalculationTotals,
  DailyCalculationView,
  ListDailyCalculationInput,
} from './dailycalculation.types'

export const dailyCalculationKeys = {
  all: ['dailycalculation'] as const,
  lists: () => [...dailyCalculationKeys.all, 'list'] as const,
  list: (input: ListDailyCalculationInput) =>
    [...dailyCalculationKeys.lists(), input] as const,
  preview: (periodStart: string, periodEnd: string) =>
    [...dailyCalculationKeys.all, 'preview', periodStart, periodEnd] as const,
  record: (id: string) => [...dailyCalculationKeys.all, 'record', id] as const,
  detail: (id: string) => [...dailyCalculationKeys.all, 'detail', id] as const,
}

export function dailyCalculationListQueryOptions(
  view: DailyCalculationView,
  filters: DailyCalculationFilterValues = {},
  page = 1,
) {
  const input = toListDailyCalculationInput(view, filters, page)

  return queryOptions({
    queryKey: dailyCalculationKeys.list(input),
    queryFn: () =>
      listDailyCalculation({ data: input }) as Promise<DailyCalculationListResult>,
    placeholderData: keepPreviousData,
    ...listQueryDefaults,
  })
}

export function previewDailyCalculationQueryOptions(
  periodStart: string,
  periodEnd: string,
) {
  return queryOptions({
    queryKey: dailyCalculationKeys.preview(periodStart, periodEnd),
    queryFn: () =>
      previewDailyCalculation({
        data: {
          periodStart: parseDateInput(periodStart),
          periodEnd: parseDateInput(periodEnd),
          tabil: 0,
          cashInHome: 0,
          cashInShop: 0,
          personMoneyEntries: [],
        },
      }) as Promise<DailyCalculationTotals>,
    enabled: Boolean(periodStart && periodEnd && periodStart <= periodEnd),
    placeholderData: keepPreviousData,
    ...previewQueryDefaults,
  })
}

export function dailyCalculationRecordQueryOptions(id: string) {
  return queryOptions({
    queryKey: dailyCalculationKeys.record(id),
    queryFn: () =>
      getDailyCalculation({ data: { id } }) as Promise<DailyCalculationRecord>,
    ...detailQueryDefaults,
  })
}

export function dailyCalculationDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: dailyCalculationKeys.detail(id),
    queryFn: () =>
      getDailyCalculationDetail({ data: { id } }) as Promise<DailyCalculationDetail>,
    ...detailQueryDefaults,
  })
}

export function refetchDailyCalculationLists(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: dailyCalculationKeys.lists() })
}

export function refetchDailyCalculations(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: dailyCalculationKeys.all })
}

export function refetchDailyCalculationDetail(
  queryClient: QueryClient,
  id: string,
) {
  return queryClient.refetchQueries({
    queryKey: dailyCalculationKeys.detail(id),
  })
}
