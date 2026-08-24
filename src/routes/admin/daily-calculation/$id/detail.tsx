import { createFileRoute } from '@tanstack/react-router'

import { DailyCalculationDetailView } from '#/features/dailycalculation/component/dailycalculation-detail-view'
import { dailyCalculationDetailQueryOptions } from '#/features/dailycalculation/dailycalculation.queries'

export const Route = createFileRoute('/admin/daily-calculation/$id/detail')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      dailyCalculationDetailQueryOptions(params.id),
    ),
  component: AdminDailyCalculationDetailPage,
})

function AdminDailyCalculationDetailPage() {
  const { id } = Route.useParams()

  return <DailyCalculationDetailView dailyCalculationId={id} />
}
