import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import {
  createMainCalculation,
  deleteMainCalculation,
  finalizeMainCalculation,
  updateMainCalculation,
} from './maincalculation.functions'
import type { MainCalculationFilterValues } from './maincalculation.filters'
import {
  availableDailyCalculationsQueryOptions,
  mainCalculationDetailQueryOptions,
  mainCalculationListQueryOptions,
  previewMainCalculationQueryOptions,
  refetchMainCalculationDetail,
  refetchMainCalculationLists,
} from './maincalculation.queries'
import type {
  CreateMainCalculationInput,
  MainCalculationIdInput,
  MainCalculationRecord,
  MainCalculationView,
  UpdateMainCalculationInput,
} from './maincalculation.types'
import { getErrorMessage } from './maincalculation.utils'
import { toast } from '@/components/ui/toast'

export function useMainCalculationList(
  view: MainCalculationView,
  filters: MainCalculationFilterValues = {},
  page = 1,
) {
  return useQuery(mainCalculationListQueryOptions(view, filters, page))
}

export function useMainCalculationDetail(id: string | null, enabled = true) {
  return useQuery({
    ...mainCalculationDetailQueryOptions(id ?? ''),
    enabled: enabled && Boolean(id),
  })
}

export function useAvailableDailyCalculations(excludeMainCalculationId?: string) {
  return useQuery(
    availableDailyCalculationsQueryOptions(excludeMainCalculationId),
  )
}

export function usePreviewMainCalculation(
  calculationDate: string,
  totalTabil: number,
  dailyCalculationId: string,
  excludeMainCalculationId?: string,
) {
  return useQuery(
    previewMainCalculationQueryOptions({
      calculationDate,
      totalTabil,
      dailyCalculationId,
      excludeMainCalculationId,
    }),
  )
}

export function useCreateMainCalculation() {
  const queryClient = useQueryClient()
  const createFn = useServerFn(createMainCalculation)

  return useMutation({
    mutationFn: (data: CreateMainCalculationInput) => createFn({ data }),
    onSuccess: async () => {
      await refetchMainCalculationLists(queryClient)
      toast.add({
        title: 'Main Calculation created',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not create Main Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useUpdateMainCalculation() {
  const queryClient = useQueryClient()
  const updateFn = useServerFn(updateMainCalculation)

  return useMutation({
    mutationFn: (data: UpdateMainCalculationInput) => updateFn({ data }),
    onSuccess: async (_record, variables) => {
      await Promise.all([
        refetchMainCalculationLists(queryClient),
        refetchMainCalculationDetail(queryClient, variables.id),
      ])
      toast.add({
        title: 'Main Calculation updated',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not update Main Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useFinalizeMainCalculation() {
  const queryClient = useQueryClient()
  const finalizeFn = useServerFn(finalizeMainCalculation)

  return useMutation({
    mutationFn: (data: MainCalculationIdInput) => finalizeFn({ data }),
    onSuccess: async (_record, variables) => {
      await Promise.all([
        refetchMainCalculationLists(queryClient),
        refetchMainCalculationDetail(queryClient, variables.id),
      ])
      toast.add({
        title: 'Main Calculation finalized',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not finalize Main Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useDeleteMainCalculation() {
  const queryClient = useQueryClient()
  const deleteFn = useServerFn(deleteMainCalculation)

  return useMutation({
    mutationFn: (record: MainCalculationRecord) =>
      deleteFn({ data: { id: record.id } }),
    onSuccess: async () => {
      await refetchMainCalculationLists(queryClient)
      toast.add({
        title: 'Main Calculation deleted',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not delete Main Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}
