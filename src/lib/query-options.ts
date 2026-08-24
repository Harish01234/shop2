/** Defaults for admin list tables — avoid refetch noise on tab focus. */
export const listQueryDefaults = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: false,
} as const

/** Derived/preview totals — short cache, no focus refetch. */
export const previewQueryDefaults = {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
} as const

/** Detail pages refreshed explicitly after mutations. */
export const detailQueryDefaults = {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
} as const
