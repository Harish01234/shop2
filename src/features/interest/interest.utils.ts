export { getErrorMessage } from '#/lib/form-error'

export function interestLinkLabel(record: {
  personName: string | null
  jinis?: { slNo: number; name: string } | null
  jinisChara?: { slNo: number; name: string } | null
}) {
  if (record.jinis) return `Jinis · #${record.jinis.slNo} ${record.jinis.name}`
  if (record.jinisChara) {
    return `JinisChara · #${record.jinisChara.slNo} ${record.jinisChara.name}`
  }
  if (record.personName) return record.personName
  return '—'
}
