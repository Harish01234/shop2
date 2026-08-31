import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { AlertCircleIcon } from 'lucide-react'

import {
  useCreateInterest,
  useUpdateInterest,
} from '#/features/interest/interest.hooks'
import { createInterestSchema } from '#/features/interest/interest.schema'
import type { InterestRecord } from '#/features/interest/interest.types'
import { getErrorMessage } from '#/features/interest/interest.utils'
import { formatMoney } from '#/features/dailycalculation/dailycalculation.utils'
import {
  JinisSlNoCombobox,
  mergeJinisSlNoOption,
} from '#/features/jinis/component/jinis-sl-no-combobox'
import { useJinisLinkOptions } from '#/features/jinis/jinis.hooks'
import { useJinisCharaLinkOptions } from '#/features/jinischara/jinischara.hooks'
import { toDateInput } from '#/lib/calendar-date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  RequiredMark,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type LinkOption = {
  id: string
  slNo: number
  name: string
}

function mergeLinkOption(
  options: LinkOption[],
  selected?: LinkOption | null,
) {
  return mergeJinisSlNoOption(options, selected)
}

type LinkType = 'jinis' | 'jinischara' | 'person'

function linkTypeFromRecord(interest?: InterestRecord): LinkType {
  if (interest?.jinisId) return 'jinis'
  if (interest?.jinisCharaId) return 'jinischara'
  return 'person'
}

type InterestAsolContext = {
  settledCredit: number
  source: 'Jinis' | 'JinisChara'
}

type InterestFormProps = {
  interest?: InterestRecord
  asolContext?: InterestAsolContext
  defaultDate?: Date | string
  onSuccess: () => void
  onCancel: () => void
}

