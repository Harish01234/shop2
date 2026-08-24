import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircleIcon, SearchIcon } from 'lucide-react'

import {
  useCreateInterest,
  useUpdateInterest,
} from '#/features/interest/interest.hooks'
import {
  createInterestSchema,
  updateInterestSchema,
} from '#/features/interest/interest.schema'
import type { InterestRecord } from '#/features/interest/interest.types'
import { getErrorMessage } from '#/features/interest/interest.utils'
import { formatMoney } from '#/features/dailycalculation/dailycalculation.utils'
import { useJinisLinkOptions } from '#/features/jinis/jinis.hooks'
import { useJinisCharaLinkOptions } from '#/features/jinischara/jinischara.hooks'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroupAddon } from '@/components/ui/input-group'
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
  if (!selected) return options
  if (options.some((item) => item.id === selected.id)) return options
  return [selected, ...options]
}

function formatLinkOption(item: LinkOption) {
  return `#${item.slNo} · ${item.name}`
}

function filterLinkOption(
  item: LinkOption,
  query: string,
  itemToString?: (item: LinkOption) => string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const numeric = q.replace(/^#/, '')
  if (numeric !== '' && /^\d+$/.test(numeric)) {
    return String(item.slNo).includes(numeric)
  }

  if (item.name.toLowerCase().includes(q)) return true
  return (itemToString?.(item) ?? formatLinkOption(item)).toLowerCase().includes(q)
}

function InterestLinkCombobox({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  onQueryChange,
}: {
  id: string
  value: string
  onValueChange: (id: string) => void
  options: LinkOption[]
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  onQueryChange?: (query: string) => void
}) {
  const selected = options.find((item) => item.id === value) ?? null

  return (
    <Combobox
      name={id}
      required
      items={options}
      value={selected}
      onValueChange={(item) => onValueChange(item?.id ?? '')}
      itemToStringLabel={formatLinkOption}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(a, b) => a.id === b.id}
      filter={filterLinkOption}
      autoHighlight
      limit={100}
      disabled={disabled}
    >
      <ComboboxTrigger
        id={id}
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal data-placeholder:text-muted-foreground"
          />
        }
      >
        <span className="min-w-0 truncate">
          <ComboboxValue placeholder={placeholder} />
        </span>
      </ComboboxTrigger>
      <ComboboxContent className="min-w-(--anchor-width)">
        <ComboboxInput
          showTrigger={false}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          onChange={(event) => onQueryChange?.(event.currentTarget.value)}
        >
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: LinkOption) => (
            <ComboboxItem key={item.id} value={item}>
              {formatLinkOption(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10)
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

  const [amount, setAmount] = useState(interest ? String(interest.amount) : '')
  const [date, setDate] = useState(
    interest
      ? toDateInput(interest.date)
      : toDateInput(defaultDate ?? new Date()),
  )
  const [remarks, setRemarks] = useState(interest?.remarks ?? '')
  const [linkType, setLinkType] = useState<LinkType>(linkTypeFromRecord(interest))
  const [jinisId, setJinisId] = useState(interest?.jinisId ?? '')
  const [jinisCharaId, setJinisCharaId] = useState(interest?.jinisCharaId ?? '')
  const [personName, setPersonName] = useState(interest?.personName ?? '')
  const [settled, setSettled] = useState(linkTypeFromRecord(interest) === 'jinis')
  const [error, setError] = useState<string | null>(null)
  const [linkQuery, setLinkQuery] = useState('')
  const [debouncedLinkQuery, setDebouncedLinkQuery] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedLinkQuery(linkQuery)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [linkQuery])

  const jinisQuery = useJinisLinkOptions(
    !asolContext && linkType === 'jinis',
    debouncedLinkQuery,
  )
  const jinisCharaQuery = useJinisCharaLinkOptions(
    !asolContext && linkType === 'jinischara',
    debouncedLinkQuery,
  )
  const jinisOptions = mergeLinkOption(
    jinisQuery.data ?? [],
    interest?.jinis,
  )
  const jinisCharaOptions = mergeLinkOption(
    jinisCharaQuery.data ?? [],
    interest?.jinisChara,
  )

  function handleLinkTypeChange(next: LinkType) {
    setLinkType(next)
    setSettled(next === 'jinis')
    setLinkQuery('')
    setDebouncedLinkQuery('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = {
      amount: Number(amount),
      date: new Date(date),
      remarks: remarks.trim() || undefined,
      jinisId: linkType === 'jinis' ? jinisId || undefined : undefined,
      jinisCharaId:
        linkType === 'jinischara' ? jinisCharaId || undefined : undefined,
      personName: linkType === 'person' ? personName.trim() || undefined : undefined,
      settle:
        !isEdit && (linkType === 'jinis' || linkType === 'jinischara')
          ? settled
          : false,
    }

    try {
      if (isEdit && interest) {
        const parsed = updateInterestSchema.parse({
          id: interest.id,
          ...payload,
          jinisId: linkType === 'jinis' ? jinisId : null,
          jinisCharaId: linkType === 'jinischara' ? jinisCharaId : null,
          personName: linkType === 'person' ? personName.trim() || null : null,
        })
        await updateMutation.mutateAsync(parsed)
      } else {
        const parsed = createInterestSchema.parse(payload)
        await createMutation.mutateAsync(parsed)
      }
      onSuccess()
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not save this Interest.'))
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-4"
    >
      <Card className="shadow-none ring-foreground/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="amount">
                {asolContext ? 'Sudh (interest amount)' : 'Amount'}
              </FieldLabel>
              <Input
                id="amount"
                type="number"
                min="1"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="date">Date</FieldLabel>
              <Input
                id="date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
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
                <FieldLabel htmlFor="linkType">Linked to</FieldLabel>
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
              <Field>
                <FieldLabel htmlFor="jinisId">Jinis</FieldLabel>
                <InterestLinkCombobox
                  id="jinisId"
                  value={jinisId}
                  onValueChange={setJinisId}
                  options={jinisOptions}
                  placeholder={
                    jinisQuery.isLoading ? 'Loading…' : 'Select Jinis'
                  }
                  searchPlaceholder="Search sl no or name"
                  emptyText="No Jinis found."
                  disabled={jinisQuery.isLoading}
                  onQueryChange={setLinkQuery}
                />
              </Field>
            ) : null}
            {!asolContext && linkType === 'jinischara' ? (
              <Field>
                <FieldLabel htmlFor="jinisCharaId">JinisChara</FieldLabel>
                <InterestLinkCombobox
                  id="jinisCharaId"
                  value={jinisCharaId}
                  onValueChange={setJinisCharaId}
                  options={jinisCharaOptions}
                  placeholder={
                    jinisCharaQuery.isLoading
                      ? 'Loading…'
                      : 'Select JinisChara'
                  }
                  searchPlaceholder="Search sl no or name"
                  emptyText="No JinisChara found."
                  disabled={jinisCharaQuery.isLoading}
                  onQueryChange={setLinkQuery}
                />
              </Field>
            ) : null}
            {!asolContext && linkType === 'person' ? (
              <Field>
                <FieldLabel htmlFor="personName">Person name</FieldLabel>
                <Input
                  id="personName"
                  required
                  value={personName}
                  onChange={(event) => setPersonName(event.target.value)}
                />
              </Field>
            ) : null}
            {!isEdit && (linkType === 'jinis' || linkType === 'jinischara') ? (
              <Field orientation="horizontal" className="items-center sm:col-span-2">
                <FieldLabel htmlFor="settled" className="flex-1">
                  Settled
                </FieldLabel>
                <Switch
                  id="settled"
                  checked={settled}
                  onCheckedChange={setSettled}
                  aria-label="Settled"
                />
              </Field>
            ) : null}
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Optional notes"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
