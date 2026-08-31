import { createRequire } from 'node:module'

type PDFDocumentConstructor = typeof import('pdfkit')

const require = createRequire(import.meta.url)

let pdfDocumentCtor: PDFDocumentConstructor | null = null

export function getPDFDocument(): PDFDocumentConstructor {
  if (!pdfDocumentCtor) {
    // Load from node_modules at runtime so pdfkit's #standard-fonts/* imports resolve.
    pdfDocumentCtor = require('pdfkit') as PDFDocumentConstructor
  }
  return pdfDocumentCtor
}
