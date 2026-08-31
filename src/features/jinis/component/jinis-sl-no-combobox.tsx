import { SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { InputGroupAddon } from '@/components/ui/input-group'

export type JinisSlNoOption = {
  id: string
  slNo: number
  name: string
}

export function formatJinisSlNoOption(item: JinisSlNoOption) {
  return `#${item.slNo} · ${item.name}`
}

export function mergeJinisSlNoOption(
  options: JinisSlNoOption[],
  selected?: JinisSlNoOption | null,
) {
  if (!selected) return options
  if (options.some((item) => item.id === selected.id)) return options
  return [selected, ...options]
}

type JinisSlNoComboboxProps = {
  id: string
  value: string
  onValueChange: (id: string) => void
  options: JinisSlNoOption[]
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  onQueryChange?: (query: string) => void
}

export function JinisSlNoCombobox({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  onQueryChange,
}: JinisSlNoComboboxProps) {
  const selected = options.find((item) => item.id === value) ?? null

  return (
    <Combobox
      name={id}
      items={options}
      value={selected}
      onValueChange={(item) => onValueChange(item?.id ?? '')}
      itemToStringLabel={formatJinisSlNoOption}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(a, b) => a.id === b.id}
      autoHighlight
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
          {(item: JinisSlNoOption) => (
            <ComboboxItem key={item.id} value={item}>
              {formatJinisSlNoOption(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
