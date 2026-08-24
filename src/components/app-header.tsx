import { Link } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'

import { isAdminRole } from '#/lib/admin-role'
import BetterAuthHeader from '#/integrations/better-auth/header-user'
import { ThemeToggle } from '@/components/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type AppHeaderUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

export function AppHeader({ user }: { user?: AppHeaderUser | null }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-heading text-base font-medium text-foreground"
        >
          <span className="size-2.5 rounded-full bg-primary" aria-hidden />
          Interest
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            activeProps={{
              className: 'bg-primary/15 text-primary',
            }}
          >
            Home
          </Link>
          <Link
            to="/jinis"
            search={{ view: 'open' }}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            activeProps={{
              className: 'bg-primary/15 text-primary',
            }}
          >
            Jinis
          </Link>
          <Link
            to="/jinischara"
            search={{ view: 'open' }}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            activeProps={{
              className: 'bg-primary/15 text-primary',
            }}
          >
            JinisChara
          </Link>
          {isAdminRole(user?.role) ? (
            <Link
              to="/admin"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              activeProps={{
                className: 'bg-primary/15 text-primary',
              }}
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <div className="hidden md:block">
            <BetterAuthHeader user={user} />
          </div>
          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'md:hidden',
              )}
              aria-label="Open menu"
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-4">
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'justify-start',
                  )}
                >
                  Home
                </Link>
                <Link
                  to="/jinis"
                  search={{ view: 'open' }}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'justify-start',
                  )}
                >
                  Jinis
                </Link>
                <Link
                  to="/jinischara"
                  search={{ view: 'open' }}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'justify-start',
                  )}
                >
                  JinisChara
                </Link>
                {isAdminRole(user?.role) ? (
                  <Link
                    to="/admin"
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      'justify-start',
                    )}
                  >
                    Admin
                  </Link>
                ) : null}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Account</span>
                  <BetterAuthHeader user={user} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
