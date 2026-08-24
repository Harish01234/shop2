import type {
  DailyCalculationBalanceStatus,
  DailyCalculationSearch,
  DailyCalculationView,
  ListDailyCalculationInput,
} from './dailycalculation.types'
import { DEFAULT_PAGE_SIZE, parsePage } from '#/lib/pagination'

export function recordStatusForView(view: DailyCalculationView) {
  if (view === 'open') return 'OPEN' as const
  if (view === 'closed') return 'CLOSED' as const
  return undefined
}

export type DailyCalculationFilterValues = Omit<DailyCalculationSearch, 'view' | 'page'>

export function parseDailyCalculationSearch(
  search: Record<string, unknown>,
): DailyCalculationSearch {
  const parsed = {
    view: search.view,
    balanceStatus: emptyToUndefined(search.balanceStatus),
    from: emptyToUndefined(search.from),
    to: emptyToUndefined(search.to),
    page: search.page,
  }

  const view =
    parsed.view === 'closed' || parsed.view === 'all' || parsed.view === 'open'
      ? parsed.view
      : 'open'

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
  search: DailyCalculationSearch,
): DailyCalculationFilterValues {
  const { view: _view, page: _page, ...filters } = search
  return compactFilters(filters)
}

export function compactFilters(
  filters: DailyCalculationFilterValues,
): DailyCalculationFilterValues {
  return {
    ...(filters.balanceStatus ? { balanceStatus: filters.balanceStatus } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  }
}

export function countActiveFilters(filters: DailyCalculationFilterValues) {
  return Object.keys(compactFilters(filters)).length
}

export function toListDailyCalculationInput(
  view: DailyCalculationView,
  filters: DailyCalculationFilterValues,
  page = 1,
): ListDailyCalculationInput {
  const recordStatus = recordStatusForView(view)
  const compact = compactFilters(filters)
  return {
    ...(recordStatus ? { recordStatus } : {}),
    ...compact,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  }
}

export type DailyCalculationFilterChip = {
  key: keyof DailyCalculationFilterValues
  label: string
}

export function dailyCalculationFilterChips(
  filters: DailyCalculationFilterValues,
): DailyCalculationFilterChip[] {
  const compact = compactFilters(filters)
  const chips: DailyCalculationFilterChip[] = []

  if (compact.balanceStatus) {
    chips.push({
      key: 'balanceStatus',
      label: `Balance: ${compact.balanceStatus === 'CORRECT' ? 'Correct' : 'Incorrect'}`,
    })
  }
  if (compact.from) chips.push({ key: 'from', label: `From: ${compact.from}` })
  if (compact.to) chips.push({ key: 'to', label: `To: ${compact.to}` })

  return chips
}

export function removeFilter(
  filters: DailyCalculationFilterValues,
  key: keyof DailyCalculationFilterValues,
): DailyCalculationFilterValues {
  const next = { ...filters }
  delete next[key]
  return compactFilters(next)
}

export function isBalanceStatus(
  value: string,
): value is DailyCalculationBalanceStatus {
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
