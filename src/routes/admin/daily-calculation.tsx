import { Outlet, createFileRoute } from '@tanstack/react-router'

import { parseDailyCalculationSearch } from '#/features/dailycalculation/dailycalculation.filters'

export const Route = createFileRoute('/admin/daily-calculation')({
  validateSearch: (search: Record<string, unknown>) =>
    parseDailyCalculationSearch(search),
  component: DailyCalculationLayout,
})

function DailyCalculationLayout() {
  return <Outlet />
}
