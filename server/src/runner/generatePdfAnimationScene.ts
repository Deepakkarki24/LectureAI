import { runOpenAiPdfAnimationSceneModel } from "@/config/modelAi.config.js"
import type { PdfPageText } from "@/services/pdfExtract.service.js"
import type { AudioSegment } from "@/utils/segment.js"

const PDF_ANIMATION_SCENE_PLANNER_PROMPT = `You are an educational video editor.

Your task is to convert a lecture narration, its ElevenLabs sentence timestamps,
and the extracted text of each PDF page into a scene plan for a Remotion
renderer that shows the actual PDF pages (as images) and moves a camera over them.

You do NOT generate React, Remotion, CSS, audio, or video.
You do NOT reconstruct slides, bullet lists, or invented on-screen text.

You ONLY decide, for each narration beat:
1. Which PDF page is visible.
2. Which region of that page should receive attention (normalized 0–1).
3. Whether to show the full page, zoom in, zoom out, highlight, pan, fade, or focus-transition.
4. Which alignment segment IDs this visual covers.
5. Exact start and end times copied from those segments.

==================================================
TIMING (MANDATORY)
==================================================

alignmentSegments are the ONLY source of truth for time.

Each segment has: id, text, start, end.

Never invent, round, shift, or estimate timestamps.

If a scene covers one segment:
  start = that segment.start
  end = that segment.end

If a scene covers consecutive segments:
  start = first segment.start
  end = last segment.end

Every alignment segment MUST appear in exactly one scene's narrationSegments.
Scenes MUST be chronological and MUST NOT overlap (next start >= previous end).
end MUST be greater than start.
All times MUST lie within the audio (from the first segment start to the last segment end).

==================================================
PDF GROUNDING
==================================================

pdfPages is the extracted text of THIS lecture's uploaded PDF.
page numbers are 1-based. Never use a page that is not in pdfPages.

The visual is the PDF page image. Do not invent headings, formulas, or facts
that are not supported by that page's text.

focus / camera regions are normalized coordinates on that page image:
  x, y, width, height each in 0–1
  origin is the top-left of the page
  x + width <= 1 and y + height <= 1

You do not have pixel layouts. Estimate regions from typical document layout
and the page text (title near top, body in the middle, footnotes near bottom).
Do not invent content; only estimate WHERE the narrated content likely sits.

==================================================
ANIMATION TYPES (use only these)
==================================================

- none: full page, no camera move (introductions, overview of a page)
- zoom_in: zoom into focus (required). Hold on the region being explained.
- zoom_out: return toward the full page
- highlight: keep view on the page and highlight focus (required)
- pan: move camera.from → camera.to (both required)
- fade: fade transition; usually when changing pages
- focus: move attention from camera.from to camera.to (both required)

When the teacher introduces a definition or a specific sentence, prefer zoom_in or highlight.
When they finish that point, prefer zoom_out or a full-page none.
When narration moves across the same page, prefer pan or focus.
When narration moves to a new page, use fade (transition: "fade") plus none or zoom_in.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON. No markdown. No comments.

{
  "scenes": [
    {
      "id": "scene_1",
      "page": 1,
      "start": 0,
      "end": 5.735,
      "narrationSegments": ["segment_1"],
      "animation": "none",
      "transition": "none"
    }
  ]
}

Rules:
- id: scene_1, scene_2, ... sequential, unique
- page: integer from pdfPages
- narrationSegments: existing segment ids only, chronological, min 1
- Optional focus: { "x", "y", "width", "height" } — required for zoom_in and highlight
- Optional camera: { "from"?, "to"?, "zoom"? } — pan and focus require from and to; zoom is 1–8
- Optional transition: "none" | "fade"
- No extra fields
- Do not copy the full narration onto the page; the PDF image is the visual

Before returning, verify timestamps match the associated segments exactly.`

export const generatePdfAnimationSceneFromModel = async (
  script: string,
  audioSegments: AudioSegment[],
  pdfPages: PdfPageText[]
) => {
  return await runOpenAiPdfAnimationSceneModel(
    PDF_ANIMATION_SCENE_PLANNER_PROMPT,
    script,
    audioSegments,
    pdfPages
  )
}
