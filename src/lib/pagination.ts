import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 100
export const LINK_OPTIONS_LIMIT = 50

export const listPaginationSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .optional(),
})

export const linkOptionsQuerySchema = z.object({
  query: z.string().trim().optional(),
})

export type PaginatedList<T> = {
  records: T[]
  total: number
  page: number
  pageSize: number
}

export function parsePage(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }

  return 1
}

export function paginationArgs(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const safePage = Math.max(1, page)
  const safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize))

  return {
    page: safePage,
    pageSize: safeSize,
    skip: (safePage - 1) * safeSize,
    take: safeSize,
  }
}

export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}
