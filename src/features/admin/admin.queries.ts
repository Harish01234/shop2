import { queryOptions, type QueryClient } from '@tanstack/react-query'

import {
  getAdminDashboard,
  listSessions,
} from './admin.functions'
import type { AdminSessionRecord } from './admin.types'

export const adminKeys = {
  all: ['admin'] as const,
  overview: () => [...adminKeys.all, 'overview'] as const,
  sessions: () => [...adminKeys.all, 'sessions'] as const,
}

export function adminOverviewQueryOptions() {
  return queryOptions({
    queryKey: adminKeys.overview(),
    queryFn: () => getAdminDashboard(),
  })
}

export function adminSessionsQueryOptions() {
  return queryOptions({
    queryKey: adminKeys.sessions(),
    queryFn: () => listSessions() as Promise<AdminSessionRecord[]>,
  })
}

export function refetchAdminSessions(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: adminKeys.sessions() })
}

export function refetchAdminOverview(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: adminKeys.overview() })
}
