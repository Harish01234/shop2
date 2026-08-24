import { useState, type FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { useExportData } from '#/features/admin/admin.hooks'
import type {
  AdminExportFormat,
  AdminExportType,
} from '#/features/admin/admin.types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { Spinner } from '@/components/ui/spinner'

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10)
}

function defaultFrom() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return toDateInput(date)
}

export const Route = createFileRoute('/admin/export')({
  component: AdminExportPage,
})

function AdminExportPage() {
  const exportDataMutation = useExportData()
  const [type, setType] = useState<AdminExportType>('users')
  const [format, setFormat] = useState<AdminExportFormat>('csv')
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(() => toDateInput(new Date()))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await exportDataMutation.mutateAsync({
      type,
      format,
      from: new Date(from),
      to: new Date(to),
    }).catch(() => {})
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-medium text-foreground">
          Export
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download users, Jinis, or login sessions as CSV or JSON.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Export data</CardTitle>
          <CardDescription>
            Choose a data type, format, and date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="flex flex-col gap-4"
          >
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="export-type">Data type</FieldLabel>
                <NativeSelect
                  id="export-type"
                  className="w-full"
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as AdminExportType)
                  }
                >
                  <NativeSelectOption value="users">Users</NativeSelectOption>
                  <NativeSelectOption value="jinis">Jinis</NativeSelectOption>
                  <NativeSelectOption value="sessions">
                    Sessions
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="export-format">Format</FieldLabel>
                <NativeSelect
                  id="export-format"
                  className="w-full"
                  value={format}
                  onChange={(event) =>
                    setFormat(event.target.value as AdminExportFormat)
                  }
                >
                  <NativeSelectOption value="csv">CSV</NativeSelectOption>
                  <NativeSelectOption value="json">JSON</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="export-from">From</FieldLabel>
                <Input
                  id="export-from"
                  type="date"
                  required
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="export-to">To</FieldLabel>
                <Input
                  id="export-to"
                  type="date"
                  required
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </Field>
            </FieldGroup>
            <div className="flex justify-end">
              <Button type="submit" disabled={exportDataMutation.isPending}>
                {exportDataMutation.isPending ? <Spinner /> : null}
                Download
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
