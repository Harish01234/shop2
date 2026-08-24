import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query'

import { listQueryDefaults, detailQueryDefaults } from '#/lib/query-options'
import {
  getActiveJinisTotal,
  getJinis,
  listJinis,
  listJinisOptions,
} from './jinis.functions'
import {
  toListJinisInput,
  type JinisFilterValues,
} from './jinis.filters'
import type {
  JinisLinkOption,
  JinisListResult,
  JinisRecord,
  JinisView,
  ListJinisInput,
} from './jinis.types'

export const jinisKeys = {
  all: ['jinis'] as const,
  lists: () => [...jinisKeys.all, 'list'] as const,
  list: (input: ListJinisInput) => [...jinisKeys.lists(), input] as const,
  linkOptions: (query = '') => [...jinisKeys.all, 'linkOptions', query] as const,
  record: (id: string) => [...jinisKeys.all, 'record', id] as const,
  activeTotal: () => [...jinisKeys.all, 'activeTotal'] as const,
}

export function jinisListQueryOptions(
  view: JinisView,
  filters: JinisFilterValues = {},
  page = 1,
) {
  const input = toListJinisInput(view, filters, page)

  return queryOptions({
    queryKey: jinisKeys.list(input),
    queryFn: () => listJinis({ data: input }) as Promise<JinisListResult>,
    placeholderData: keepPreviousData,
    ...listQueryDefaults,
  })
}

export function jinisLinkOptionsQueryOptions(query = '') {
  return queryOptions({
    queryKey: jinisKeys.linkOptions(query),
    queryFn: () =>
      listJinisOptions({ data: { query: query || undefined } }) as Promise<
        JinisLinkOption[]
      >,
    ...listQueryDefaults,
  })
}

export function jinisRecordQueryOptions(id: string) {
  return queryOptions({
    queryKey: jinisKeys.record(id),
    queryFn: () => getJinis({ data: { id } }) as Promise<JinisRecord>,
    ...detailQueryDefaults,
  })
}

export function activeJinisTotalQueryOptions() {
  return queryOptions({
    queryKey: jinisKeys.activeTotal(),
    queryFn: () => getActiveJinisTotal() as Promise<number>,
  })
}

export function refetchJinisLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: jinisKeys.lists() }),
    queryClient.invalidateQueries({
      queryKey: [...jinisKeys.all, 'linkOptions'],
    }),
    queryClient.invalidateQueries({ queryKey: jinisKeys.activeTotal() }),
  ])
}
