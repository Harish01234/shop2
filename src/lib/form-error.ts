import { ZodError } from 'zod'

export const SAVE_ERROR_FALLBACK =
  'Could not save. Check the highlighted fields.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function issueMessages(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((issue) => {
      if (!isRecord(issue) || typeof issue.message !== 'string') return ''
      return issue.message.trim()
    })
    .filter(Boolean)
}

function looksLikeCodingError(message: string) {
  const trimmed = message.trim()
  const lower = trimmed.toLowerCase()

  if (!trimmed) return true
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return true
  if (lower.includes('invalid_type')) return true
  if (lower.includes('invalid type')) return true
  if (lower.includes('expected ')) return true
  if (lower.includes('received ')) return true
  if (lower.includes('prisma')) return true
  if (lower.includes(' at ') && lower.includes('.ts')) return true
  if (lower.includes('failed to parse')) return true
  return false
}

function uniqueHumanMessages(messages: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const message of messages) {
    if (looksLikeCodingError(message) || seen.has(message)) continue
    seen.add(message)
    result.push(message)
  }

  return result
}

export function getErrorMessage(
  error: unknown,
  fallback = SAVE_ERROR_FALLBACK,
) {
  if (error instanceof ZodError) {
    const messages = uniqueHumanMessages(
      error.issues.map((issue) => issue.message),
    )
    return messages[0] ?? fallback
  }

  if (isRecord(error) && 'issues' in error) {
    const messages = uniqueHumanMessages(issueMessages(error.issues))
    if (messages.length > 0) return messages[0]
  }

  if (error instanceof Error && error.message) {
    if (looksLikeCodingError(error.message)) return fallback
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    if (looksLikeCodingError(error)) return fallback
    return error
  }

  return fallback
}
