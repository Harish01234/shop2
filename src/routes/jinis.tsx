import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getSession } from '#/lib/auth.functions'
import { AppHeader } from '@/components/app-header'

export const Route = createFileRoute('/jinis')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/signin' })
    }
    return { session }
  },
  component: JinisLayout,
})

function JinisLayout() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader user={session.user} />
      <Outlet />
    </div>
  )
}
