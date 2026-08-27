import type { PdfAnimationScene } from "@/validators/pdfAnimationScene.schema.js";

/**
 * Dynamic lecture render contract.
 *
 * Every render job is scoped to one uploaded lecture. Paths, page lists,
 * audio, and scenes must be loaded from that lecture at runtime.
 */

/** MongoDB Lecture._id as string. Never a hardcoded lecture. */
export type LectureId = string;

/**
 * Ordered raster URLs for one lecture’s PDF.
 * `pageImageUrls[0]` is page 1. Length is that PDF’s page count (max 8).
 * Never a repo-relative static asset list.
 */
export type LecturePageImages = {
    lectureId: LectureId;
    pageImageUrls: string[];
};

/**
 * Props the server will pass into Remotion for an arbitrary lecture.
 * `scenes` uses the Phase 2 PDF animation contract.
 */
export type DynamicLectureRemotionInput = {
    lectureId: LectureId;
    contentAudioUrl: string;
    pageImageUrls: string[];
    scenes: PdfAnimationScene[];
};

export const pageIndexToUrl = (
    pageImageUrls: string[],
    pageNumber1Based: number
): string | undefined => {
    if (pageNumber1Based < 1) {
        return undefined;
    }
    return pageImageUrls[pageNumber1Based - 1];
};
