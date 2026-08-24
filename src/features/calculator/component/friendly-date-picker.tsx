import { useState } from 'react'
import { CalendarDaysIcon } from 'lucide-react'

import { parseDayValue, toDayValue } from '#/features/calculator/calculator.utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/use-mobile'

const CALENDAR_START = new Date(1980, 0)
const CALENDAR_END = new Date(new Date().getFullYear() + 15, 11)

type FriendlyDatePickerProps = {
  id: string
  value: string
  onChange: (next: string) => void
  required?: boolean
}

export function FriendlyDatePicker({
  id,
  value,
  onChange,
  required,
}: FriendlyDatePickerProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const selected = parseDayValue(value) ?? undefined

  function handleSelect(date: Date | undefined) {
    if (!date) return
    onChange(toDayValue(date))
    setOpen(false)
  }

  const calendar = (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={handleSelect}
      defaultMonth={selected}
      captionLayout="dropdown"
      startMonth={CALENDAR_START}
      endMonth={CALENDAR_END}
    />
  )

  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Input
          id={id}
          type="date"
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 cursor-pointer scheme-light dark:scheme-dark"
        />
      </div>

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            aria-label="Open calendar"
            onClick={() => setOpen(true)}
          >
            <CalendarDaysIcon />
          </Button>
          <DrawerContent className="data-[swipe-direction=down]:[--drawer-content-max-height:90dvh]">
            <DrawerHeader>
              <DrawerTitle>Pick a date</DrawerTitle>
            </DrawerHeader>
            <div className="flex justify-center overflow-x-auto p-4 pt-2">
              {calendar}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
            aria-label="Open calendar"
          >
            <CalendarDaysIcon className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-2">
            {calendar}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
