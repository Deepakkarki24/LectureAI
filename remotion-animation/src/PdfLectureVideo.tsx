import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { PdfPageCamera } from "./scenes/PdfPageCamera";
import type { PdfAnimationScene } from "./types/pdfAnimationScene";

export type PdfLectureVideoProps = {
    audioUrl: string;
    pageImageUrls: string[];
    scenes: PdfAnimationScene[];
    pageAspectRatios?: number[];
};

export const PdfLectureVideo = ({
    audioUrl,
    pageImageUrls,
    scenes,
    pageAspectRatios,
}: PdfLectureVideoProps) => {
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
            {scenes.map((scene, index) => {
                const pageUrl = pageImageUrls[scene.page - 1];
                const startFrame = Math.round(scene.start * fps);
                const durationInFrames = Math.max(
                    Math.round((scene.end - scene.start) * fps),
                    1
                );
                const aspectRatio =
                    pageAspectRatios?.[scene.page - 1] ?? 8.5 / 11;

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
                            aspectRatio={aspectRatio}
                            durationInFrames={durationInFrames}
                        />
                    </Sequence>
                );
            })}
            {audioUrl ? <Audio src={audioUrl} /> : null}
        </AbsoluteFill>
    );
};
