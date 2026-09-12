import { toDateInput } from '#/lib/calendar-date'

export const DEFAULT_JINISCHARA_PERCENTAGE = 5

export const JINISCHARA_CREATE_DRAFT = {
  name: 'NA',
  fatherName: 'NA',
  phoneNo: 'NA',
  credit: 0,
} as const

export function createJinisCharaFormDefaults() {
  return {
    ...JINISCHARA_CREATE_DRAFT,
    percentage: DEFAULT_JINISCHARA_PERCENTAGE,
    description: '',
    date: toDateInput(new Date()),
    active: true,
  }
}

export { getErrorMessage } from '#/lib/form-error'
