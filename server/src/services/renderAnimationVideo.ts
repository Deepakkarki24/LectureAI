import path from "node:path";
import { fileURLToPath } from "node:url";
import cloudinary from "@/config/cloudinary.config.js";
import { pageIndexToUrl } from "@/animationPipeline/pipeline.types.js";
import { renderLectureVideo } from "remotion-animation";
import type {
    PdfAnimationScene as RemotionPdfAnimationScene,
    Scene,
} from "remotion-animation";
import type {
    NormalizedRegion,
    PdfAnimationScene,
} from "@/validators/pdfAnimationScene.schema.js";

const asPlainArray = <T>(value: unknown): T[] => {
    if (typeof value === "string") {
        const parsed: unknown = JSON.parse(value);
        if (!Array.isArray(parsed)) {
            throw new Error("Expected a JSON array");
        }
        return parsed as T[];
    }

    if (!Array.isArray(value)) {
        throw new Error("Expected an array");
    }

    return JSON.parse(JSON.stringify(value)) as T[];
};

const omitUndefinedRegion = (
    region: NormalizedRegion | undefined
): NormalizedRegion | undefined => {
    if (!region) {
        return undefined;
    }

    return {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
    };
};

/**
 * Zod optional fields are `T | undefined`. Remotion’s props use
 * exactOptionalPropertyTypes, so those keys must be omitted — not set to
 * undefined — and mongoose leftovers must not leak into inputProps.
 */
const toRemotionPdfAnimationScenes = (
    scenes: PdfAnimationScene[]
): RemotionPdfAnimationScene[] =>
    scenes.map((scene) => {
        const mapped: RemotionPdfAnimationScene = {
            id: scene.id,
            page: scene.page,
            start: scene.start,
            end: scene.end,
            narrationSegments: [...scene.narrationSegments],
            animation: scene.animation,
        };

        const focus = omitUndefinedRegion(scene.focus);
        if (focus) {
            mapped.focus = focus;
        }

        if (scene.camera) {
            const camera: NonNullable<RemotionPdfAnimationScene["camera"]> = {};
            const from = omitUndefinedRegion(scene.camera.from);
            const to = omitUndefinedRegion(scene.camera.to);

            if (from) {
                camera.from = from;
            }
            if (to) {
                camera.to = to;
            }
            if (scene.camera.zoom !== undefined) {
                camera.zoom = scene.camera.zoom;
            }

            mapped.camera = camera;
        }

        if (scene.transition) {
            mapped.transition = scene.transition;
        }

        return mapped;
    });

export const assertPdfPagesForScenes = (
    pdfAnimationScenes: PdfAnimationScene[],
    pageImageUrls: string[]
) => {
    if (pageImageUrls.length === 0) {
        throw new Error("No PDF page images are stored for this lecture");
    }

    for (const scene of pdfAnimationScenes) {
        const url = pageIndexToUrl(pageImageUrls, scene.page);
        if (!url) {
            throw new Error(
                `${scene.id}: missing PDF page image for page ${scene.page}`
            );
        }
    }
};

export type RenderAnimationInput = {
    lectureId: string;
    audioUrl: string;
    scenes: unknown;
    pdfAnimationScenes?: unknown;
    pageImageUrls?: string[];
};

export const renderVideoAnimation = async (
    input: RenderAnimationInput
): Promise<string> => {
    console.log("Remotion process started!");

    if (!input.audioUrl) {
        throw new Error("Content audio URL is required for Remotion");
    }

    const scenes = asPlainArray<Scene>(input.scenes ?? []);
    const pdfAnimationScenes = asPlainArray<PdfAnimationScene>(
        input.pdfAnimationScenes ?? []
    );
    const pageImageUrls = input.pageImageUrls ?? [];

    if (pdfAnimationScenes.length > 0) {
        assertPdfPagesForScenes(pdfAnimationScenes, pageImageUrls);
    }

    if (pdfAnimationScenes.length === 0 && scenes.length === 0) {
        throw new Error("No scene plan is available for Remotion");
    }

    const packageRoot = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../remotion-animation"
    );

    const outputPath = await renderLectureVideo({
        outputLocation: path.join(
            packageRoot,
            "out",
            `video-${input.lectureId}.mp4`
        ),
        inputProps: {
            audioUrl: input.audioUrl,
            scenes,
            pageImageUrls: [...pageImageUrls],
            pdfAnimationScenes: toRemotionPdfAnimationScenes(pdfAnimationScenes),
        },
    });

    console.log("Remotion video generated.");
    console.log("Video uploading to cloud...");

    const result = await cloudinary.uploader.upload(outputPath, {
        resource_type: "video",
        folder: "lecture-videos",
        public_id: `remotion-${input.lectureId}`,
    });

    if (!result?.secure_url) {
        throw new Error("Unable to upload Remotion video to Cloudinary");
    }

    console.log("Video uploaded successfully.");
    return result.secure_url;
};
