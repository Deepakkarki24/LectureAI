import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneAnimation } from "../types/scene";

export const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

export const useSceneOpacity = (
    durationInFrames: number,
    animation: SceneAnimation
) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const fadeInEnd = Math.round(fps * 0.45);
    const fadeOutStart = durationInFrames - Math.round(fps * 0.45);

    return interpolate(
        frame,
        [0, fadeInEnd, fadeOutStart, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
};

export const useEntranceSpring = (delayFrames = 0, stiffness = 120) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return spring({
        frame: frame - delayFrames,
        fps,
        config: { damping: 18, stiffness },
    });
};

export const useStaggerReveal = (
    index: number,
    contentStart: number,
    staggerFrames: number
) => {
    const frame = useCurrentFrame();
    const start = contentStart + index * staggerFrames;

    const opacity = interpolate(frame, [start, start + 14], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const translateX = interpolate(frame, [start, start + 18], [36, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return { opacity, translateX, start };
};

export const useActiveHighlight = (
    frame: number,
    start: number,
    end: number,
    fps: number
) => {
    const isActive = frame >= start && frame < end + Math.round(fps * 0.3);

    const highlightOpacity = isActive
        ? interpolate(frame, [start + 5, start + 20], [0.3, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
          })
        : 0.5;

    return { isActive, highlightOpacity };
};

export const getTeachingTiming = (durationInFrames: number, fps: number) => {
    const contentStart = Math.round(fps * 0.55);
    const contentEnd = durationInFrames - Math.round(fps * 0.75);
    const contentDuration = Math.max(contentEnd - contentStart, 1);

    return { contentStart, contentEnd, contentDuration, fps };
};
