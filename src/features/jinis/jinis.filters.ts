import type { JinisSearch, JinisType, JinisView, ListJinisInput } from './jinis.types'
import { DEFAULT_PAGE_SIZE, parsePage } from '#/lib/pagination'

export function activeFilterForView(view: JinisView) {
  if (view === 'open') return true
  if (view === 'settled') return false
  return undefined
}

export type JinisFilterValues = Omit<JinisSearch, 'view' | 'page'>

export const emptyJinisFilters: JinisFilterValues = {}

export function parseJinisSearch(search: Record<string, unknown>): JinisSearch {
  const parsed = {
    view: search.view,
    slNo: emptyToUndefined(search.slNo),
    name: emptyToUndefined(search.name),
    fatherName: emptyToUndefined(search.fatherName),
    creditMin: emptyToUndefined(search.creditMin),
    creditMax: emptyToUndefined(search.creditMax),
    phoneNo: emptyToUndefined(search.phoneNo),
    type: emptyToUndefined(search.type),
    date: emptyToUndefined(search.date),
    from: emptyToUndefined(search.from),
    to: emptyToUndefined(search.to),
    page: search.page,
  }

  const view =
    parsed.view === 'settled' || parsed.view === 'all' || parsed.view === 'open'
      ? parsed.view
      : 'open'

  const type =
    parsed.type === 'GOLD' ||
    parsed.type === 'SILVER' ||
    parsed.type === 'BOTH' ||
    parsed.type === 'UNKNOWN'
      ? parsed.type
      : undefined

  return {
    view,
    slNo: asString(parsed.slNo),
    name: asString(parsed.name),
    fatherName: asString(parsed.fatherName),
    creditMin: asNumber(parsed.creditMin),
    creditMax: asNumber(parsed.creditMax),
    phoneNo: asString(parsed.phoneNo),
    type,
    date: asString(parsed.date),
    from: asString(parsed.from),
    to: asString(parsed.to),
    page: parsePage(parsed.page),
  }
}

export function filtersFromSearch(search: JinisSearch): JinisFilterValues {
  const { view: _view, page: _page, ...filters } = search
  return compactFilters(filters)
}

export function compactFilters(filters: JinisFilterValues): JinisFilterValues {
  return {
    ...(filters.slNo ? { slNo: filters.slNo } : {}),
    ...(filters.name ? { name: filters.name } : {}),
    ...(filters.fatherName ? { fatherName: filters.fatherName } : {}),
    ...(filters.creditMin !== undefined ? { creditMin: filters.creditMin } : {}),
    ...(filters.creditMax !== undefined ? { creditMax: filters.creditMax } : {}),
    ...(filters.phoneNo ? { phoneNo: filters.phoneNo } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.date ? { date: filters.date } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  }
}

export function countActiveFilters(filters: JinisFilterValues) {
  return Object.keys(compactFilters(filters)).length
}

export function toListJinisInput(
  view: JinisView,
  filters: JinisFilterValues,
  page = 1,
): ListJinisInput {
  const active = activeFilterForView(view)
  const compact = compactFilters(filters)
  return {
    ...(active === undefined ? {} : { active }),
    ...compact,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  }
}

export type JinisFilterChip = {
  key: keyof JinisFilterValues
  label: string
}

export function jinisFilterChips(filters: JinisFilterValues): JinisFilterChip[] {
  const compact = compactFilters(filters)
  const chips: JinisFilterChip[] = []

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
  if (compact.phoneNo) {
    chips.push({ key: 'phoneNo', label: `Phone: ${compact.phoneNo}` })
  }
  if (compact.type) chips.push({ key: 'type', label: `Type: ${compact.type}` })
  if (compact.date) chips.push({ key: 'date', label: `Date: ${compact.date}` })
  if (compact.from) chips.push({ key: 'from', label: `From: ${compact.from}` })
  if (compact.to) chips.push({ key: 'to', label: `To: ${compact.to}` })

  return chips
}

export function removeFilter(
  filters: JinisFilterValues,
  key: keyof JinisFilterValues,
): JinisFilterValues {
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

export function isJinisType(value: string): value is JinisType {
  return (
    value === 'GOLD' ||
    value === 'SILVER' ||
    value === 'BOTH' ||
    value === 'UNKNOWN'
  )
}
