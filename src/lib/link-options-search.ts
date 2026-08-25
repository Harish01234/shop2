import { prisma } from '#/db'

type LinkOptionsTable = 'Jinis' | 'JinisChara'

export async function idsMatchingSlNoSearch(
  table: LinkOptionsTable,
  query: string,
) {
  const term = query.replace(/^#/, '').trim()
  if (!term) return [] as string[]

  if (table === 'Jinis') {
    const matches = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Jinis"
      WHERE CAST("slNo" AS TEXT) ILIKE ${`%${term}%`}
    `
    return matches.map((row) => row.id)
  }

  const matches = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "JinisChara"
    WHERE CAST("slNo" AS TEXT) ILIKE ${`%${term}%`}
  `
  return matches.map((row) => row.id)
}

/** Server-side OR filter for Interest link dropdowns (partial SL no + name). */
export async function buildLinkOptionsSearchWhere(
  table: LinkOptionsTable,
  query?: string,
) {
  const trimmed = query?.trim()
  if (!trimmed) return undefined

  const slNoIds = await idsMatchingSlNoSearch(table, trimmed)
  const or: Array<
    | { name: { contains: string; mode: 'insensitive' } }
    | { id: { in: string[] } }
  > = [{ name: { contains: trimmed, mode: 'insensitive' } }]

  if (slNoIds.length > 0) {
    or.push({ id: { in: slNoIds } })
  }

  return { OR: or }
}
