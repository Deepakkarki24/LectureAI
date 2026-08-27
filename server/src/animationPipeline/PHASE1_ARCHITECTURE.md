# Phase 1 — PDF animation pipeline architecture

This folder is the **Phase 1** contract for the PDF animation work. It does **not** change runtime behavior. Existing extract → script → TTS → HeyGen → Remotion slides → FFmpeg merge remains the live path until later phases are approved.

## Constraints (binding for all later phases)

- **No frontend changes.** Client upload, preview, and APIs stay as they are.
- **Backend + Remotion only.** Scene plan, page images, Zod, DB scene fields, and the Remotion composition are the in-scope surface.
- **PDFs are dynamic.** Every lecture is a different upload. Do not hardcode:
  - PDF files or filenames
  - page image paths or URLs
  - page counts
  - scene lists
  - lecture IDs
  - Cloudinary public IDs beyond a **pattern** keyed by `lectureId` / stored `pdfName`
- **Incremental.** Keep current controllers, HeyGen, intro/outro, Cloudinary upload helpers, and FFmpeg merge intact. Wire new pieces only when a phase is approved.
- **Do not start Phase 2+** (new Zod scene schema, planner prompt rewrite, page rasterizer implementation, Remotion camera renderer) until explicitly approved.

## Dynamic lecture identity

The only stable key for a run is **`lectureId`** (MongoDB `Lecture._id`).

| Asset | Source at runtime | Must not be |
| --- | --- | --- |
| PDF bytes | Multer memory buffer on `POST /api/pdf/extract` | A file checked into the repo |
| Extracted text | `Lecture.extractedContent` (includes `--- Page N ---`) | A sample PDF string |
| English content audio | `Lecture.audio.english.contentUrl` after TTS | A fixed Cloudinary URL |
| Sentence timestamps | Built from that lecture’s ElevenLabs alignment | Invented or shared across lectures |
| Page images (later) | Generated from **that request’s** PDF buffer, stored per lecture | `remotion-animation/public/page1.png` |
| Scene plan (later) | AI output for **that** script + **that** alignment + **that** page set | A fixture `scenes.json` in Remotion |

Remotion must receive **props** (`audioUrl`, `scenes`, later `pageImageUrls`) from the server for the lecture being rendered. Composition default props stay empty placeholders for Studio only.

## Responsibility split

```text
┌─────────────────────────────────────────────────────────────┐
│  SERVER — lecture processing (per lectureId)                │
│                                                             │
│  1. PDF ingest (existing)                                   │
│     pdfController + multer + pdfExtract.service             │
│     Owns: buffer lifetime, page-count limits, text extract  │
│                                                             │
│  2. PDF / page handling (later phase, new service)          │
│     Rasterize pages from the SAME extract buffer            │
│     Upload images; persist URLs on Lecture                  │
│     Owns: aspect ratio, ordering page 1..N, URLs            │
│                                                             │
│  3. Script + TTS (existing, unchanged unless wiring)        │
│     runner + elevenlabs + segment.ts                        │
│     Owns: English content MP3 + sentence segments           │
│                                                             │
│  4. Scene generation (later phase, existing entry point)    │
│     generateSceneFromModel + Zod + validateScenePlan        │
│     Owns: validated scenes timed to THIS lecture’s segments │
│     Must receive: segments + per-page text (from DB)        │
│     Must not receive: a global/hardcoded PDF                │
│                                                             │
│  5. Remotion job kickoff (existing wrapper, later props)    │
│     videoController → remotionProcess → renderAnimationVideo│
│     Owns: load Lecture by id, pass dynamic props, Cloudinary│
│           remotion URL, then existing merge pipeline        │
└─────────────────────────┬───────────────────────────────────┘
                          │ inputProps (no local PDF paths)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  REMOTION PACKAGE — deterministic render only               │
│                                                             │
│  render.ts / LectureVideo                                   │
│  Owns: frames, fps, Sequences, Audio, visual animation      │
│  Must not: read a lecture PDF from disk, call OpenAI,       │
│            call ElevenLabs, or assume a fixed page count    │
└─────────────────────────────────────────────────────────────┘
```

### Module map (existing vs later)

| Responsibility | Live code today | Later phases (not implemented here) |
| --- | --- | --- |
| PDF upload + text | `controllers/pdfController.ts`, `services/pdfExtract.service.ts` | Persist page image URLs on extract (smallest extract change) |
| Page images | *none* | New `services/pdfPageImage.service.ts`; input = `Buffer`, output = ordered URLs |
| Scene types / Zod | `validators/scene.shema.ts` | Replace with page + region + animation contract |
| Timing vs audio | `utils/segment.ts`, `validators/validateScenePlan.ts` | Extend checks (page index, region 0–1, duration) |
| Scene planner | `runner.ts` `generateSceneFromModel` | Prompt + pass per-page text from **this** lecture |
| Remotion props | `{ scenes, audioUrl }` | Add `pageImageUrls: string[]` from Lecture |
| Remotion visuals | Reconstructed slide components | Page-camera over those URLs |
| Merge / HeyGen | `remotionProcess.ts`, `heyGenWebhook.ts`, `merge.ffmpeg.ts` | Unchanged |

## Server vs Remotion boundary

**Server** decides *what* to show and *when* (lecture-scoped data).

**Remotion** decides *how* to interpolate that plan on a frame timeline.

Contract for any lecture (types in `pipeline.types.ts`):

```ts
{
  lectureId: string;
  contentAudioUrl: string;      // this lecture’s English content track
  pageImageUrls: string[];      // index 0 = page 1 of THIS pdf; length = page count
  scenes: unknown;              // typed in Phase 2
}
```

`pageImageUrls.length` and scene `page` indices must come from the same lecture. Remotion must not fall back to bundled sample pages if the array is missing (fail the job instead).

## What Phase 1 does *not* include

- New Zod scene schema
- Mongo scene field redesign
- Planner prompt rewrite
- PDF rasterization implementation
- Remotion zoom/pan/highlight components
- Wiring `pageImageUrls` into `renderLectureVideo`
- Frontend work

## How to test (current live pipeline, unchanged)

Same as today: extract → script → TTS → `POST /api/video/create` with a **real** `lectureId` from that upload. Do not use a hardcoded PDF in Remotion Studio as the acceptance path.
