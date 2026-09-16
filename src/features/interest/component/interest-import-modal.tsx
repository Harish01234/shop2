import { useEffect, useState } from 'react'
import { AlertCircleIcon } from 'lucide-react'

import { parseDateInput } from '#/lib/calendar-date'
import { InterestImportPreviewTable } from './interest-import-preview-table'
import {
  useImportInterest,
  usePreviewInterestImport,
} from '#/features/interest/interest.hooks'
import { getErrorMessage } from '#/features/interest/interest.utils'
import type { InterestImportPreviewRow } from '#/features/interest/interest.types'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type InterestImportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

async function readImportFile(file: File) {
  const isExcel = file.name.toLowerCase().endsWith('.xlsx')
  if (isExcel) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    return {
      fileName: file.name,
      content: bytesToBase64(bytes),
      encoding: 'base64' as const,
    }
  }

  return {
    fileName: file.name,
    content: await file.text(),
    encoding: 'utf8' as const,
  }
}

export function InterestImportModal({
  open,
  onOpenChange,
}: InterestImportModalProps) {
  const previewMutation = usePreviewInterestImport()
  const importMutation = useImportInterest()
  const [fileName, setFileName] = useState<string | null>(null)
  const [filePayload, setFilePayload] = useState<{
    fileName: string
    content: string
    encoding: 'utf8' | 'base64'
  } | null>(null)
  const [rows, setRows] = useState<InterestImportPreviewRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const importableRows = rows.filter((row) => row.status !== 'error')
  const errorCount = rows.length - importableRows.length
  const warningCount = importableRows.filter(
    (row) => row.status === 'warning',
  ).length

  useEffect(() => {
    if (!open || !filePayload) return

    let cancelled = false
    setParseError(null)
    previewMutation
      .mutateAsync(filePayload)
      .then((result) => {
        if (!cancelled) setRows(result.rows)
      })
      .catch((error) => {
        if (cancelled) return
        setRows([])
        setParseError(
          getErrorMessage(error, 'Could not read this file.'),
        )
      })

    return () => {
      cancelled = true
    }
  }, [filePayload, open])

  function resetState() {
    setFileName(null)
    setFilePayload(null)
    setRows([])
    setParseError(null)
    setConfirmOpen(false)
  }

  async function handleFile(file: File | undefined) {
    setParseError(null)
    setRows([])
    setFilePayload(null)
    setFileName(null)

    if (!file) return

    const payload = await readImportFile(file)
    setFileName(file.name)
    setFilePayload(payload)
  }

  async function confirmImport() {
    const toImport = importableRows.filter((row) => row.date)
    if (toImport.length === 0) return

    try {
      const result = await importMutation.mutateAsync({
        rows: toImport.map((row) => ({
          amount: row.sudh,
          date: parseDateInput(row.date as string),
          jinisId: row.jinisId ?? undefined,
          personName: row.personName ?? undefined,
          settle: row.settle,
        })),
      })
      toast.add({
        title:
          result.imported === 1
            ? '1 Interest record imported'
            : `${result.imported} Interest records imported`,
        description: errorCount
          ? `${errorCount === 1 ? '1 error row' : `${errorCount} error rows`} skipped.`
          : undefined,
        type: 'success',
      })
      setConfirmOpen(false)
      resetState()
      onOpenChange(false)
    } catch {
      // Toast handled by the mutation.
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && (previewMutation.isPending || importMutation.isPending)) {
            return
          }
          if (!nextOpen) resetState()
          onOpenChange(nextOpen)
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,900px)] flex-col overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Import Interest</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel sheet with a SL NO / AMOUNT / SUDH / DATE
              header. Dates are read as DD/MM/YYYY. The 3-column SL NO / AMOUNT /
              DATE block is ignored.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <Input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => {
                void handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />

            {fileName ? (
              <p className="text-sm text-muted-foreground">{fileName}</p>
            ) : null}

            {parseError ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Could not read file</AlertTitle>
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            ) : null}

            {previewMutation.isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Reading file…
              </div>
            ) : null}

            {rows.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {importableRows.length} ready
                    {warningCount ? ` · ${warningCount} with warnings` : ''}
                    {errorCount ? ` · ${errorCount} with errors` : ''}
                  </p>
                  <Button
                    type="button"
                    disabled={
                      importableRows.length === 0 || importMutation.isPending
                    }
                    onClick={() => setConfirmOpen(true)}
                  >
                    {importMutation.isPending ? <Spinner /> : null}
                    Import {importableRows.length} Interest
                  </Button>
                </div>
                <InterestImportPreviewTable records={rows} />
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import these Interest records?</AlertDialogTitle>
            <AlertDialogDescription>
              {importableRows.length === 1
                ? '1 row'
                : `${importableRows.length} rows`}{' '}
              will be created. Jinis-linked rows will be marked settled.
              {errorCount
                ? ` ${errorCount === 1 ? '1 error row' : `${errorCount} error rows`} will be skipped.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={importMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={importableRows.length === 0 || importMutation.isPending}
              onClick={() => void confirmImport()}
            >
              {importMutation.isPending ? <Spinner /> : null}
              Import
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
