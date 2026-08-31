import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircleIcon } from 'lucide-react'

import { parseDateInput } from '#/lib/calendar-date'
import { DEFAULT_JINISCHARA_PERCENTAGE } from '#/features/jinischara/jinischara.utils'
import { AdminJinisCharaPreviewTable } from '#/features/admin/admin-jinischara-preview-table'
import {
  parseJinisCharaCsv,
  type CsvJinisCharaPreviewRow,
} from '#/features/admin/admin.csv'
import {
  useMigrationCsvDateOrder,
} from '#/features/admin/component/admin-migration-date-format-field'
import {
  useAdminOverview,
  useDeleteAllJinisChara,
  useImportJinisChara,
} from '#/features/admin/admin.hooks'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/migration/jinischara')({
  component: AdminJinisCharaMigrationPage,
})

function AdminJinisCharaMigrationPage() {
  const overviewQuery = useAdminOverview()
  const importMutation = useImportJinisChara()
  const deleteAllMutation = useDeleteAllJinisChara()
  const { dateOrder } = useMigrationCsvDateOrder()
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvText, setCsvText] = useState<string | null>(null)
  const [rows, setRows] = useState<CsvJinisCharaPreviewRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const validRows = rows.filter((row) => !row.error)
  const errorCount = rows.length - validRows.length
  const jinisCharaCount = overviewQuery.data?.jinisCharaCount ?? 0

  function parseCsvText(text: string) {
    try {
      const parsed = parseJinisCharaCsv(text, { dateOrder })
      setParseError(null)
      setRows(parsed)
    } catch (error) {
      setRows([])
      setParseError(
        error instanceof Error
          ? error.message
          : 'Could not read this CSV file.',
      )
    }
  }

  useEffect(() => {
    if (!csvText) return
    parseCsvText(csvText)
  }, [csvText, dateOrder])

  async function handleFile(file: File | undefined) {
    setParseError(null)
    setRows([])
    setCsvText(null)
    setFileName(null)

    if (!file) return

    const text = await file.text()
    setFileName(file.name)
    setCsvText(text)
  }

  async function confirmImport() {
    setConfirmOpen(false)
    try {
      const result = await importMutation.mutateAsync({
        rows: validRows.map((row) => ({
          slNo: row.slNo as number,
          name: row.name,
          fatherName: row.fatherName,
          phoneNo: row.phoneNo,
          credit: row.credit as number,
          percentage: row.percentage ?? DEFAULT_JINISCHARA_PERCENTAGE,
          description: row.description ?? undefined,
          date: parseDateInput(String(row.date)),
        })),
      })
      if (result.imported > 0) {
        setRows([])
        setCsvText(null)
        setFileName(null)
      }
    } catch {
      // Error toast is handled in useImportJinisChara.
    }
  }

  async function confirmDeleteAll() {
    setDeleteOpen(false)
    await deleteAllMutation.mutateAsync().catch(() => {})
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Upload JinisChara CSV</CardTitle>
          <CardDescription>
            Columns: slNo, name, fatherName, phoneNo, credit, percentage,
            description, date. Blank percentage defaults to 5%. Imported
            records are always Open.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          {fileName ? (
            <p className="text-sm text-muted-foreground">{fileName}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Delete all JinisChara</CardTitle>
          <CardDescription>
            Remove every JinisChara record in one go, including linked
            payments. Use this before a fresh import.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            disabled={jinisCharaCount === 0 || deleteAllMutation.isPending}
            onClick={() => setDeleteOpen(true)}
          >
            {deleteAllMutation.isPending ? <Spinner /> : null}
            Delete all {jinisCharaCount} JinisChara
          </Button>
        </CardContent>
      </Card>

      {parseError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not read CSV</AlertTitle>
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {validRows.length} ready
              {errorCount ? ` · ${errorCount} with errors` : ''}
            </p>
            <Button
              type="button"
              disabled={validRows.length === 0 || importMutation.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {importMutation.isPending ? <Spinner /> : null}
              Import {validRows.length} JinisChara
            </Button>
          </div>
          <AdminJinisCharaPreviewTable records={rows} />
        </>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import these JinisChara?</AlertDialogTitle>
            <AlertDialogDescription>
              {validRows.length} rows will be added as Open (active, no
              settled date). Existing serial numbers are not imported again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={importMutation.isPending}
              onClick={() => void confirmImport()}
            >
              {importMutation.isPending ? <Spinner /> : null}
              Import
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleteAllMutation.isPending) {
            setDeleteOpen(false)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all JinisChara?</AlertDialogTitle>
            <AlertDialogDescription>
              {jinisCharaCount} JinisChara will be removed permanently,
              including linked payments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'bg-background',
              )}
              disabled={deleteAllMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteAllMutation.isPending}
              onClick={() => void confirmDeleteAll()}
            >
              {deleteAllMutation.isPending ? <Spinner /> : null}
              Delete all
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
