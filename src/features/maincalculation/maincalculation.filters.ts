import type {
  ListMainCalculationInput,
  MainCalculationBalanceStatus,
  MainCalculationSearch,
  MainCalculationView,
} from './maincalculation.types'
import { DEFAULT_PAGE_SIZE, parsePage } from '#/lib/pagination'

export function recordStatusForView(view: MainCalculationView) {
  if (view === 'draft') return 'DRAFT' as const
  if (view === 'finalized') return 'FINALIZED' as const
  return undefined
}

export type MainCalculationFilterValues = Omit<MainCalculationSearch, 'view' | 'page'>

export function parseMainCalculationSearch(
  search: Record<string, unknown>,
): MainCalculationSearch {
  const parsed = {
    view: search.view,
    balanceStatus: emptyToUndefined(search.balanceStatus),
    from: emptyToUndefined(search.from),
    to: emptyToUndefined(search.to),
    page: search.page,
  }

  const view =
    parsed.view === 'finalized' ||
    parsed.view === 'all' ||
    parsed.view === 'draft'
      ? parsed.view
      : 'draft'

  const balanceStatus =
    parsed.balanceStatus === 'CORRECT' || parsed.balanceStatus === 'INCORRECT'
      ? parsed.balanceStatus
      : undefined

  return {
    view,
    balanceStatus,
    from: asString(parsed.from),
    to: asString(parsed.to),
    page: parsePage(parsed.page),
  }
}

export function filtersFromSearch(
  search: MainCalculationSearch,
): MainCalculationFilterValues {
  const { view: _view, page: _page, ...filters } = search
  return compactFilters(filters)
}

export function compactFilters(
  filters: MainCalculationFilterValues,
): MainCalculationFilterValues {
  return {
    ...(filters.balanceStatus ? { balanceStatus: filters.balanceStatus } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  }
}

export function toListMainCalculationInput(
  view: MainCalculationView,
  filters: MainCalculationFilterValues,
  page = 1,
): ListMainCalculationInput {
  const recordStatus = recordStatusForView(view)
  const compact = compactFilters(filters)
  return {
    ...(recordStatus ? { recordStatus } : {}),
    ...compact,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  }
}

export function isBalanceStatus(
  value: string,
): value is MainCalculationBalanceStatus {
  return value === 'CORRECT' || value === 'INCORRECT'
}

function emptyToUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined
  return value
}

function asString(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}
