import type { JinisItemInput, JinisType } from './jinis.types'
import { toDateInput } from '#/lib/calendar-date'

export const JINIS_CREATE_DRAFT = {
  name: 'NA',
  fatherName: 'NA',
  phoneNo: 'NA',
  credit: 0,
  type: 'GOLD' as JinisType,
} as const

export function createJinisDraftItem(): JinisItemInput {
  return {
    name: 'NA',
    wet: 0,
    type: 'GOLD',
  }
}

export function createJinisFormDefaults() {
  return {
    ...JINIS_CREATE_DRAFT,
    date: toDateInput(new Date()),
    active: true,
    items: [createJinisDraftItem()],
  }
}

export function sumJinisWeights(
  items: Array<{ type: JinisItemInput['type']; wet?: unknown }>,
) {
  return {
    goldWeight: items
      .filter((item) => item.type === 'GOLD')
      .reduce((total, item) => total + (Number(item.wet) || 0), 0),
    silverWeight: items
      .filter((item) => item.type === 'SILVER')
      .reduce((total, item) => total + (Number(item.wet) || 0), 0),
  }
}

export function formatJinisCredit(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

export { getErrorMessage } from '#/lib/form-error'
