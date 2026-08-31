import type {
    NormalizedRegion,
    PdfAnimationScene,
    PdfAnimationType,
} from "@/validators/pdfAnimationScene.schema.js";
import { FPS } from "./constants.js";

export type ResolvedAnimation = PdfAnimationType | "none";

export type TimelineScene = {
    scene: PdfAnimationScene;
    startFrame: number;
    durationInFrames: number;
    animation: ResolvedAnimation;
    previousZoomScale: number;
    previousFocus: NormalizedRegion | undefined;
};

export type TimelineSegment =
    | { kind: "slate"; durationInFrames: number }
    | { kind: "scene"; item: TimelineScene };

const lastZoomState = (
    scenes: PdfAnimationScene[],
    beforeIndex: number
): { scale: number; focus: NormalizedRegion | undefined } => {
    let scale = 1;
    let focus: NormalizedRegion | undefined;

    for (let i = 0; i < beforeIndex; i++) {
        const scene = scenes[i];
        if (!scene) {
            continue;
        }

        if (scene.animation === "zoom_in" && scene.focus) {
            scale = 2;
            focus = scene.focus;
        } else if (scene.animation === "zoom_out") {
            scale = 1;
        }
    }

    return { scale, focus };
};

export const resolveAnimation = (scene: PdfAnimationScene): ResolvedAnimation => {
    if (
        (scene.animation === "zoom_in" || scene.animation === "highlight") &&
        !scene.focus
    ) {
        return "none";
    }

    return scene.animation;
};

export const getCompositionFrames = (scenes: PdfAnimationScene[]): number => {
    if (scenes.length === 0) {
        return 1;
    }

    const maxEnd = Math.max(...scenes.map((scene) => scene.end));
    return Math.max(Math.ceil(maxEnd * FPS), 1);
};

export const buildTimeline = (
    scenes: PdfAnimationScene[]
): TimelineSegment[] => {
    const compositionFrames = getCompositionFrames(scenes);
    const segments: TimelineSegment[] = [];
    let cursor = 0;

    for (let index = 0; index < scenes.length; index++) {
        const scene = scenes[index];
        if (!scene) {
            continue;
        }

        const startFrame = Math.round(scene.start * FPS);
        const endFrame = Math.round(scene.end * FPS);
        const durationInFrames = Math.max(endFrame - startFrame, 1);
        const zoom = lastZoomState(scenes, index);

        if (startFrame > cursor) {
            segments.push({
                kind: "slate",
                durationInFrames: startFrame - cursor,
            });
            cursor = startFrame;
        }

        if (startFrame < cursor) {
            console.warn(
                `${scene.id}: overlaps previous scene; concatenating immediately`
            );
        }

        segments.push({
            kind: "scene",
            item: {
                scene,
                startFrame,
                durationInFrames,
                animation: resolveAnimation(scene),
                previousZoomScale: zoom.scale,
                previousFocus: zoom.focus,
            },
        });

        cursor += durationInFrames;
    }

    if (compositionFrames > cursor) {
        segments.push({
            kind: "slate",
            durationInFrames: compositionFrames - cursor,
        });
    }

    return segments;
};

export const totalTimelineFrames = (segments: TimelineSegment[]): number =>
    segments.reduce((sum, segment) => {
        if (segment.kind === "slate") {
            return sum + segment.durationInFrames;
        }
        return sum + segment.item.durationInFrames;
    }, 0);
