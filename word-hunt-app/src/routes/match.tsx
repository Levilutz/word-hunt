import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/match')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/match"!</div>
}
