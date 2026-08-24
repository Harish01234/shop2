import { Link, useMatchRoute } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AdminMigrationNav() {
  const matchRoute = useMatchRoute()
  const onJinisChara = Boolean(
    matchRoute({ to: '/admin/migration/jinischara' }),
  )
  const onJinis = !onJinisChara

  return (
    <div className="flex flex-wrap gap-1">
      <Link
        to="/admin/migration"
        className={cn(
          buttonVariants({ variant: onJinis ? 'default' : 'ghost' }),
        )}
      >
        Jinis
      </Link>
      <Link
        to="/admin/migration/jinischara"
        className={cn(
          buttonVariants({ variant: onJinisChara ? 'default' : 'ghost' }),
        )}
      >
        JinisChara
      </Link>
    </div>
  )
}
