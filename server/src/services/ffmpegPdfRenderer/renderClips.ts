import fs from "node:fs/promises";
import path from "node:path";
import type { NormalizedRegion } from "@/validators/pdfAnimationScene.schema.js";
import {
    BACKGROUND_COLOR,
    FADE_FRAMES,
    FPS,
    FRAME_HEIGHT,
    FRAME_WIDTH,
    HIGHLIGHT_BORDER_PX,
    HIGHLIGHT_FADE_FRAMES,
    HIGHLIGHT_FILL,
    HIGHLIGHT_STROKE,
    ZOOM_FRAMES,
    ZOOM_IN_SCALE,
} from "./constants.js";
import type { DownloadedPage } from "./downloadAssets.js";
import type { ContainedPageRect } from "./pageLayout.js";
import { runFfmpeg } from "./runFfmpeg.js";
import type { TimelineScene } from "./sceneTimeline.js";

const fadeSeconds = (frames: number, durationInFrames: number) =>
    Math.min(frames, durationInFrames) / FPS;

const focusOriginPx = (focus: NormalizedRegion, page: ContainedPageRect) => ({
    x: (focus.x + focus.width / 2) * page.width,
    y: (focus.y + focus.height / 2) * page.height,
});

const evenMin2 = (value: number) => {
    let rounded = Math.max(2, Math.round(value));
    if (rounded % 2 !== 0) {
        rounded += 1;
    }
    return rounded;
};

const buildZoomPan = (
    page: ContainedPageRect,
    frames: number,
    zExpr: string,
    originX: number,
    originY: number
) =>
    `[0:v]scale=${page.width}:${page.height},setsar=1,format=yuv420p,` +
    `zoompan=z='${zExpr}':x='${originX}*(1-1/zoom)':y='${originY}*(1-1/zoom)':` +
    `d=${frames}:s=${page.width}x${page.height}:fps=${FPS}[p];` +
    `[1:v][p]overlay=${page.x}:${page.y},format=yuv420p[v]`;

const scaledPage = (page: ContainedPageRect) =>
    `[0:v]scale=${page.width}:${page.height},setsar=1,format=yuv420p[p]`;

const overlayOnCanvas = (page: ContainedPageRect, src = "[p]") =>
    `[1:v]${src}overlay=${page.x}:${page.y},format=yuv420p[v]`;

