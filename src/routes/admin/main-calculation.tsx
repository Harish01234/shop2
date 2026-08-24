import { Outlet, createFileRoute } from '@tanstack/react-router'

import { parseMainCalculationSearch } from '#/features/maincalculation/maincalculation.filters'

export const Route = createFileRoute('/admin/main-calculation')({
  validateSearch: (search: Record<string, unknown>) =>
    parseMainCalculationSearch(search),
  component: MainCalculationLayout,
})

function MainCalculationLayout() {
  return <Outlet />
}
