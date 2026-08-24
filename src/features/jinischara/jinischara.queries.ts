import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query'

import { listQueryDefaults } from '#/lib/query-options'
import {
  getActiveJinisCharaTotal,
  listJinisChara,
  listJinisCharaOptions,
} from './jinischara.functions'
import {
  toListJinisCharaInput,
  type JinisCharaFilterValues,
} from './jinischara.filters'
import type {
  JinisCharaLinkOption,
  JinisCharaListResult,
  JinisCharaView,
  ListJinisCharaInput,
} from './jinischara.types'

export const jinisCharaKeys = {
  all: ['jinischara'] as const,
  lists: () => [...jinisCharaKeys.all, 'list'] as const,
  list: (input: ListJinisCharaInput) =>
    [...jinisCharaKeys.lists(), input] as const,
  linkOptions: (query = '') =>
    [...jinisCharaKeys.all, 'linkOptions', query] as const,
  activeTotal: () => [...jinisCharaKeys.all, 'activeTotal'] as const,
}

export function jinisCharaListQueryOptions(
  view: JinisCharaView,
  filters: JinisCharaFilterValues = {},
  page = 1,
) {
  const input = toListJinisCharaInput(view, filters, page)

  return queryOptions({
    queryKey: jinisCharaKeys.list(input),
    queryFn: () =>
      listJinisChara({ data: input }) as Promise<JinisCharaListResult>,
    placeholderData: keepPreviousData,
    ...listQueryDefaults,
  })
}

export function jinisCharaLinkOptionsQueryOptions(query = '') {
  return queryOptions({
    queryKey: jinisCharaKeys.linkOptions(query),
    queryFn: () =>
      listJinisCharaOptions({
        data: { query: query || undefined },
      }) as Promise<JinisCharaLinkOption[]>,
    ...listQueryDefaults,
  })
}

export function activeJinisCharaTotalQueryOptions() {
  return queryOptions({
    queryKey: jinisCharaKeys.activeTotal(),
    queryFn: () => getActiveJinisCharaTotal() as Promise<number>,
  })
}

export function refetchJinisCharaLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: jinisCharaKeys.lists() }),
    queryClient.invalidateQueries({
      queryKey: [...jinisCharaKeys.all, 'linkOptions'],
    }),
    queryClient.invalidateQueries({ queryKey: jinisCharaKeys.activeTotal() }),
  ])
}
