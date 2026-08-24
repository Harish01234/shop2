import { formatCalendarDate } from '#/lib/calendar-date'
import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDownIcon, FilterIcon, XIcon } from 'lucide-react'

import {
  compactFilters,
  countActiveFilters,
  jinisCharaFilterChips,
  removeFilter,
  type JinisCharaFilterValues,
} from '#/features/jinischara/jinischara.filters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type AdvanceSearchFilterProps = {
  filters: JinisCharaFilterValues
  onChange: (filters: JinisCharaFilterValues) => void
  totalCount: number
  activeCount: number
}

function formatFilterDate(value?: string) {
  if (!value) return null
  const formatted = formatCalendarDate(value, '')
  return formatted || value
}

function rangeTip(filters: JinisCharaFilterValues) {
  const exact = formatFilterDate(filters.date)
  const from = formatFilterDate(filters.from)
  const to = formatFilterDate(filters.to)

  if (exact) return `on ${exact}`
  if (from && to) return `from ${from} to ${to}`
  if (from) return `from ${from}`
  if (to) return `until ${to}`
  return null
}

function isDateChip(key: keyof JinisCharaFilterValues) {
  return key === 'date' || key === 'from' || key === 'to'
}

function FilterCountTip({
  text,
  children,
}: {
  text: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex cursor-default" render={<span />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}

export function AdvanceSearchFilter({
  filters,
  onChange,
  totalCount,
  activeCount,
}: AdvanceSearchFilterProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<JinisCharaFilterValues>(filters)
  const filterCount = countActiveFilters(filters)
  const chips = jinisCharaFilterChips(filters)
  const rangeLabel = rangeTip(filters)
  const countTip = rangeLabel
    ? `${activeCount} active of ${totalCount} JinisChara ${rangeLabel}`
    : `${activeCount} active of ${totalCount} JinisChara`

  useEffect(() => {
    setDraft(filters)
  }, [filters])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = compactFilters(draft)
      if (JSON.stringify(next) !== JSON.stringify(compactFilters(filters))) {
        onChange(next)
      }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [draft, filters, onChange])

  function updateDraft<Key extends keyof JinisCharaFilterValues>(
    key: Key,
    value: JinisCharaFilterValues[Key] | undefined,
  ) {
    setDraft((current) => compactFilters({ ...current, [key]: value }))
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="bg-background"
            onClick={() => setOpen((current) => !current)}
          >
            <FilterIcon />
            Filters
            {filterCount > 0 ? <Badge>{filterCount}</Badge> : null}
            <ChevronDownIcon
              className={
                open ? 'rotate-180 transition-transform' : 'transition-transform'
              }
            />
          </Button>
          <FilterCountTip text={countTip}>
            <Badge variant="outline">{activeCount} active</Badge>
          </FilterCountTip>
          {filterCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft({})
                onChange({})
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const badge = (
                <Badge variant="secondary">
                  {chip.label}
                  <button
                    type="button"
                    className="rounded-full outline-none hover:text-foreground"
                    aria-label={`Remove ${chip.label}`}
                    onClick={() => {
                      const next = removeFilter(filters, chip.key)
                      setDraft(next)
                      onChange(next)
                    }}
                  >
                    <XIcon />
                  </button>
                </Badge>
              )

              return (
                <span key={chip.key}>
                  {isDateChip(chip.key) ? (
                    <FilterCountTip text={countTip}>{badge}</FilterCountTip>
                  ) : (
                    badge
                  )}
                </span>
              )
            })}
          </div>
        ) : null}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent>
            <Card className="shadow-none ring-foreground/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Advanced search</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="filter-slNo">Sl no</FieldLabel>
                    <Input
                      id="filter-slNo"
                      inputMode="numeric"
                      placeholder="Exact or partial"
                      value={draft.slNo ?? ''}
                      onChange={(event) =>
                        updateDraft('slNo', event.target.value || undefined)
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="filter-name">Name</FieldLabel>
                    <Input
                      id="filter-name"
                      placeholder="Partial match"
                      value={draft.name ?? ''}
                      onChange={(event) =>
                        updateDraft('name', event.target.value || undefined)
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="filter-fatherName">
                      Father's Name
                    </FieldLabel>
                    <Input
                      id="filter-fatherName"
                      placeholder="Partial match"
                      value={draft.fatherName ?? ''}
                      onChange={(event) =>
                        updateDraft(
                          'fatherName',
                          event.target.value || undefined,
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="filter-creditMin">Credit min</FieldLabel>
                    <Input
                      id="filter-creditMin"
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={draft.creditMin ?? ''}
                      onChange={(event) =>
                        updateDraft(
                          'creditMin',
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="filter-creditMax">Credit max</FieldLabel>
                    <Input
                      id="filter-creditMax"
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={draft.creditMax ?? ''}
                      onChange={(event) =>
                        updateDraft(
                          'creditMax',
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="filter-phoneNo">Phone no</FieldLabel>
                    <Input
                      id="filter-phoneNo"
                      placeholder="Partial or exact"
                      value={draft.phoneNo ?? ''}
                      onChange={(event) =>
                        updateDraft('phoneNo', event.target.value || undefined)
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="filter-percentageMin">
                      Percentage min
                    </FieldLabel>
                    <Input
                      id="filter-percentageMin"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Min"
                      value={draft.percentageMin ?? ''}
                      onChange={(event) =>
                        updateDraft(
                          'percentageMin',
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="filter-percentageMax">
                      Percentage max
                    </FieldLabel>
                    <Input
                      id="filter-percentageMax"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Max"
                      value={draft.percentageMax ?? ''}
                      onChange={(event) =>
                        updateDraft(
                          'percentageMax',
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FilterCountTip text={countTip}>
                      <FieldLabel htmlFor="filter-date">Date</FieldLabel>
                    </FilterCountTip>
                    <Input
                      id="filter-date"
                      type="date"
                      value={draft.date ?? ''}
                      onChange={(event) =>
                        updateDraft('date', event.target.value || undefined)
                      }
                    />
                  </Field>
                  <Field>
                    <FilterCountTip text={countTip}>
                      <FieldLabel htmlFor="filter-from">From</FieldLabel>
                    </FilterCountTip>
                    <Input
                      id="filter-from"
                      type="date"
                      value={draft.from ?? ''}
                      onChange={(event) =>
                        updateDraft('from', event.target.value || undefined)
                      }
                    />
                  </Field>
                  <Field>
                    <FilterCountTip text={countTip}>
                      <FieldLabel htmlFor="filter-to">To</FieldLabel>
                    </FilterCountTip>
                    <Input
                      id="filter-to"
                      type="date"
                      value={draft.to ?? ''}
                      onChange={(event) =>
                        updateDraft('to', event.target.value || undefined)
                      }
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  )
}
