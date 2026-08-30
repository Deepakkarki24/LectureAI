import { createRequire } from "node:module";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_PDF_PAGES = 18;
const TARGET_LONG_EDGE_PX = 1920;
const MIN_SCALE = 1.5;
const MAX_SCALE = 3;

const require = createRequire(import.meta.url);
const pdfjsRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
const toPdfJsDirUrl = (dir: string) =>
    `${path.join(pdfjsRoot, dir).replaceAll("\\", "/")}/`;
const CMAP_URL = toPdfJsDirUrl("cmaps");
const STANDARD_FONT_DATA_URL = toPdfJsDirUrl("standard_fonts");

export type PdfPageImage = {
    page: number;
    width: number;
    height: number;
    pngBuffer: Buffer;
};

const scaleForViewport = (width: number, height: number) => {
    const longEdge = Math.max(width, height);
    if (longEdge <= 0) {
        return MIN_SCALE;
    }
    const scale = TARGET_LONG_EDGE_PX / longEdge;
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
};

/**
 * Rasterize every page of this lecture's PDF to PNG.
 * Uses a uniform scale (no stretch) so page aspect ratio is preserved.
 */
export const rasterizePdfPages = async (
    buffer: Buffer
): Promise<PdfPageImage[]> => {
    if (buffer.byteLength > MAX_PDF_SIZE_BYTES) {
        throw new Error("File size exceeds the 20 MB limit.");
    }

    const pdf = await getDocument({
        data: new Uint8Array(buffer),
        cMapUrl: CMAP_URL,
        cMapPacked: true,
        standardFontDataUrl: STANDARD_FONT_DATA_URL,
    }).promise;

    if (pdf.numPages > MAX_PDF_PAGES) {
        throw new Error(
            `PDF contains ${pdf.numPages} pages. Maximum allowed is ${MAX_PDF_PAGES} pages.`
        );
    }

    const canvasFactory = pdf.canvasFactory as {
        create: (
            width: number,
            height: number
        ) => {
            canvas: {
                width: number;
                height: number;
                toBuffer: (mime: string) => Buffer;
            };
            context: unknown;
        };
        destroy?: (canvasAndContext: unknown) => void;
    };

    if (!canvasFactory?.create) {
        throw new Error(
            "PDF page rendering is unavailable. Install @napi-rs/canvas."
        );
    }

    const pages: PdfPageImage[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = scaleForViewport(baseViewport.width, baseViewport.height);
        const viewport = page.getViewport({ scale });

        const canvasAndContext = canvasFactory.create(
            viewport.width,
            viewport.height
        );

        await page.render({
            canvas: canvasAndContext.canvas,
            canvasContext: canvasAndContext.context as CanvasRenderingContext2D,
            viewport,
        }).promise;

        const pngBuffer = Buffer.from(
            canvasAndContext.canvas.toBuffer("image/png")
        );

        pages.push({
            page: pageNumber,
            width: Math.round(viewport.width),
            height: Math.round(viewport.height),
            pngBuffer,
        });

        page.cleanup();
        canvasFactory.destroy?.(canvasAndContext);
    }

    if (pages.length === 0) {
        throw new Error("No PDF pages could be converted to images.");
    }

    return pages;
};
