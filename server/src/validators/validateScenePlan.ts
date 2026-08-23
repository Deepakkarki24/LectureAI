import type { AudioSegment } from "@/utils/segment.js";
import type { ScenePlan } from "./scene.shema.js";

export const validateScenePlanAgainstSegments = (
    scenePlan: ScenePlan,
    audioSegments: AudioSegment[]
) => {

    const segmentMap = new Map(
        audioSegments.map((segment) => [
            segment.id,
            segment,
        ])
    );

    const representedSegments =
        new Set<string>();

    let previousStart = -Infinity;

    for (const scene of scenePlan.scenes) {

        // --------------------------------
        // Scene timing
        // --------------------------------

        if (scene.end <= scene.start) {
            throw new Error(
                `${scene.id}: end must be greater than start`
            );
        }

        // --------------------------------
        // Scene order
        // --------------------------------

        if (scene.start < previousStart) {
            throw new Error(
                `${scene.id}: scenes are not in chronological order`
            );
        }

        previousStart = scene.start;

        // --------------------------------
        // Segment IDs
        // --------------------------------

        for (const segmentId of scene.narrationSegments) {

            const segment =
                segmentMap.get(segmentId);

            if (!segment) {
                throw new Error(
                    `${scene.id}: invalid narration segment ${segmentId}`
                );
            }

            representedSegments.add(segmentId);
        }

        // --------------------------------
        // Timestamp matching
        // --------------------------------

        const firstSegmentId = scene.narrationSegments[0];

        const lastSegmentId =
            scene.narrationSegments[
            scene.narrationSegments.length - 1
            ];

        if (!firstSegmentId || !lastSegmentId) {
            throw new Error(
                `${scene.id}: narrationSegments cannot be empty`
            );
        }

        const firstSegment = segmentMap.get(firstSegmentId);

        const lastSegment = segmentMap.get(lastSegmentId);

        if (!firstSegment || !lastSegment) {
            throw new Error(
                `${scene.id}: unable to resolve scene segments`
            );
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

    // --------------------------------
    // Check every audio segment
    // --------------------------------

    for (const segment of audioSegments) {

        if (!representedSegments.has(segment.id)) {
            throw new Error(
                `Audio segment ${segment.id} is not represented in any scene`
            );
        }
    }

    return true;
};