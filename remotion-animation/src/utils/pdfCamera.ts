import type { NormalizedRegion } from "../types/pdfAnimationScene";

export const FULL_PAGE_REGION: NormalizedRegion = {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
};

export type ContainedPageRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type CameraTransform = {
    scale: number;
    translateX: number;
    translateY: number;
};

export const getContainedPageRect = (
    aspectRatio: number,
    frameWidth: number,
    frameHeight: number
): ContainedPageRect => {
    const safeAspect = aspectRatio > 0 ? aspectRatio : 8.5 / 11;
    const frameAspect = frameWidth / frameHeight;

    if (safeAspect > frameAspect) {
        const width = frameWidth;
        const height = frameWidth / safeAspect;
        return {
            x: 0,
            y: (frameHeight - height) / 2,
            width,
            height,
        };
    }

    const height = frameHeight;
    const width = frameHeight * safeAspect;
    return {
        x: (frameWidth - width) / 2,
        y: 0,
        width,
        height,
    };
};

export const regionToCameraTransform = (
    region: NormalizedRegion,
    page: ContainedPageRect,
    extraZoom = 1
): CameraTransform => {
    const width = Math.max(region.width, 0.04);
    const height = Math.max(region.height, 0.04);
    const fitScale = Math.min(1 / width, 1 / height);
    const scale = Math.min(Math.max(fitScale * extraZoom, 1), 8);

    const centerX = (region.x + region.width / 2) * page.width;
    const centerY = (region.y + region.height / 2) * page.height;

    return {
        scale,
        translateX: page.width / 2 - centerX * scale,
        translateY: page.height / 2 - centerY * scale,
    };
};

export const interpolateCamera = (
    from: CameraTransform,
    to: CameraTransform,
    progress: number
): CameraTransform => {
    const t = Math.min(Math.max(progress, 0), 1);
    return {
        scale: from.scale + (to.scale - from.scale) * t,
        translateX: from.translateX + (to.translateX - from.translateX) * t,
        translateY: from.translateY + (to.translateY - from.translateY) * t,
    };
};
