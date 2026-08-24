import type { JinisCharaSearch, JinisCharaView, ListJinisCharaInput } from './jinischara.types'
import { DEFAULT_PAGE_SIZE, parsePage } from '#/lib/pagination'

export function activeFilterForView(view: JinisCharaView) {
  if (view === 'open') return true
  if (view === 'settled') return false
  return undefined
}

export type JinisCharaFilterValues = Omit<JinisCharaSearch, 'view' | 'page'>

export const emptyJinisCharaFilters: JinisCharaFilterValues = {}

export function parseJinisCharaSearch(
  search: Record<string, unknown>,
): JinisCharaSearch {
  const parsed = {
    view: search.view,
    slNo: emptyToUndefined(search.slNo),
    name: emptyToUndefined(search.name),
    fatherName: emptyToUndefined(search.fatherName),
    creditMin: emptyToUndefined(search.creditMin),
    creditMax: emptyToUndefined(search.creditMax),
    percentageMin: emptyToUndefined(search.percentageMin),
    percentageMax: emptyToUndefined(search.percentageMax),
    phoneNo: emptyToUndefined(search.phoneNo),
    date: emptyToUndefined(search.date),
    from: emptyToUndefined(search.from),
    to: emptyToUndefined(search.to),
    page: search.page,
  }

  const view =
    parsed.view === 'settled' || parsed.view === 'all' || parsed.view === 'open'
      ? parsed.view
      : 'open'

  return {
    view,
    slNo: asString(parsed.slNo),
    name: asString(parsed.name),
    fatherName: asString(parsed.fatherName),
    creditMin: asNumber(parsed.creditMin),
    creditMax: asNumber(parsed.creditMax),
    percentageMin: asNumber(parsed.percentageMin),
    percentageMax: asNumber(parsed.percentageMax),
    phoneNo: asString(parsed.phoneNo),
    date: asString(parsed.date),
    from: asString(parsed.from),
    to: asString(parsed.to),
    page: parsePage(parsed.page),
  }
}

export function filtersFromSearch(
  search: JinisCharaSearch,
): JinisCharaFilterValues {
  const { view: _view, page: _page, ...filters } = search
  return compactFilters(filters)
}

export function compactFilters(
  filters: JinisCharaFilterValues,
): JinisCharaFilterValues {
  return {
    ...(filters.slNo ? { slNo: filters.slNo } : {}),
    ...(filters.name ? { name: filters.name } : {}),
    ...(filters.fatherName ? { fatherName: filters.fatherName } : {}),
    ...(filters.creditMin !== undefined ? { creditMin: filters.creditMin } : {}),
    ...(filters.creditMax !== undefined ? { creditMax: filters.creditMax } : {}),
    ...(filters.percentageMin !== undefined
      ? { percentageMin: filters.percentageMin }
      : {}),
    ...(filters.percentageMax !== undefined
      ? { percentageMax: filters.percentageMax }
      : {}),
    ...(filters.phoneNo ? { phoneNo: filters.phoneNo } : {}),
    ...(filters.date ? { date: filters.date } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  }
}

export function countActiveFilters(filters: JinisCharaFilterValues) {
  return Object.keys(compactFilters(filters)).length
}

export function toListJinisCharaInput(
  view: JinisCharaView,
  filters: JinisCharaFilterValues,
  page = 1,
): ListJinisCharaInput {
  const active = activeFilterForView(view)
  const compact = compactFilters(filters)
  return {
    ...(active === undefined ? {} : { active }),
    ...compact,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  }
}

export type JinisCharaFilterChip = {
  key: keyof JinisCharaFilterValues
  label: string
}

export function jinisCharaFilterChips(
  filters: JinisCharaFilterValues,
): JinisCharaFilterChip[] {
  const compact = compactFilters(filters)
  const chips: JinisCharaFilterChip[] = []

  if (compact.slNo) chips.push({ key: 'slNo', label: `Sl no: ${compact.slNo}` })
  if (compact.name) chips.push({ key: 'name', label: `Name: ${compact.name}` })
  if (compact.fatherName) {
    chips.push({ key: 'fatherName', label: `Father: ${compact.fatherName}` })
  }
  if (compact.creditMin !== undefined) {
    chips.push({ key: 'creditMin', label: `Credit min: ${compact.creditMin}` })
  }
  if (compact.creditMax !== undefined) {
    chips.push({ key: 'creditMax', label: `Credit max: ${compact.creditMax}` })
  }
  if (compact.percentageMin !== undefined) {
    chips.push({
      key: 'percentageMin',
      label: `Percentage min: ${compact.percentageMin}`,
    })
  }
  if (compact.percentageMax !== undefined) {
    chips.push({
      key: 'percentageMax',
      label: `Percentage max: ${compact.percentageMax}`,
    })
  }
  if (compact.phoneNo) {
    chips.push({ key: 'phoneNo', label: `Phone: ${compact.phoneNo}` })
  }
  if (compact.date) chips.push({ key: 'date', label: `Date: ${compact.date}` })
  if (compact.from) chips.push({ key: 'from', label: `From: ${compact.from}` })
  if (compact.to) chips.push({ key: 'to', label: `To: ${compact.to}` })

  return chips
}

export function removeFilter(
  filters: JinisCharaFilterValues,
  key: keyof JinisCharaFilterValues,
): JinisCharaFilterValues {
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
