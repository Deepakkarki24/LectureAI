import type { PdfAnimationScene } from "./types/pdfAnimationScene";

/**
 * Remotion receives these as inputProps from the server for a given lecture.
 * Do not import PDFs or page PNGs from this package’s disk.
 */

export type DynamicLectureVideoInput = {
    audioUrl: string;
    pageImageUrls: string[];
    scenes: PdfAnimationScene[];
};
