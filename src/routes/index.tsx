import { createFileRoute, redirect } from '@tanstack/react-router'

import { CreditInterestCalculator } from '#/features/calculator/component/credit-interest-calculator'
import { getSession } from '#/lib/auth.functions'
import { AppHeader } from '@/components/app-header'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/signin' })
    }
    return { session }
  },
  component: Home,
})

function Home() {
  const { session } = Route.useRouteContext()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader user={session.user} />
      <main className="mx-auto flex w-full flex-1 items-center justify-center px-4 py-4">
        <CreditInterestCalculator />
      </main>
    </div>
  )
}
