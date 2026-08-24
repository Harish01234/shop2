import { createFileRoute } from '@tanstack/react-router'

import { MainCalculationDetailView } from '#/features/maincalculation/component/maincalculation-detail-view'
import { mainCalculationDetailQueryOptions } from '#/features/maincalculation/maincalculation.queries'

export const Route = createFileRoute('/admin/main-calculation/$id/detail')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      mainCalculationDetailQueryOptions(params.id),
    ),
  component: AdminMainCalculationDetailPage,
})

function AdminMainCalculationDetailPage() {
  const { id } = Route.useParams()

  return <MainCalculationDetailView mainCalculationId={id} />
}