export function InterestForm({
  interest,
  asolContext,
  defaultDate,
  onSuccess,
  onCancel,
}: InterestFormProps) {
  const isEdit = Boolean(interest)
  const createMutation = useCreateInterest()
  const updateMutation = useUpdateInterest()
  const saving = createMutation.isPending || updateMutation.isPending
  const [serverError, setServerError] = useState<string | null>(null)
  const [linkType, setLinkType] = useState<LinkType>(linkTypeFromRecord(interest))
  const [linkQuery, setLinkQuery] = useState('')
  const [debouncedLinkQuery, setDebouncedLinkQuery] = useState('')

  const form = useForm<
    z.input<typeof createInterestSchema>,
    unknown,
    z.output<typeof createInterestSchema>
  >({
    resolver: zodResolver(createInterestSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      amount: interest?.amount,
      date:
        toDateInput(interest?.date ?? defaultDate) || toDateInput(new Date()),
      remarks: interest?.remarks ?? '',
      jinisId: interest?.jinisId ?? undefined,
      jinisCharaId: interest?.jinisCharaId ?? undefined,
      personName: interest?.personName ?? '',
      settle: linkTypeFromRecord(interest) === 'jinis',
    },
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedLinkQuery(linkQuery)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [linkQuery])

  const shouldFetchJinisOptions =
    !asolContext &&
    linkType === 'jinis' &&
    (debouncedLinkQuery.trim().length > 0 || Boolean(interest?.jinisId))
  const shouldFetchJinisCharaOptions =
    !asolContext &&
    linkType === 'jinischara' &&
    (debouncedLinkQuery.trim().length > 0 || Boolean(interest?.jinisCharaId))

  const jinisQuery = useJinisLinkOptions(
    shouldFetchJinisOptions,
    debouncedLinkQuery,
  )
  const jinisCharaQuery = useJinisCharaLinkOptions(
    shouldFetchJinisCharaOptions,
    debouncedLinkQuery,
  )
  const jinisOptions = mergeLinkOption(jinisQuery.data ?? [], interest?.jinis)
  const jinisCharaOptions = mergeLinkOption(
    jinisCharaQuery.data ?? [],
    interest?.jinisChara,
  )

  function handleLinkTypeChange(next: LinkType) {
    setLinkType(next)
    setLinkQuery('')
    setDebouncedLinkQuery('')
    form.setValue('jinisId', undefined)
    form.setValue('jinisCharaId', undefined)
    form.setValue('personName', '')
    form.setValue('settle', next === 'jinis')
  }

  async function onSubmit(values: z.output<typeof createInterestSchema>) {
    setServerError(null)
    try {
      if (isEdit && interest) {
        await updateMutation.mutateAsync({
          id: interest.id,
          amount: values.amount,
          date: values.date,
          remarks: values.remarks ?? null,
          jinisId: linkType === 'jinis' ? values.jinisId ?? null : null,
          jinisCharaId:
            linkType === 'jinischara' ? values.jinisCharaId ?? null : null,
          personName:
            linkType === 'person' ? values.personName?.trim() || null : null,
        })
      } else {
        await createMutation.mutateAsync({
          ...values,
          jinisId: linkType === 'jinis' ? values.jinisId : undefined,
          jinisCharaId:
            linkType === 'jinischara' ? values.jinisCharaId : undefined,
          personName:
            linkType === 'person' ? values.personName : undefined,
          settle:
            linkType === 'jinis' || linkType === 'jinischara'
              ? values.settle
              : false,
        })
      }
      onSuccess()
    } catch (caught) {
      setServerError(getErrorMessage(caught, 'Could not save this Interest.'))
    }
  }

  const errors = form.formState.errors
  const rootError = errors.root ?? (errors as { ['']?: { message?: string } })['']

  return (
    <form
      onSubmit={form.handleSubmit((values) => void onSubmit(values))}
      className="flex flex-col gap-4"
    >
      <Card className="shadow-none ring-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.amount) || undefined}>
              <FieldLabel htmlFor="amount">
                {asolContext ? 'Sudh (interest amount)' : 'Amount'}{' '}
                <RequiredMark />
              </FieldLabel>
              <Input
                id="amount"
                type="number"
                min="0"
                aria-invalid={Boolean(errors.amount)}
                {...form.register('amount')}
              />
              <FieldError errors={[errors.amount]} />
            </Field>
            <Field data-invalid={Boolean(errors.date) || undefined}>
              <FieldLabel htmlFor="date">
                Date <RequiredMark />
              </FieldLabel>
              <Input
                id="date"
                type="date"
                aria-invalid={Boolean(errors.date)}
                {...form.register('date')}
              />
              <FieldError errors={[errors.date]} />
            </Field>
            {asolContext ? (
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="settledCredit">
                  Settled credit (Asol)
                </FieldLabel>
                <Input
                  id="settledCredit"
                  readOnly
                  disabled
                  value={formatMoney(asolContext.settledCredit)}
                />
                <p className="text-xs text-muted-foreground">
                  Read-only here. Edit credit from the {asolContext.source} row
                  on the Deoya side or the main {asolContext.source} list.
                </p>
              </Field>
            ) : null}
            {asolContext ? (
              <Field className="sm:col-span-2">
                <FieldLabel>Linked to</FieldLabel>
                <Input readOnly disabled value={asolContext.source} />
              </Field>
            ) : null}
            {!asolContext ? (
              <Field>
                <FieldLabel htmlFor="linkType">
                  Linked to <RequiredMark />
                </FieldLabel>
                <NativeSelect
                  id="linkType"
                  className="w-full"
                  value={linkType}
                  onChange={(event) =>
                    handleLinkTypeChange(event.target.value as LinkType)
                  }
                >
                  <NativeSelectOption value="jinis">Jinis</NativeSelectOption>
                  <NativeSelectOption value="jinischara">
                    JinisChara
                  </NativeSelectOption>
                  <NativeSelectOption value="person">Person</NativeSelectOption>
                </NativeSelect>
              </Field>
            ) : null}
            {!asolContext && linkType === 'jinis' ? (
              <Field data-invalid={Boolean(errors.jinisId) || undefined}>
                <FieldLabel htmlFor="jinisId">
                  Jinis <RequiredMark />
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="jinisId"
                  render={({ field }) => (
                    <JinisSlNoCombobox
                      id="jinisId"
                      value={typeof field.value === 'string' ? field.value : ''}
                      onValueChange={field.onChange}
                      options={jinisOptions}
                      placeholder={
                        jinisQuery.isLoading
                          ? 'Loading…'
                          : 'Search SL no or name'
                      }
                      searchPlaceholder="Search SL no or name"
                      emptyText={
                        debouncedLinkQuery.trim()
                          ? 'No Jinis found.'
                          : 'Type SL no or name to search all Jinis.'
                      }
                      disabled={jinisQuery.isLoading}
                      onQueryChange={setLinkQuery}
                    />
                  )}
                />
                <FieldError errors={[errors.jinisId]} />
              </Field>
            ) : null}
            {!asolContext && linkType === 'jinischara' ? (
              <Field data-invalid={Boolean(errors.jinisCharaId) || undefined}>
                <FieldLabel htmlFor="jinisCharaId">
                  JinisChara <RequiredMark />
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="jinisCharaId"
                  render={({ field }) => (
                    <JinisSlNoCombobox
                      id="jinisCharaId"
                      value={typeof field.value === 'string' ? field.value : ''}
                      onValueChange={field.onChange}
                      options={jinisCharaOptions}
                      placeholder={
                        jinisCharaQuery.isLoading
                          ? 'Loading…'
                          : 'Search SL no or name'
                      }
                      searchPlaceholder="Search SL no or name"
                      emptyText={
                        debouncedLinkQuery.trim()
                          ? 'No JinisChara found.'
                          : 'Type SL no or name to search all JinisChara.'
                      }
                      disabled={jinisCharaQuery.isLoading}
                      onQueryChange={setLinkQuery}
                    />
                  )}
                />
                <FieldError errors={[errors.jinisCharaId]} />
              </Field>
            ) : null}
            {!asolContext && linkType === 'person' ? (
              <Field data-invalid={Boolean(errors.personName) || undefined}>
                <FieldLabel htmlFor="personName">
                  Person name <RequiredMark />
                </FieldLabel>
                <Input
                  id="personName"
                  aria-invalid={Boolean(errors.personName)}
                  {...form.register('personName')}
                />
                <FieldError errors={[errors.personName]} />
              </Field>
            ) : null}
            {!isEdit && (linkType === 'jinis' || linkType === 'jinischara') ? (
              <Field orientation="horizontal" className="items-center sm:col-span-2">
                <FieldLabel htmlFor="settled" className="flex-1">
                  Settled
                </FieldLabel>
                <Controller
                  control={form.control}
                  name="settle"
                  render={({ field }) => (
                    <Switch
                      id="settled"
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      aria-label="Settled"
                    />
                  )}
                />
              </Field>
            ) : null}
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
              <Textarea
                id="remarks"
                placeholder="Optional notes"
                {...form.register('remarks')}
              />
            </Field>
            <FieldError
              className="sm:col-span-2"
              errors={[rootError]}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {serverError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="bg-background"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner /> : null}
          {isEdit ? 'Save changes' : 'Create Interest'}
        </Button>
      </div>
    </form>
  )
}
