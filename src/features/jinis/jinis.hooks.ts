import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import {
  createJinis,
  deleteJinis,
  updateJinis,
} from './jinis.functions'
import {
  activeJinisTotalQueryOptions,
  jinisLinkOptionsQueryOptions,
  jinisListQueryOptions,
  jinisRecordQueryOptions,
  refetchJinisLists,
} from './jinis.queries'
import type { JinisFilterValues } from './jinis.filters'
import type {
  CreateJinisInput,
  JinisRecord,
  JinisView,
  UpdateJinisInput,
} from './jinis.types'
import { getErrorMessage } from './jinis.utils'
import { toast } from '@/components/ui/toast'

export function useJinisList(
  view: JinisView,
  filters: JinisFilterValues = {},
  page = 1,
) {
  return useQuery(jinisListQueryOptions(view, filters, page))
}

export function useJinisLinkOptions(enabled = true, query = '') {
  return useQuery({
    ...jinisLinkOptionsQueryOptions(query),
    enabled,
  })
}

export function useJinisRecord(id: string | undefined, enabled = true) {
  return useQuery({
    ...jinisRecordQueryOptions(id ?? ''),
    enabled: enabled && Boolean(id),
  })
}

export function useActiveJinisTotal() {
  return useQuery(activeJinisTotalQueryOptions())
}

export function useCreateJinis() {
  const queryClient = useQueryClient()
  const createJinisFn = useServerFn(createJinis)

  return useMutation({
    mutationFn: (data: CreateJinisInput) => createJinisFn({ data }),
    onSuccess: async () => {
      await refetchJinisLists(queryClient)
      toast.add({
        title: 'Jinis created successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not create Jinis',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useUpdateJinis() {
  const queryClient = useQueryClient()
  const updateJinisFn = useServerFn(updateJinis)

  return useMutation({
    mutationFn: (data: UpdateJinisInput) => updateJinisFn({ data }),
    onSuccess: async () => {
      await refetchJinisLists(queryClient)
      toast.add({
        title: 'Jinis updated successfully',
        type: 'success',
      })
    },
    onError: (error) => {
      toast.add({
        title: 'Could not update Jinis',
        description: getErrorMessage(error, 'Please try again.'),
        type: 'error',
      })
    },
  })
}

export function useDeleteJinis() {
  const queryClient = useQueryClient()
  const deleteJinisFn = useServerFn(deleteJinis)

  return useMutation({
    mutationFn: (record: JinisRecord) =>
      deleteJinisFn({ data: { id: record.id } }),
    onSuccess: async () => {
      await refetchJinisLists(queryClient)
      toast.add({
        title: 'Jinis deleted successfully',
        type: 'success',
      })
    },
    onError: () => {
      toast.add({
        title: 'Could not delete Jinis',
        description: 'It may have linked payments.',
        type: 'error',
      })
    },
  })
}

export function useToggleJinis() {
  const queryClient = useQueryClient()
  const updateJinisFn = useServerFn(updateJinis)

  return useMutation({
    mutationFn: ({
      record,
      active,
    }: {
      record: JinisRecord
      active: boolean
    }) =>
      updateJinisFn({
        data: {
          id: record.id,
          active,
          settledAt: active ? null : new Date(),
        },
      }),
    onSuccess: async () => {
      await refetchJinisLists(queryClient)
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
