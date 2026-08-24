import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/jinis/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/jinis/new"!</div>
}
