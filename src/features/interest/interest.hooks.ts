import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { refetchDailyCalculations } from '#/features/dailycalculation/dailycalculation.queries'
import { refetchJinisLists } from '#/features/jinis/jinis.queries'
import { refetchJinisCharaLists } from '#/features/jinischara/jinischara.queries'
import {
  createInterest,
  deleteInterest,
  updateInterest,
} from './interest.functions'
import {
  interestListQueryOptions,
  refetchInterestLists,
  totalInterestQueryOptions,
} from './interest.queries'
import type { InterestFilterValues } from './interest.filters'
import type {
  CreateInterestInput,
  InterestRecord,
  InterestSource,
  UpdateInterestInput,
} from './interest.types'
import { getErrorMessage } from './interest.utils'
import { toast } from '@/components/ui/toast'

export function useInterestList(
  source: InterestSource = 'all',
  filters: InterestFilterValues = {},
  page = 1,
) {
  return useQuery(interestListQueryOptions(source, filters, page))
}

export function useTotalInterest() {
  return useQuery(totalInterestQueryOptions())
}

export function useCreateInterest() {
  const queryClient = useQueryClient()
  const createInterestFn = useServerFn(createInterest)

  return useMutation({
    mutationFn: (data: CreateInterestInput) => createInterestFn({ data }),
    onSuccess: async (_record, input) => {
      await Promise.all([
        refetchInterestLists(queryClient),
        refetchDailyCalculations(queryClient),
        input.settle && input.jinisId
          ? refetchJinisLists(queryClient)
          : Promise.resolve(),
        input.settle && input.jinisCharaId
          ? refetchJinisCharaLists(queryClient)
          : Promise.resolve(),
      ])
      toast.add({
        title: 'Interest created successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not create Interest',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useUpdateInterest() {
  const queryClient = useQueryClient()
  const updateInterestFn = useServerFn(updateInterest)

  return useMutation({
    mutationFn: (data: UpdateInterestInput) => updateInterestFn({ data }),
    onSuccess: async () => {
      await Promise.all([
        refetchInterestLists(queryClient),
        refetchDailyCalculations(queryClient),
      ])
      toast.add({
        title: 'Interest updated successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not update Interest',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useDeleteInterest() {
  const queryClient = useQueryClient()
  const deleteInterestFn = useServerFn(deleteInterest)

  return useMutation({
    mutationFn: (record: InterestRecord) =>
      deleteInterestFn({ data: { id: record.id } }),
    onSuccess: async () => {
      await Promise.all([
        refetchInterestLists(queryClient),
        refetchDailyCalculations(queryClient),
      ])
      toast.add({
        title: 'Interest deleted successfully',
        type: 'success',
      })
    },
    onError: () => {
      toast.add({
        title: 'Could not delete Interest',
        description: 'Please try again.',
        type: 'error',
      })
    },
  })
}
