import { useState } from 'react'
import { DownloadIcon } from 'lucide-react'

import { useExportDailyCalculation } from '#/features/dailycalculation/dailycalculation.hooks'
import type {
  DailyCalculationExportFormat,
  DailyCalculationExportScope,
} from '#/features/dailycalculation/dailycalculation.types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'

type DailyCalculationExportDialogProps = {
  dailyCalculationId: string
}

export function DailyCalculationExportMenu({
  dailyCalculationId,
}: DailyCalculationExportDialogProps) {
  const exportMutation = useExportDailyCalculation()
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<DailyCalculationExportFormat | null>(
    null,
  )
  const [scope, setScope] = useState<DailyCalculationExportScope>('summary')

  function openForFormat(next: DailyCalculationExportFormat) {
    setFormat(next)
    setScope('summary')
    setOpen(true)
  }

  async function handleExport() {
    if (!format) return

    try {
      await exportMutation.mutateAsync({
        id: dailyCalculationId,
        format,
        scope,
      })
      setOpen(false)
    } catch {
      // Toast handled in hook.
    }
  }

  const formatLabel = format === 'pdf' ? 'PDF' : 'Excel'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 bg-background"
            />
          }
        >
          <DownloadIcon className="size-4" />
          Export
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openForFormat('pdf')}>
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openForFormat('xlsx')}>
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export {formatLabel}</DialogTitle>
            <DialogDescription>
              Choose how much detail to include. Daily Calculation and linked
              Main Calculation summaries are always exported.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Detail level</FieldLabel>
            <RadioGroup
              value={scope}
              onValueChange={(value) =>
                setScope(value as DailyCalculationExportScope)
              }
              className="gap-3"
            >
              <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal">
                <RadioGroupItem value="summary" className="mt-0.5" />
                <span className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    Summary only
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Daily Calculation and Main Calculation totals only.
                  </span>
                </span>
              </Label>
              <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal">
                <RadioGroupItem value="full" className="mt-0.5" />
                <span className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    Summary + full detail
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Includes Deoya and Asol + Sudh transaction tables.
                  </span>
                </span>
              </Label>
            </RadioGroup>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="bg-background"
              disabled={exportMutation.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={exportMutation.isPending || !format}
              onClick={() => void handleExport()}
            >
              {exportMutation.isPending ? <Spinner /> : null}
              Download {formatLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
