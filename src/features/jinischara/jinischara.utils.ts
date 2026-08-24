export const DEFAULT_JINISCHARA_PERCENTAGE = 5

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
