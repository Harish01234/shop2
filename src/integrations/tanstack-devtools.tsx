import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from './tanstack-query/devtools'

export default function AppDevtools() {
  return (
    <TanStackDevtools
      config={{
        position: 'bottom-right',
        hideUntilHover: true,
      }}
      plugins={[
        {
          name: 'Tanstack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
        TanStackQueryDevtools,
      ]}
    />
  )
}
