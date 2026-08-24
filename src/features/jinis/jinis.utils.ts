import type { JinisItemInput } from './jinis.types'

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
