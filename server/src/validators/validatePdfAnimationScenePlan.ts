import type { AudioSegment } from "@/utils/segment.js";
import type { PdfAnimationScenePlan } from "./pdfAnimationScene.schema.js";

export const validatePdfAnimationScenePlanAgainstSegments = (
    scenePlan: PdfAnimationScenePlan,
    audioSegments: AudioSegment[],
    pageCount: number
) => {
    if (pageCount < 1) {
        throw new Error("PDF page count must be at least 1");
    }

    const segmentMap = new Map(
        audioSegments.map((segment) => [segment.id, segment])
    );

    const representedSegments = new Set<string>();
    const audioEnd = audioSegments.reduce(
        (max, segment) => Math.max(max, segment.end),
        0
    );

    let previousEnd = -Infinity;

    for (const scene of scenePlan.scenes) {
        if (scene.page < 1 || scene.page > pageCount) {
            throw new Error(
                `${scene.id}: page ${scene.page} is outside this lecture PDF (1–${pageCount})`
            );
        }

        if (scene.end <= scene.start) {
            throw new Error(`${scene.id}: end must be greater than start`);
        }

        if (scene.start < 0 || scene.end < 0) {
            throw new Error(`${scene.id}: timestamps cannot be negative`);
        }

        if (scene.end > audioEnd) {
            throw new Error(
                `${scene.id}: end ${scene.end} is after audio duration ${audioEnd}`
            );
        }

        if (scene.start < previousEnd) {
            throw new Error(
                `${scene.id}: scene overlaps previous scene or is out of order`
            );
        }

        previousEnd = scene.end;

        for (const segmentId of scene.narrationSegments) {
            const segment = segmentMap.get(segmentId);

            if (!segment) {
                throw new Error(
                    `${scene.id}: invalid narration segment ${segmentId}`
                );
            }

            representedSegments.add(segmentId);
        }

        const firstSegmentId = scene.narrationSegments[0];
        const lastSegmentId =
            scene.narrationSegments[scene.narrationSegments.length - 1];

        if (!firstSegmentId || !lastSegmentId) {
            throw new Error(`${scene.id}: narrationSegments cannot be empty`);
        }

        const firstSegment = segmentMap.get(firstSegmentId);
        const lastSegment = segmentMap.get(lastSegmentId);

        if (!firstSegment || !lastSegment) {
            throw new Error(`${scene.id}: unable to resolve scene segments`);
        }

        if (scene.start !== firstSegment.start) {
            throw new Error(
                `${scene.id}: start time ${scene.start} does not match ` +
                    `segment ${firstSegment.id} start ${firstSegment.start}`
            );
        }

        if (scene.end !== lastSegment.end) {
            throw new Error(
                `${scene.id}: end time ${scene.end} does not match ` +
                    `segment ${lastSegment.id} end ${lastSegment.end}`
            );
        }
    }

    for (const segment of audioSegments) {
        if (!representedSegments.has(segment.id)) {
            throw new Error(
                `Audio segment ${segment.id} is not represented in any scene`
            );
        }
    }

    return true;
};
