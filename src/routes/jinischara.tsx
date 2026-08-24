import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getSession } from '#/lib/auth.functions'
import { AppHeader } from '@/components/app-header'

export const Route = createFileRoute('/jinischara')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/signin' })
    }
    return { session }
  },
  component: JinisCharaLayout,
})

function JinisCharaLayout() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader user={session.user} />
      <Outlet />
    </div>
  )
}
