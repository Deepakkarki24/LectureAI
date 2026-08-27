import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024
const MAX_PDF_PAGES = 8

export const extractPdfText = async (buffer: Buffer) => {
  if (buffer.byteLength > MAX_PDF_SIZE_BYTES) {
    throw new Error('File size exceeds the 20 MB limit.')
  }

  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise

  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new Error(
      `PDF contains ${pdf.numPages} pages. Maximum allowed is ${MAX_PDF_PAGES} pages.`,
    )
  }

  let extractedText = ''

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()

    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')

    extractedText += `\n\n--- Page ${pageNumber} ---\n\n${pageText}`
  }

  return extractedText.trim()
}

export type PdfPageText = {
  page: number
  text: string
}

/** Split stored extract (`--- Page N ---`) into per-page text for this lecture. */
export const parsePdfPagesFromExtractedContent = (
  extractedContent: string,
): PdfPageText[] => {
  const matches = [...extractedContent.matchAll(/--- Page (\d+) ---/g)]

  if (matches.length === 0) {
    const trimmed = extractedContent.trim()
    return trimmed ? [{ page: 1, text: trimmed }] : []
  }

  const pages: PdfPageText[] = []

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]

    if (!match) {
      continue;
    }
    
    const page = Number(match[1])
    const start = (match.index ?? 0) + match[0].length
    const next = matches[i + 1]
    const end = next?.index ?? extractedContent.length
    pages.push({
      page,
      text: extractedContent.slice(start, end).trim(),
    })
  }

  return pages
}
