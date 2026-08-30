import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024
const MAX_PDF_PAGES = 18

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


export type LayoutLine = {
  id: string          // e.g. "p2_line_5"
  text: string        // full text of the line
  x: number           // normalized 0–1 (left edge)
  y: number           // normalized 0–1 (top edge, 0 = top of page)
  width: number       // normalized 0–1
  height: number      // normalized 0–1
}

export type PdfPageLayout = {
  page: number
  pageWidth: number   // actual rendered px width (at scale=1)
  pageHeight: number  // actual rendered px height (at scale=1)
  lines: LayoutLine[]
}

export const extractPdfLayout = async (buffer: Buffer): Promise<PdfPageLayout[]> => {
  if (buffer.byteLength > MAX_PDF_SIZE_BYTES) {
    throw new Error('File size exceeds the 20 MB limit.')
  }

  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise

  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new Error(
      `PDF contains ${pdf.numPages} pages. Maximum allowed is ${MAX_PDF_PAGES} pages.`,
    )
  }

  const pageLayouts: PdfPageLayout[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })
    const textContent = await page.getTextContent()

    // ── 1. Collect raw items with position ───────────────────────────────────
    type RawItem = { text: string; x: number; y: number; w: number; h: number }
    const rawItems: RawItem[] = []

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue

      const [, , , , tx, ty] = item.transform as number[]

      if (!ty) continue

      rawItems.push({
        text: item.str,
        x: tx as number,
        // pdf.js origin is bottom-left; flip to top-left
        y: viewport.height - ty - (item.height ?? 0),
        w: item.width ?? 0,
        h: item.height ?? 12,
      })
    }

    // ── 2. Group into lines by proximity on the Y axis ───────────────────────
    // Items within LINE_THRESHOLD px of each other are on the same line
    const LINE_THRESHOLD = 4 // px at scale=1

    const sortedByY = [...rawItems].sort((a, b) => a.y - b.y || a.x - b.x)

    type LineGroup = RawItem[]
    const lineGroups: LineGroup[] = []
    let currentGroup: LineGroup = []

    for (const item of sortedByY) {
      if (currentGroup.length === 0) {
        currentGroup.push(item)
        continue
      }

      const groupY = currentGroup[0]!.y
      if (Math.abs(item.y - groupY) <= LINE_THRESHOLD) {
        currentGroup.push(item)
      } else {
        lineGroups.push(currentGroup)
        currentGroup = [item]
      }
    }
    if (currentGroup.length > 0) lineGroups.push(currentGroup)

    // ── 3. Build raw normalized lines ────────────────────────────────────────
    type RawLine = { text: string; x: number; y: number; width: number; height: number }

    const rawLines: RawLine[] = lineGroups.map((group) => {
      const sortedByX = [...group].sort((a, b) => a.x - b.x)
      const text = sortedByX.map(it => it.text).join(' ').trim()

      const minX = Math.min(...group.map(it => it.x))
      const minY = Math.min(...group.map(it => it.y))
      const maxX = Math.max(...group.map(it => it.x + it.w))
      const maxY = Math.max(...group.map(it => it.y + it.h))

      return {
        text,
        x: minX / viewport.width,
        y: minY / viewport.height,
        width: (maxX - minX) / viewport.width,
        height: (maxY - minY) / viewport.height,
      }
    })

    // ── 4. Group raw lines into paragraphs ───────────────────────────────────
    // Lines with a vertical gap smaller than GAP_THRESHOLD belong to the same paragraph
    const GAP_THRESHOLD = 0.03  // normalized 0–1 — lower for dense notes, raise for slides
    const paragraphs: RawLine[] = []
    let current: RawLine | null = null

    for (const line of rawLines) {
      if (!current) {
        current = { ...line }
        continue
      }

      const gap = line.y - (current.y + current.height)

      if (gap < GAP_THRESHOLD) {
        // Same paragraph — expand the bounding box to cover both lines
        current = {
          text: current.text + ' ' + line.text,
          x: Math.min(current.x, line.x),
          y: current.y,
          width: Math.max(current.x + current.width, line.x + line.width) - Math.min(current.x, line.x),
          height: (line.y + line.height) - current.y,
        }
      } else {
        paragraphs.push(current)
        current = { ...line }
      }
    }
    if (current) paragraphs.push(current)

    // ── 5. Assign final IDs ───────────────────────────────────────────────────
    const lines: LayoutLine[] = paragraphs.map((p, i) => ({
      id: `p${pageNumber}_line_${i + 1}`,
      text: p.text,
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
    }))

    pageLayouts.push({
      page: pageNumber,
      pageWidth: Math.round(viewport.width),
      pageHeight: Math.round(viewport.height),
      lines,
    })

    page.cleanup()
  }

  return pageLayouts
}