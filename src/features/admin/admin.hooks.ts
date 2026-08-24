import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { refetchJinisLists } from '#/features/jinis/jinis.queries'
import { refetchInterestLists } from '#/features/interest/interest.queries'
import { refetchJinisCharaLists } from '#/features/jinischara/jinischara.queries'
import { getErrorMessage } from '#/features/jinischara/jinischara.utils'
import {
  deleteAllJinis,
  deleteAllJinisChara,
  exportData,
  importJinis,
  importJinisChara,
  revokeSession,
} from './admin.functions'
import {
  adminOverviewQueryOptions,
  adminSessionsQueryOptions,
  refetchAdminOverview,
  refetchAdminSessions,
} from './admin.queries'
import type {
  AdminExportInput,
  AdminJinisCharaImportInput,
  AdminJinisImportInput,
  AdminSessionRecord,
} from './admin.types'
import { toast } from '@/components/ui/toast'

export function useAdminOverview() {
  return useQuery(adminOverviewQueryOptions())
}

export function useAdminSessions() {
  return useQuery(adminSessionsQueryOptions())
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  const revokeSessionFn = useServerFn(revokeSession)

  return useMutation({
    mutationFn: (record: AdminSessionRecord) =>
      revokeSessionFn({ data: { id: record.id } }),
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey: adminSessionsQueryOptions().queryKey })
      const previous = queryClient.getQueryData<AdminSessionRecord[]>(
        adminSessionsQueryOptions().queryKey,
      )
      queryClient.setQueryData<AdminSessionRecord[]>(
        adminSessionsQueryOptions().queryKey,
        (current) => (current ?? []).filter((item) => item.id !== record.id),
      )
      return { previous }
    },
    onError: (_error, _record, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          adminSessionsQueryOptions().queryKey,
          context.previous,
        )
      }
      toast.add({
        title: 'Could not end session',
        description: 'Please try again.',
        type: 'error',
      })
    },
    onSuccess: async () => {
      toast.add({
        title: 'Session ended',
        type: 'success',
      })
      await Promise.all([
        refetchAdminSessions(queryClient),
        refetchAdminOverview(queryClient),
      ])
    },
  })
}

export function useImportJinis() {
  const queryClient = useQueryClient()
  const importJinisFn = useServerFn(importJinis)

  return useMutation({
    mutationFn: (data: AdminJinisImportInput) => importJinisFn({ data }),
    onSuccess: async (result) => {
      toast.add({
        title: 'Jinis imported',
        description: `${result.imported} added. ${result.skipped} skipped as already present.`,
        type: 'success',
      })
      await Promise.all([
        refetchJinisLists(queryClient),
        refetchAdminOverview(queryClient),
      ])
    },
    onError: () => {
      toast.add({
        title: 'Could not import Jinis',
        description: 'Please check the preview and try again.',
        type: 'error',
      })
    },
  })
}

export function useDeleteAllJinis() {
  const queryClient = useQueryClient()
  const deleteAllJinisFn = useServerFn(deleteAllJinis)

  return useMutation({
    mutationFn: () => deleteAllJinisFn({ data: {} }),
    onSuccess: async (result) => {
      toast.add({
        title: 'Jinis deleted',
        description:
          result.paymentsDeleted > 0
            ? `${result.deleted} Jinis removed, including ${result.paymentsDeleted} linked payments.`
            : `${result.deleted} Jinis removed.`,
        type: 'success',
      })
      await Promise.all([
        refetchJinisLists(queryClient),
        refetchInterestLists(queryClient),
        refetchAdminOverview(queryClient),
      ])
    },
    onError: () => {
      toast.add({
        title: 'Could not delete Jinis',
        description: 'Please try again.',
        type: 'error',
      })
    },
  })
}

export function useImportJinisChara() {
  const queryClient = useQueryClient()
  const importJinisCharaFn = useServerFn(importJinisChara)

  return useMutation({
    mutationFn: (data: AdminJinisCharaImportInput) =>
      importJinisCharaFn({ data }),
    onSuccess: async (result) => {
      if (result.imported === 0 && result.skipped > 0) {
        toast.add({
          title: 'Nothing imported',
          description: `All ${result.skipped} rows were skipped because those serial numbers already exist.`,
          type: 'error',
        })
        return
      }

      toast.add({
        title: 'JinisChara imported',
        description:
          result.skipped > 0
            ? `${result.imported} added. ${result.skipped} skipped as already present.`
            : `${result.imported} added.`,
        type: 'success',
      })
      await Promise.all([
        refetchJinisCharaLists(queryClient),
        refetchAdminOverview(queryClient),
      ])
    },
    onError: (error) => {
      toast.add({
        title: 'Could not import JinisChara',
        description: getErrorMessage(
          error,
          'Please check the preview and try again.',
        ),
        type: 'error',
      })
    },
  })
}

export function useDeleteAllJinisChara() {
  const queryClient = useQueryClient()
  const deleteAllJinisCharaFn = useServerFn(deleteAllJinisChara)

  return useMutation({
    mutationFn: () => deleteAllJinisCharaFn({ data: {} }),
    onSuccess: async (result) => {
      toast.add({
        title: 'JinisChara deleted',
        description:
          result.paymentsDeleted > 0
            ? `${result.deleted} JinisChara removed, including ${result.paymentsDeleted} linked payments.`
            : `${result.deleted} JinisChara removed.`,
        type: 'success',
      })
      await Promise.all([
        refetchJinisCharaLists(queryClient),
        refetchInterestLists(queryClient),
        refetchAdminOverview(queryClient),
      ])
    },
    onError: () => {
      toast.add({
        title: 'Could not delete JinisChara',
        description: 'Please try again.',
        type: 'error',
      })
    },
  })
}

export function useExportData() {
  const exportDataFn = useServerFn(exportData)

  return useMutation({
    mutationFn: (data: AdminExportInput) => exportDataFn({ data }),
    onSuccess: (file) => {
      const blob = new Blob([file.content], { type: file.mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename
      link.click()
      URL.revokeObjectURL(url)
      toast.add({
        title: 'Export ready',
        description: file.filename,
        type: 'success',
      })
    },
    onError: () => {
      toast.add({
        title: 'Could not export data',
        description: 'Please try again.',
        type: 'error',
      })
    },
  })
}
