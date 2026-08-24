import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { pageCount } from '#/lib/pagination'

type ListPaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: ListPaginationProps) {
  const pages = pageCount(total, pageSize)

  if (total <= pageSize) {
    return null
  }

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            onClick={(event) => {
              event.preventDefault()
              if (page > 1) onPageChange(page - 1)
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="px-2 text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= pages}
            onClick={(event) => {
              event.preventDefault()
              if (page < pages) onPageChange(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
