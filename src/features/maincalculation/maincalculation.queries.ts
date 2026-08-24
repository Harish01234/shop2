import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query'

import {
  detailQueryDefaults,
  listQueryDefaults,
  previewQueryDefaults,
} from '#/lib/query-options'

import {
  getMainCalculation,
  listAvailableDailyCalculationsForMainCalc,
  listMainCalculation,
  previewMainCalculation,
} from './maincalculation.functions'
import {
  toListMainCalculationInput,
  type MainCalculationFilterValues,
} from './maincalculation.filters'
import type {
  AvailableDailyCalculationOption,
  ListMainCalculationInput,
  MainCalculationListResult,
  MainCalculationRecord,
  MainCalculationTotals,
  MainCalculationView,
} from './maincalculation.types'

export const mainCalculationKeys = {
  all: ['maincalculation'] as const,
  lists: () => [...mainCalculationKeys.all, 'list'] as const,
  list: (input: ListMainCalculationInput) =>
    [...mainCalculationKeys.lists(), input] as const,
  detail: (id: string) => [...mainCalculationKeys.all, 'detail', id] as const,
  preview: (input: {
    calculationDate: string
    totalTabil: number
    dailyCalculationId: string
    excludeMainCalculationId?: string
  }) => [...mainCalculationKeys.all, 'preview', input] as const,
  availableDailyCalculations: (excludeMainCalculationId?: string) =>
    [
      ...mainCalculationKeys.all,
      'availableDailyCalculations',
      excludeMainCalculationId ?? '',
    ] as const,
}

export function mainCalculationListQueryOptions(
  view: MainCalculationView,
  filters: MainCalculationFilterValues = {},
  page = 1,
) {
  const input = toListMainCalculationInput(view, filters, page)

  return queryOptions({
    queryKey: mainCalculationKeys.list(input),
    queryFn: () =>
      listMainCalculation({ data: input }) as Promise<MainCalculationListResult>,
    placeholderData: keepPreviousData,
    ...listQueryDefaults,
  })
}

export function mainCalculationDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: mainCalculationKeys.detail(id),
    queryFn: () =>
      getMainCalculation({ data: { id } }) as Promise<MainCalculationRecord>,
    ...detailQueryDefaults,
  })
}

export function previewMainCalculationQueryOptions(input: {
  calculationDate: string
  totalTabil: number
  dailyCalculationId: string
  excludeMainCalculationId?: string
}) {
  return queryOptions({
    queryKey: mainCalculationKeys.preview(input),
    queryFn: () =>
      previewMainCalculation({
        data: {
          calculationDate: new Date(`${input.calculationDate}T00:00:00`),
          totalTabil: input.totalTabil,
          dailyCalculationId: input.dailyCalculationId,
          excludeMainCalculationId: input.excludeMainCalculationId,
        },
      }) as Promise<MainCalculationTotals>,
    enabled: Boolean(input.calculationDate && input.dailyCalculationId),
    placeholderData: keepPreviousData,
    ...previewQueryDefaults,
  })
}

export function availableDailyCalculationsQueryOptions(
  excludeMainCalculationId?: string,
) {
  return queryOptions({
    queryKey: mainCalculationKeys.availableDailyCalculations(
      excludeMainCalculationId,
    ),
    queryFn: () =>
      listAvailableDailyCalculationsForMainCalc({
        data: excludeMainCalculationId
          ? { excludeMainCalculationId }
          : {},
      }) as Promise<AvailableDailyCalculationOption[]>,
  })
}

export function refetchMainCalculationLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: mainCalculationKeys.lists() }),
    queryClient.invalidateQueries({
      queryKey: [...mainCalculationKeys.all, 'availableDailyCalculations'],
    }),
  ])
}

export function refetchMainCalculationDetail(
  queryClient: QueryClient,
  id: string,
) {
  return queryClient.refetchQueries({
    queryKey: mainCalculationKeys.detail(id),
  })
}