const buildFilter = (
    item: TimelineScene,
    page: ContainedPageRect
): string => {
    const { animation, scene, durationInFrames, previousZoomScale, previousFocus } =
        item;
    const fadeIn = fadeSeconds(FADE_FRAMES, durationInFrames);
    const highlightFade = fadeSeconds(HIGHLIGHT_FADE_FRAMES, durationInFrames);
    const durationSec = (durationInFrames / FPS).toFixed(4);

    if (animation === "zoom_in" && scene.focus) {
        const origin = focusOriginPx(scene.focus, page);
        const zExpr = `if(lte(on,${ZOOM_FRAMES}),1+on/${ZOOM_FRAMES},${ZOOM_IN_SCALE})`;
        return buildZoomPan(page, durationInFrames, zExpr, origin.x, origin.y);
    }

    if (animation === "zoom_out") {
        const originFocus = previousFocus ?? scene.focus;
        const origin = originFocus
            ? focusOriginPx(originFocus, page)
            : { x: page.width / 2, y: page.height / 2 };
        const zExpr = `${previousZoomScale}-(${previousZoomScale}-1)*min(on,${ZOOM_FRAMES})/${ZOOM_FRAMES}`;
        return buildZoomPan(page, durationInFrames, zExpr, origin.x, origin.y);
    }

    if (animation === "highlight" && scene.focus) {
        const border = HIGHLIGHT_BORDER_PX;
        let bw = evenMin2(scene.focus.width * page.width);
        let bh = evenMin2(scene.focus.height * page.height);
        let bx = Math.round(scene.focus.x * page.width);
        let by = Math.round(scene.focus.y * page.height);

        bx = Math.max(0, Math.min(bx, Math.max(page.width - 2, 0)));
        by = Math.max(0, Math.min(by, Math.max(page.height - 2, 0)));
        bw = Math.min(bw, page.width - bx);
        bh = Math.min(bh, page.height - by);
        if (bw % 2) {
            bw -= 1;
        }
        if (bh % 2) {
            bh -= 1;
        }
        bw = Math.max(bw, 2);
        bh = Math.max(bh, 2);

        const fillW = Math.max(2, bw - border * 2);
        const fillH = Math.max(2, bh - border * 2);
        const ox = Math.min(border, Math.max(0, bw - fillW));
        const oy = Math.min(border, Math.max(0, bh - fillH));

        return (
            `${scaledPage(page)};` +
            `color=c=black@0:s=${fillW}x${fillH}:r=${FPS}:d=${durationSec},format=rgba,` +
            `pad=${bw}:${bh}:${ox}:${oy}:color=${HIGHLIGHT_STROKE}[border];` +
            `color=c=${HIGHLIGHT_FILL}:s=${fillW}x${fillH}:r=${FPS}:d=${durationSec},format=rgba,` +
            `fade=t=in:st=0:d=${highlightFade}:alpha=1[fill];` +
            `[border][fill]overlay=${ox}:${oy}:format=auto[box];` +
            `[p][box]overlay=${bx}:${by}:format=auto[ph];` +
            overlayOnCanvas(page, "[ph]")
        );
    }

    if (animation === "fade") {
        return (
            `${scaledPage(page)};[p]fade=t=in:st=0:d=${fadeIn}:c=${BACKGROUND_COLOR}[pf];` +
            overlayOnCanvas(page, "[pf]")
        );
    }

    if (
        (animation === "pan" || animation === "focus") &&
        scene.camera?.from &&
        scene.camera.to
    ) {
        const from = scene.camera.from;
        const to = scene.camera.to;
        if (!from || !to) {
            return `${scaledPage(page)};${overlayOnCanvas(page)}`;
        }
        const fromX = (from.x + from.width / 2) * page.width;
        const fromY = (from.y + from.height / 2) * page.height;
        const toX = (to.x + to.width / 2) * page.width;
        const toY = (to.y + to.height / 2) * page.height;
        const x0 = page.width / 2 - fromX;
        const y0 = page.height / 2 - fromY;
        const x1 = page.width / 2 - toX;
        const y1 = page.height / 2 - toY;
        const df = durationInFrames;

        return (
            `${scaledPage(page)};` +
            `color=c=${BACKGROUND_COLOR}:s=${page.width}x${page.height}:r=${FPS}:d=${durationSec}[vp];` +
            `[vp][p]overlay=x='${x0}+(${x1}-${x0})*n/${df}':y='${y0}+(${y1}-${y0})*n/${df}'[view];` +
            overlayOnCanvas(page, "[view]")
        );
    }

    return `${scaledPage(page)};${overlayOnCanvas(page)}`;
};

export const renderSlateClip = async (
    outputPath: string,
    durationInFrames: number
): Promise<void> => {
    await runFfmpeg([
        "-f",
        "lavfi",
        "-i",
        `color=c=${BACKGROUND_COLOR}:s=${FRAME_WIDTH}x${FRAME_HEIGHT}:r=${FPS}`,
        "-frames:v",
        String(durationInFrames),
        "-r",
        String(FPS),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-an",
        outputPath,
    ]);
};

export const renderSceneClip = async (
    item: TimelineScene,
    pageImage: DownloadedPage,
    page: ContainedPageRect,
    outputPath: string
): Promise<void> => {
    const filter = buildFilter(item, page);
    const usesZoom =
        item.animation === "zoom_in" || item.animation === "zoom_out";
    const pageInput = usesZoom
        ? ["-i", pageImage.filePath]
        : ["-loop", "1", "-i", pageImage.filePath];

    await runFfmpeg([
        ...pageInput,
        "-f",
        "lavfi",
        "-i",
        `color=c=${BACKGROUND_COLOR}:s=${FRAME_WIDTH}x${FRAME_HEIGHT}:r=${FPS}`,
        "-filter_complex",
        filter,
        "-map",
        "[v]",
        "-frames:v",
        String(item.durationInFrames),
        "-r",
        String(FPS),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-an",
        outputPath,
    ]);
};

export const concatClipsWithAudio = async (
    clipPaths: string[],
    audioPath: string,
    outputPath: string,
    workDir: string,
    durationSeconds: number
): Promise<void> => {
    const listPath = path.join(workDir, "concat.txt");
    const lines = clipPaths
        .map((clip) => {
            const posix = clip.replaceAll("\\", "/").replaceAll("'", "'\\''");
            return `file '${posix}'`;
        })
        .join("\n");

    await fs.writeFile(listPath, lines, "utf8");

    await runFfmpeg([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
        "-i",
        audioPath,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-af",
        "apad,aresample=async=1",
        "-t",
        durationSeconds.toFixed(4),
        "-movflags",
        "+faststart",
        outputPath,
    ]);
};
