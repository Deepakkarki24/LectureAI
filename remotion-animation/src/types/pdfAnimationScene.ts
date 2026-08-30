/**
 * Mirrors server `pdfAnimationScene.schema.ts` (Phase 2).
 * Remotion must not load lecture PDFs from disk; page images arrive as URLs.
 *
 * Region coordinates: normalized 0–1, origin top-left of the page image.
 */

export const MAX_LECTURE_PDF_PAGES = 18;

export type PdfAnimationType =
    | "none"
    | "zoom_in"
    | "zoom_out"
    | "highlight"
    | "pan"
    | "fade"
    | "focus";

export type PdfSceneTransition = "none" | "fade";

export type NormalizedRegion = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type PdfSceneCamera = {
    from?: NormalizedRegion;
    to?: NormalizedRegion;
    zoom?: number;
};

export type PdfAnimationScene = {
    id: string;
    page: number;
    start: number;
    end: number;
    narrationSegments: string[];
    animation: PdfAnimationType;
    focus?: NormalizedRegion;
    camera?: PdfSceneCamera;
    transition?: PdfSceneTransition;
};

export type PdfAnimationScenePlan = {
    scenes: PdfAnimationScene[];
};
