import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { PdfPageCamera } from "./scenes/PdfPageCamera";
import type {
    NormalizedRegion,
    PdfAnimationScene,
} from "./types/pdfAnimationScene";
import { getContainedPageRect } from "./utils/pdfCamera";

export type PdfLectureVideoProps = {
    audioUrl: string;
    pageImageUrls: string[];
    scenes: PdfAnimationScene[];
    pageAspectRatios?: number[];
};

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

export const PdfLectureVideo = ({
    audioUrl,
    pageImageUrls,
    scenes,
    pageAspectRatios,
}: PdfLectureVideoProps) => {
    const { fps, width, height } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
            {scenes.map((scene, index) => {
                const pageUrl = pageImageUrls[scene.page - 1];
                const startFrame = Math.round(scene.start * fps);
                const endFrame = Math.round(scene.end * fps);
                const durationInFrames = Math.max(endFrame - startFrame, 1);
                const aspectRatio =
                    pageAspectRatios?.[scene.page - 1] ?? 8.5 / 11;
                const pageRect = getContainedPageRect(
                    aspectRatio,
                    width,
                    height
                );
                const previousZoom = lastZoomState(scenes, index);

                if (!pageUrl) {
                    return (
                        <Sequence
                            key={scene.id ?? `pdf-scene-${index}`}
                            from={startFrame}
                            durationInFrames={durationInFrames}
                        >
                            <AbsoluteFill
                                style={{
                                    backgroundColor: "#0f172a",
                                    color: "#ef4444",
                                    fontSize: 32,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    display: "flex",
                                }}
                            >
                                Missing PDF page image for page {scene.page}
                            </AbsoluteFill>
                        </Sequence>
                    );
                }

                return (
                    <Sequence
                        key={scene.id ?? `pdf-scene-${index}`}
                        from={startFrame}
                        durationInFrames={durationInFrames}
                    >
                        <PdfPageCamera
                            scene={scene}
                            pageImageUrl={pageUrl}
                            fps={fps}
                            pageWidthPx={pageRect.width}
                            pageHeightPx={pageRect.height}
                            previousZoomScale={previousZoom.scale}
                            previousFocus={previousZoom.focus}
                        />
                    </Sequence>
                );
            })}
            {audioUrl ? <Audio src={audioUrl} /> : null}
        </AbsoluteFill>
    );
};
