import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { refetchDailyCalculations } from '#/features/dailycalculation/dailycalculation.queries'
import {
  createJinisChara,
  deleteJinisChara,
  updateJinisChara,
} from './jinischara.functions'
import type { JinisCharaFilterValues } from './jinischara.filters'
import {
  activeJinisCharaTotalQueryOptions,
  jinisCharaLinkOptionsQueryOptions,
  jinisCharaListQueryOptions,
  refetchJinisCharaLists,
} from './jinischara.queries'
import type {
  CreateJinisCharaInput,
  JinisCharaRecord,
  JinisCharaView,
  UpdateJinisCharaInput,
} from './jinischara.types'
import { getErrorMessage } from './jinischara.utils'
import { toast } from '@/components/ui/toast'

export function useJinisCharaList(
  view: JinisCharaView,
  filters: JinisCharaFilterValues = {},
  page = 1,
) {
  return useQuery(jinisCharaListQueryOptions(view, filters, page))
}

export function useJinisCharaLinkOptions(enabled = true, query = '') {
  return useQuery({
    ...jinisCharaLinkOptionsQueryOptions(query),
    enabled,
  })
}

export function useActiveJinisCharaTotal() {
  return useQuery(activeJinisCharaTotalQueryOptions())
}

export function useCreateJinisChara() {
  const queryClient = useQueryClient()
  const createJinisCharaFn = useServerFn(createJinisChara)

  return useMutation({
    mutationFn: (data: CreateJinisCharaInput) => createJinisCharaFn({ data }),
    onSuccess: async () => {
      await Promise.all([
        refetchJinisCharaLists(queryClient),
        refetchDailyCalculations(queryClient),
      ])
      toast.add({
        title: 'JinisChara created successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not create JinisChara',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useUpdateJinisChara() {
  const queryClient = useQueryClient()
  const updateJinisCharaFn = useServerFn(updateJinisChara)

  return useMutation({
    mutationFn: (data: UpdateJinisCharaInput) => updateJinisCharaFn({ data }),
    onSuccess: async () => {
      await Promise.all([
        refetchJinisCharaLists(queryClient),
        refetchDailyCalculations(queryClient),
      ])
      toast.add({
        title: 'JinisChara updated successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not update JinisChara',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useDeleteJinisChara() {
  const queryClient = useQueryClient()
  const deleteJinisCharaFn = useServerFn(deleteJinisChara)

  return useMutation({
    mutationFn: (record: JinisCharaRecord) =>
      deleteJinisCharaFn({ data: { id: record.id } }),
    onSuccess: async () => {
      await Promise.all([
        refetchJinisCharaLists(queryClient),
        refetchDailyCalculations(queryClient),
      ])
      toast.add({
        title: 'JinisChara deleted successfully',
        type: 'success',
      })
    },
    onError: () => {
      toast.add({
        title: 'Could not delete JinisChara',
        description: 'It may have linked payments.',
        type: 'error',
      })
    },
  })
}

export function useToggleJinisChara() {
  const queryClient = useQueryClient()
  const updateJinisCharaFn = useServerFn(updateJinisChara)

  return useMutation({
    mutationFn: ({
      record,
      active,
    }: {
      record: JinisCharaRecord
      active: boolean
    }) =>
      updateJinisCharaFn({
        data: {
          id: record.id,
          active,
          settledAt: active ? null : new Date(),
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        refetchJinisCharaLists(queryClient),
        refetchDailyCalculations(queryClient),
      ])
    },
    onError: () => {
      toast.add({
        title: 'Could not update status',
        description: 'Please try again.',
        type: 'error',
      })
    },
  })
}
