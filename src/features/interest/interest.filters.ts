import type {
  InterestSearch,
  InterestSource,
  ListInterestInput,
  DeleteAllInterestInput,
} from './interest.types'
import { DEFAULT_PAGE_SIZE, parsePage } from '#/lib/pagination'

export type InterestFilterValues = Omit<InterestSearch, 'source' | 'page'>

export function parseInterestSearch(
  search: Record<string, unknown>,
): InterestSearch {
  const parsed = {
    source: search.source,
    jinisId: emptyToUndefined(search.jinisId),
    jinisCharaId: emptyToUndefined(search.jinisCharaId),
    personName: emptyToUndefined(search.personName),
    amountMin: emptyToUndefined(search.amountMin),
    amountMax: emptyToUndefined(search.amountMax),
    date: emptyToUndefined(search.date),
    from: emptyToUndefined(search.from),
    to: emptyToUndefined(search.to),
    page: search.page,
  }

  const source: InterestSource =
    parsed.source === 'jinis' ||
    parsed.source === 'jinischara' ||
    parsed.source === 'person' ||
    parsed.source === 'all'
      ? parsed.source
      : 'all'

  return {
    source,
    jinisId: asString(parsed.jinisId),
    jinisCharaId: asString(parsed.jinisCharaId),
    personName: asString(parsed.personName),
    amountMin: asNumber(parsed.amountMin),
    amountMax: asNumber(parsed.amountMax),
    date: asString(parsed.date),
    from: asString(parsed.from),
    to: asString(parsed.to),
    page: parsePage(parsed.page),
  }
}

export function filtersFromSearch(search: InterestSearch): InterestFilterValues {
  const { source: _source, page: _page, ...filters } = search
  return compactFilters(filters)
}

export function compactFilters(
  filters: InterestFilterValues,
): InterestFilterValues {
  return {
    ...(filters.jinisId ? { jinisId: filters.jinisId } : {}),
    ...(filters.jinisCharaId ? { jinisCharaId: filters.jinisCharaId } : {}),
    ...(filters.personName ? { personName: filters.personName } : {}),
    ...(filters.amountMin !== undefined ? { amountMin: filters.amountMin } : {}),
    ...(filters.amountMax !== undefined ? { amountMax: filters.amountMax } : {}),
    ...(filters.date ? { date: filters.date } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  }
}

export function countActiveFilters(filters: InterestFilterValues) {
  return Object.keys(compactFilters(filters)).length
}

export function toListInterestInput(
  source: InterestSource,
  filters: InterestFilterValues,
  page = 1,
): ListInterestInput {
  const compact = compactFilters(filters)
  return {
    ...(source === 'all' ? {} : { source }),
    ...compact,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  }
}

export function toDeleteAllInterestInput(
  source: InterestSource,
  filters: InterestFilterValues,
): DeleteAllInterestInput {
  const compact = compactFilters(filters)
  return {
    ...(source === 'all' ? {} : { source }),
    ...compact,
  }
}

export type InterestFilterChip = {
  key: keyof InterestFilterValues
  label: string
}

export function interestFilterChips(
  filters: InterestFilterValues,
): InterestFilterChip[] {
  const compact = compactFilters(filters)
  const chips: InterestFilterChip[] = []

  if (compact.personName) {
    chips.push({ key: 'personName', label: `Person: ${compact.personName}` })
  }
  if (compact.amountMin !== undefined) {
    chips.push({ key: 'amountMin', label: `Amount min: ${compact.amountMin}` })
  }
  if (compact.amountMax !== undefined) {
    chips.push({ key: 'amountMax', label: `Amount max: ${compact.amountMax}` })
  }
  if (compact.date) chips.push({ key: 'date', label: `Date: ${compact.date}` })
  if (compact.from) chips.push({ key: 'from', label: `From: ${compact.from}` })
  if (compact.to) chips.push({ key: 'to', label: `To: ${compact.to}` })

  return chips
}

export function removeFilter(
  filters: InterestFilterValues,
  key: keyof InterestFilterValues,
): InterestFilterValues {
  const next = { ...filters }
  delete next[key]
  return compactFilters(next)
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

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}
