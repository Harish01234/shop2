import { createFileRoute, redirect } from '@tanstack/react-router'

import { AdminShell } from '#/features/admin/admin-shell'
import { getSession } from '#/lib/auth.functions'
import { isAdminRole } from '#/lib/admin-role'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/signin' })
    }
    if (!isAdminRole(session.user.role)) {
      throw redirect({ to: '/' })
    }
    return { session }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { session } = Route.useRouteContext()

  return <AdminShell user={session.user} />
}
