import { DEFAULT_PAGE_ASPECT, FRAME_HEIGHT, FRAME_WIDTH } from "./constants.js";

export type ContainedPageRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const even = (value: number, max: number) => {
    let rounded = Math.round(value);
    if (rounded % 2 !== 0) {
        rounded += 1;
    }
    rounded = Math.min(Math.max(rounded, 2), max);
    if (rounded % 2 !== 0) {
        rounded -= 1;
    }
    return rounded;
};

const evenPos = (value: number) => {
    let rounded = Math.round(value);
    if (rounded % 2 !== 0) {
        rounded -= 1;
    }
    return Math.max(0, rounded);
};

/**
 * Letterbox a page into the 1920×1080 frame (same rules as Remotion
 * getContainedPageRect), then snap to even pixels for yuv420p.
 */
export const getContainedPageRect = (
    aspectRatio: number,
    frameWidth = FRAME_WIDTH,
    frameHeight = FRAME_HEIGHT
): ContainedPageRect => {
    const safeAspect = aspectRatio > 0 ? aspectRatio : DEFAULT_PAGE_ASPECT;
    const frameAspect = frameWidth / frameHeight;

    let width: number;
    let height: number;
    let x: number;
    let y: number;

    if (safeAspect > frameAspect) {
        width = frameWidth;
        height = frameWidth / safeAspect;
        x = 0;
        y = (frameHeight - height) / 2;
    } else {
        height = frameHeight;
        width = frameHeight * safeAspect;
        x = (frameWidth - width) / 2;
        y = 0;
    }

    const evenWidth = even(width, frameWidth);
    const evenHeight = even(height, frameHeight);

    return {
        x: evenPos(x),
        y: evenPos(y),
        width: evenWidth,
        height: evenHeight,
    };
};
