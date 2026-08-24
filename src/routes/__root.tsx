import { lazy, Suspense } from 'react'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { FileQuestionIcon } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Toaster } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

import appCss from '../styles.css?url'

import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'

const AppDevtools = import.meta.env.DEV
  ? lazy(() => import('../integrations/tanstack-devtools'))
  : () => null

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Interest',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='24' font-size='24'%3EI%3C/text%3E%3C/svg%3E",
      },
    ],
    scripts: [
      {
        children: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
  errorComponent: RootError,
})

function RootError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="font-heading text-base font-medium text-foreground"
        >
          Interest
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestionIcon />
            </EmptyMedia>
            <EmptyTitle className="text-xl">Something went wrong</EmptyTitle>
            <EmptyDescription>
              {error.message || 'The page failed to load.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={reset}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="font-heading text-base font-medium text-foreground"
        >
          Interest
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestionIcon />
            </EmptyMedia>
            <EmptyTitle className="text-xl">Page not found</EmptyTitle>
            <EmptyDescription>
              This address is not a page in Interest.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className={cn(buttonVariants())}>
              Go home
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    </div>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <Toaster />
        {import.meta.env.DEV ? (
          <Suspense>
            <AppDevtools />
          </Suspense>
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
