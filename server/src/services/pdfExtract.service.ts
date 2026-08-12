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
