import { formatCalendarDate } from '#/lib/calendar-date'
import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDownIcon, FilterIcon, XIcon } from 'lucide-react'

import {
  compactFilters,
  countActiveFilters,
  dailyCalculationFilterChips,
  isBalanceStatus,
  removeFilter,
  type DailyCalculationFilterValues,
} from '#/features/dailycalculation/dailycalculation.filters'
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
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type AdvanceSearchFilterProps = {
  filters: DailyCalculationFilterValues
  onChange: (filters: DailyCalculationFilterValues) => void
  totalCount: number
}

function formatFilterDate(value?: string) {
  if (!value) return null
  const formatted = formatCalendarDate(value, '')
  return formatted || value
}

function rangeTip(filters: DailyCalculationFilterValues) {
  const from = formatFilterDate(filters.from)
  const to = formatFilterDate(filters.to)

  if (from && to) return `from ${from} to ${to}`
  if (from) return `from ${from}`
  if (to) return `until ${to}`
  return null
}

function isDateChip(key: keyof DailyCalculationFilterValues) {
  return key === 'from' || key === 'to'
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
}: AdvanceSearchFilterProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DailyCalculationFilterValues>(filters)
  const filterCount = countActiveFilters(filters)
  const chips = dailyCalculationFilterChips(filters)
  const rangeLabel = rangeTip(filters)
  const countTip = rangeLabel
    ? `${totalCount} Daily Calculation ${rangeLabel}`
    : `${totalCount} Daily Calculation`

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

  function updateDraft<Key extends keyof DailyCalculationFilterValues>(
    key: Key,
    value: DailyCalculationFilterValues[Key] | undefined,
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
            <Badge variant="outline">{totalCount} total</Badge>
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
                    <FieldLabel htmlFor="filter-balanceStatus">
                      Balance
                    </FieldLabel>
                    <NativeSelect
                      id="filter-balanceStatus"
                      className="w-full"
                      value={draft.balanceStatus ?? ''}
                      onChange={(event) =>
                        updateDraft(
                          'balanceStatus',
                          isBalanceStatus(event.target.value)
                            ? event.target.value
                            : undefined,
                        )
                      }
                    >
                      <NativeSelectOption value="">Any</NativeSelectOption>
                      <NativeSelectOption value="CORRECT">
                        Correct
                      </NativeSelectOption>
                      <NativeSelectOption value="INCORRECT">
                        Incorrect
                      </NativeSelectOption>
                    </NativeSelect>
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
