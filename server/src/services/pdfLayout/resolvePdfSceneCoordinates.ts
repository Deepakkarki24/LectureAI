import type { PdfPageLayout } from "@/services/pdfExtract.service.js"

// Padding added around the matched line so the highlight isn't too tight
const PADDING_X = 0.01
const PADDING_Y = 0.005

export type RawScene = {
  id: string
  page: number
  start: number
  end: number
  narrationSegments: string[]
  animation: string
  focusLineId?: string
  transition?: string
}

type ResolvedScene = Omit<RawScene, 'focusLineId'> & {
  focus?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export const resolvePdfSceneCoordinates = (
  scenes: RawScene[],
  pdfLayout: PdfPageLayout[]
): ResolvedScene[] => {
  // Build a flat lookup map: lineId → { x, y, width, height }
  const coordinateMap = new Map<string, { x: number; y: number; width: number; height: number }>()

  for (const page of pdfLayout) {
    for (const line of page.lines) {
      coordinateMap.set(line.id, {
        x: line.x,
        y: line.y,
        width: line.width,
        height: line.height,
      })
    }
  }

  return scenes.map(scene => {
    const { focusLineId, ...rest } = scene

    // Only resolve for animations that actually use focus
    if (!focusLineId || !['zoom_in', 'highlight'].includes(scene.animation)) {
      return rest
    }

    const bbox = coordinateMap.get(focusLineId)

    if (!bbox) {
      // Line ID the model returned doesn't exist — log and fall back to no focus
      console.warn(
        `⚠️  focusLineId "${focusLineId}" not found in pdfLayout for scene "${scene.id}". Falling back to animation "none".`
      )
      return {
        ...rest,
        animation: 'none',
      }
    }

    const getPadding = (animation: string) => {
      if (animation === 'zoom_in') {
        return { px: 0.05, py: 0.08 }  // show more context around the line
      }
      return { px: 0.01, py: 0.005 }   // highlight stays tight
    }

    // Apply padding and clamp to 0–1
    const { px, py } = getPadding(scene.animation)
    const x = Math.max(0, bbox.x - PADDING_X)
    const y = Math.max(0, bbox.y - PADDING_Y)
    const width = Math.min(1 - x, bbox.width + PADDING_X * 2)
    const height = Math.min(1 - y, bbox.height + PADDING_Y * 2)

    return {
      ...rest,
      focus: { x, y, width, height },
    }
  })
}