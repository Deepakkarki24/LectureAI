import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024
export const MAX_PDF_PAGES = 8

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const validatePdfFileBasic = (
  file: File,
): { ok: true } | { error: string } => {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

  if (!isPdf) {
    return { error: 'Only PDF files are allowed.' }
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return { error: 'File size exceeds the 20 MB limit.' }
  }

  return { ok: true }
}

export const validatePageCount = (pageCount: number): string | null => {
  if (pageCount > MAX_PDF_PAGES) {
    return `PDF contains ${pageCount} pages. Maximum allowed is ${MAX_PDF_PAGES} pages.`
  }
  return null
}
