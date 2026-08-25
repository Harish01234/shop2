import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { refetchMainCalculationLists } from '#/features/maincalculation/maincalculation.queries'
import {
  closeDailyCalculation,
  createDailyCalculation,
  deleteDailyCalculation,
  exportDailyCalculation,
  refreshDailyCalculation,
  updateDailyCalculation,
} from './dailycalculation.functions'
import {
  dailyCalculationDetailQueryOptions,
  dailyCalculationKeys,
  dailyCalculationListQueryOptions,
  dailyCalculationRecordQueryOptions,
  previewDailyCalculationQueryOptions,
  refetchDailyCalculationDetail,
  refetchDailyCalculationLists,
} from './dailycalculation.queries'
import type { DailyCalculationFilterValues } from './dailycalculation.filters'
import type {
  CloseDailyCalculationInput,
  CreateDailyCalculationInput,
  DailyCalculationIdInput,
  DailyCalculationRecord,
  DailyCalculationView,
  ExportDailyCalculationInput,
  UpdateDailyCalculationInput,
} from './dailycalculation.types'
import { getErrorMessage } from './dailycalculation.utils'
import { downloadBase64File } from '#/lib/download-file'
import { toast } from '@/components/ui/toast'

export function useDailyCalculationList(
  view: DailyCalculationView,
  filters: DailyCalculationFilterValues = {},
  page = 1,
) {
  return useQuery(dailyCalculationListQueryOptions(view, filters, page))
}

export function usePreviewDailyCalculation(
  periodStart: string,
  periodEnd: string,
) {
  return useQuery(previewDailyCalculationQueryOptions(periodStart, periodEnd))
}

export function useDailyCalculationDetail(id: string | null, enabled = true) {
  return useQuery({
    ...dailyCalculationDetailQueryOptions(id ?? ''),
    enabled: enabled && Boolean(id),
  })
}

export function useDailyCalculationRecord(id: string | undefined, enabled = true) {
  return useQuery({
    ...dailyCalculationRecordQueryOptions(id ?? ''),
    enabled: enabled && Boolean(id),
  })
}

export function useRefreshDailyCalculation() {
  const queryClient = useQueryClient()
  const refreshFn = useServerFn(refreshDailyCalculation)

  return useMutation({
    mutationFn: (data: DailyCalculationIdInput) => refreshFn({ data }),
    onSuccess: async (_record, variables) => {
      await refetchDailyCalculationDetail(queryClient, variables.id)
      await refetchDailyCalculationLists(queryClient)
    },
    onError: (error) => {
      toast.add({
        title: 'Could not refresh Daily Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useSyncDailyCalculationDetail(dailyCalculationId: string) {
  const queryClient = useQueryClient()
  const refreshFn = useServerFn(refreshDailyCalculation)

  return useCallback(async () => {
    await refreshFn({ data: { id: dailyCalculationId } })
    await Promise.all([
      refetchDailyCalculationDetail(queryClient, dailyCalculationId),
      queryClient.invalidateQueries({ queryKey: dailyCalculationKeys.lists() }),
    ])
  }, [dailyCalculationId, queryClient, refreshFn])
}

export function useCreateDailyCalculation() {
  const queryClient = useQueryClient()
  const createFn = useServerFn(createDailyCalculation)

  return useMutation({
    mutationFn: (data: CreateDailyCalculationInput) => createFn({ data }),
    onSuccess: async () => {
      await refetchDailyCalculationLists(queryClient)
      toast.add({
        title: 'Daily Calculation created successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not create Daily Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useUpdateDailyCalculation() {
  const queryClient = useQueryClient()
  const updateFn = useServerFn(updateDailyCalculation)

  return useMutation({
    mutationFn: (data: UpdateDailyCalculationInput) => updateFn({ data }),
    onSuccess: async () => {
      await refetchDailyCalculationLists(queryClient)
      toast.add({
        title: 'Daily Calculation updated successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not update Daily Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useCloseDailyCalculation() {
  const queryClient = useQueryClient()
  const closeFn = useServerFn(closeDailyCalculation)

  return useMutation({
    mutationFn: (data: CloseDailyCalculationInput) => closeFn({ data }),
    onSuccess: async () => {
      await refetchDailyCalculationLists(queryClient)
      toast.add({
        title: 'Daily Calculation closed',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not close Daily Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useDeleteDailyCalculation() {
  const queryClient = useQueryClient()
  const deleteFn = useServerFn(deleteDailyCalculation)

  return useMutation({
    mutationFn: (record: DailyCalculationRecord) =>
      deleteFn({ data: { id: record.id } }),
    onSuccess: async () => {
      await Promise.all([
        refetchDailyCalculationLists(queryClient),
        refetchMainCalculationLists(queryClient),
      ])
      toast.add({
        title: 'Daily Calculation deleted successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not delete Daily Calculation',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useExportDailyCalculation() {
  const exportFn = useServerFn(exportDailyCalculation)

  return useMutation({
    mutationFn: (data: ExportDailyCalculationInput) => exportFn({ data }),
    onSuccess: (file) => {
      downloadBase64File(file)
      toast.add({
        title: 'Export ready',
        description: file.filename,
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not export',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}
