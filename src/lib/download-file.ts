export type DownloadableFile = {
  filename: string
  mimeType: string
  content: string
  encoding: 'base64'
}

export function downloadBase64File(file: DownloadableFile) {
  const bytes = Uint8Array.from(atob(file.content), (char) => char.charCodeAt(0))
  const blob = new Blob([bytes], { type: file.mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.filename
  link.click()
  URL.revokeObjectURL(url)
}
