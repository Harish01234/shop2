import type { JinisItemInput } from './jinis.types'

export function sumJinisWeights(items: JinisItemInput[]) {
  return {
    goldWeight: items
      .filter((item) => item.type === 'GOLD')
      .reduce((total, item) => total + item.wet, 0),
    silverWeight: items
      .filter((item) => item.type === 'SILVER')
      .reduce((total, item) => total + item.wet, 0),
  }
}

export function formatJinisCredit(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
