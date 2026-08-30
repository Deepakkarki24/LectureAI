import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import type { NormalizedRegion, PdfAnimationScene } from "../types/pdfAnimationScene";

type PdfPageCameraProps = {
    scene: PdfAnimationScene;
    pageImageUrl: string;
    fps: number;
    pageWidthPx: number;
    pageHeightPx: number;
    previousZoomScale?: number;
    previousFocus?: NormalizedRegion;
};

const ZOOM_FRAMES = 10;
const HIGHLIGHT_FADE_FRAMES = 8;
const FADE_FRAMES = 8;

const focusOrigin = (focus: NormalizedRegion) => ({
    x: `${(focus.x + focus.width / 2) * 100}%`,
    y: `${(focus.y + focus.height / 2) * 100}%`,
});

export const PdfPageCamera = ({
    scene,
    pageImageUrl,
    fps,
    pageWidthPx,
    pageHeightPx,
    previousZoomScale = 1,
    previousFocus,
}: PdfPageCameraProps) => {
    const frame = useCurrentFrame();
    const durationInFrames = Math.max(
        Math.round(scene.end * fps) - Math.round(scene.start * fps),
        1
    );

    const focus = scene.focus;
    const animation =
        (scene.animation === "zoom_in" || scene.animation === "highlight") &&
        !focus
            ? "none"
            : scene.animation;

    let scale = 1;
    let transformOrigin = "50% 50%";
    let translateX = 0;
    let translateY = 0;
    let highlightOpacity = 0;
    let containerOpacity = 1;

    if (animation === "zoom_in" && focus) {
        const origin = focusOrigin(focus);
        transformOrigin = `${origin.x} ${origin.y}`;
        scale = interpolate(frame, [0, ZOOM_FRAMES], [1, 2], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });
    } else if (animation === "zoom_out") {
        const originFocus = previousFocus ?? focus;
        if (originFocus) {
            const origin = focusOrigin(originFocus);
            transformOrigin = `${origin.x} ${origin.y}`;
        }
        scale = interpolate(
            frame,
            [0, ZOOM_FRAMES],
            [previousZoomScale, 1],
            {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );
    } else if (animation === "highlight" && focus) {
        highlightOpacity = interpolate(
            frame,
            [0, HIGHLIGHT_FADE_FRAMES],
            [0, 1],
            {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );
    } else if (animation === "fade") {
        containerOpacity = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });
    } else if (
        (animation === "pan" || animation === "focus") &&
        scene.camera?.from &&
        scene.camera?.to
    ) {
        const from = scene.camera.from;
        const to = scene.camera.to;
        const fromX = (from.x + from.width / 2) * pageWidthPx;
        const fromY = (from.y + from.height / 2) * pageHeightPx;
        const toX = (to.x + to.width / 2) * pageWidthPx;
        const toY = (to.y + to.height / 2) * pageHeightPx;

        translateX = interpolate(
            frame,
            [0, durationInFrames],
            [pageWidthPx / 2 - fromX, pageWidthPx / 2 - toX],
            {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );
        translateY = interpolate(
            frame,
            [0, durationInFrames],
            [pageHeightPx / 2 - fromY, pageHeightPx / 2 - toY],
            {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );
    }

    const usesTransform = animation === "zoom_in" || animation === "zoom_out";
    const usesPan = animation === "pan" || animation === "focus";

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#0f172a",
                opacity: containerOpacity,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: pageWidthPx,
                    height: pageHeightPx,
                    overflow: "hidden",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
                }}
            >
                <Img
                    src={pageImageUrl}
                    style={{
                        position: "relative",
                        display: "block",
                        width: pageWidthPx,
                        height: pageHeightPx,
                        objectFit: "fill",
                        transformOrigin: usesTransform
                            ? transformOrigin
                            : "50% 50%",
                        transform: usesPan
                            ? `translate(${translateX}px, ${translateY}px)`
                            : usesTransform
                              ? `scale(${scale})`
                              : undefined,
                    }}
                />
                {animation === "highlight" && focus ? (
                    <div
                        style={{
                            position: "absolute",
                            left: focus.x * pageWidthPx,
                            top: focus.y * pageHeightPx,
                            width: focus.width * pageWidthPx,
                            height: focus.height * pageHeightPx,
                            border: "3px solid #FACC15",
                            background: "rgba(250, 204, 21, 0.15)",
                            borderRadius: 4,
                            pointerEvents: "none",
                            opacity: highlightOpacity,
                        }}
                    />
                ) : null}
            </div>
        </AbsoluteFill>
    );
};
