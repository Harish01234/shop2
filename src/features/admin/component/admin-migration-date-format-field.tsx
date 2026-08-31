import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  CSV_DATE_ORDER_OPTIONS,
  readStoredCsvDateOrder,
  storeCsvDateOrder,
  type CsvDateOrder,
} from '#/features/admin/admin-migration-date-format'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'

type MigrationCsvDateOrderContextValue = {
  dateOrder: CsvDateOrder
  setDateOrder: (order: CsvDateOrder) => void
}

const MigrationCsvDateOrderContext =
  createContext<MigrationCsvDateOrderContextValue | null>(null)

export function MigrationCsvDateOrderProvider({
  children,
}: {
  children: ReactNode
}) {
  const [dateOrder, setDateOrderState] = useState<CsvDateOrder>('auto')

  useEffect(() => {
    setDateOrderState(readStoredCsvDateOrder())
  }, [])

  function setDateOrder(order: CsvDateOrder) {
    setDateOrderState(order)
    storeCsvDateOrder(order)
  }

  return (
    <MigrationCsvDateOrderContext.Provider value={{ dateOrder, setDateOrder }}>
      {children}
    </MigrationCsvDateOrderContext.Provider>
  )
}

export function useMigrationCsvDateOrder() {
  const context = useContext(MigrationCsvDateOrderContext)
  if (!context) {
    throw new Error(
      'useMigrationCsvDateOrder must be used within MigrationCsvDateOrderProvider',
    )
  }
  return context
}

type AdminMigrationDateFormatFieldProps = {
  value: CsvDateOrder
  onValueChange: (order: CsvDateOrder) => void
}

export function AdminMigrationDateFormatField({
  value,
  onValueChange,
}: AdminMigrationDateFormatFieldProps) {
  const selected = CSV_DATE_ORDER_OPTIONS.find((option) => option.value === value)

  return (
    <Field>
      <FieldLabel htmlFor="csvDateOrder">Date format in CSV</FieldLabel>
      <NativeSelect
        id="csvDateOrder"
        className="w-full max-w-md"
        value={value}
        onChange={(event) => onValueChange(event.target.value as CsvDateOrder)}
      >
        {CSV_DATE_ORDER_OPTIONS.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {selected ? (
        <p className="text-sm text-muted-foreground">{selected.hint}</p>
      ) : null}
    </Field>
  )
}
