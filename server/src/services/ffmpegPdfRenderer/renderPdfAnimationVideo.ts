import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pageIndexToUrl } from "@/animationPipeline/pipeline.types.js";
import type { PdfAnimationScene } from "@/validators/pdfAnimationScene.schema.js";
import { FPS } from "./constants.js";
import { downloadAudio, downloadPageImages } from "./downloadAssets.js";
import { getContainedPageRect } from "./pageLayout.js";
import {
    concatClipsWithAudio,
    renderSceneClip,
    renderSlateClip,
} from "./renderClips.js";
import { buildTimeline, totalTimelineFrames } from "./sceneTimeline.js";

export type RenderPdfAnimationInput = {
    lectureId: string;
    audioUrl: string;
    pdfAnimationScenes: PdfAnimationScene[];
    pageImageUrls: string[];
    outputPath: string;
};

export const renderPdfAnimationVideo = async (
    input: RenderPdfAnimationInput
): Promise<string> => {
    const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), `lecture-ffmpeg-${input.lectureId}-`)
    );

    try {
        const pageUrls = input.pdfAnimationScenes.map((scene) => {
            const url = pageIndexToUrl(input.pageImageUrls, scene.page);
            if (!url) {
                throw new Error(
                    `${scene.id}: missing PDF page image for page ${scene.page}`
                );
            }
            return url;
        });

        const [pages, audioPath] = await Promise.all([
            downloadPageImages(pageUrls, tempDir),
            downloadAudio(input.audioUrl, tempDir),
        ]);

        const timeline = buildTimeline(input.pdfAnimationScenes);
        const clipPaths: string[] = [];
        let clipIndex = 0;

        for (const segment of timeline) {
            const clipPath = path.join(
                tempDir,
                `clip-${String(clipIndex).padStart(4, "0")}.mp4`
            );

            if (segment.kind === "slate") {
                await renderSlateClip(clipPath, segment.durationInFrames);
            } else {
                const url = pageIndexToUrl(
                    input.pageImageUrls,
                    segment.item.scene.page
                );
                const pageImage = url ? pages.get(url) : undefined;
                if (!pageImage) {
                    throw new Error(
                        `${segment.item.scene.id}: page image was not downloaded`
                    );
                }

                const page = getContainedPageRect(pageImage.aspectRatio);
                await renderSceneClip(segment.item, pageImage, page, clipPath);
            }

            clipPaths.push(clipPath);
            clipIndex += 1;
        }

        if (clipPaths.length === 0) {
            throw new Error("FFmpeg timeline produced no clips");
        }

        await fs.mkdir(path.dirname(input.outputPath), { recursive: true });

        const durationSeconds = totalTimelineFrames(timeline) / FPS;
        await concatClipsWithAudio(
            clipPaths,
            audioPath,
            input.outputPath,
            tempDir,
            durationSeconds
        );

        return input.outputPath;
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
};
