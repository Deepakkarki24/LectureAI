import {
    AbsoluteFill,
    Easing,
    Img,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import type { PdfAnimationScene } from "../types/pdfAnimationScene";
import {
    FULL_PAGE_REGION,
    getContainedPageRect,
    interpolateCamera,
    regionToCameraTransform,
    type CameraTransform,
} from "../utils/pdfCamera";

type PdfPageCameraProps = {
    scene: PdfAnimationScene;
    pageImageUrl: string;
    aspectRatio: number;
    durationInFrames: number;
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export const PdfPageCamera = ({
    scene,
    pageImageUrl,
    aspectRatio,
    durationInFrames,
}: PdfPageCameraProps) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const pageRect = getContainedPageRect(aspectRatio, width, height);
    const extraZoom = scene.camera?.zoom ?? 1;

    const full = regionToCameraTransform(FULL_PAGE_REGION, pageRect, 1);
    const focusTransform = scene.focus
        ? regionToCameraTransform(scene.focus, pageRect, extraZoom)
        : full;
    const fromTransform = scene.camera?.from
        ? regionToCameraTransform(scene.camera.from, pageRect, extraZoom)
        : full;
    const toTransform = scene.camera?.to
        ? regionToCameraTransform(scene.camera.to, pageRect, extraZoom)
        : full;

    const introFrames = Math.max(
        1,
        Math.min(Math.round(fps * 0.55), Math.floor(durationInFrames * 0.4))
    );
    const outroFrames = Math.max(
        1,
        Math.min(Math.round(fps * 0.4), Math.floor(durationInFrames * 0.25))
    );

    const introProgress = interpolate(frame, [0, introFrames], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const fullProgress = interpolate(frame, [0, durationInFrames], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    let camera: CameraTransform = full;
    let highlightOpacity = 0;

    switch (scene.animation) {
        case "zoom_in":
            camera = interpolateCamera(full, focusTransform, introProgress);
            highlightOpacity = introProgress * 0.45;
            break;
        case "zoom_out":
            camera = interpolateCamera(
                scene.focus ? focusTransform : fromTransform,
                full,
                introProgress
            );
            break;
        case "pan":
        case "focus":
            camera = interpolateCamera(fromTransform, toTransform, fullProgress);
            highlightOpacity = 0.35;
            break;
        case "highlight":
            camera = full;
            highlightOpacity = introProgress;
            break;
        case "fade":
        case "none":
        default:
            camera = full;
            break;
    }

    const fadeIn = interpolate(frame, [0, introFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const fadeOut = interpolate(
        frame,
        [durationInFrames - outroFrames, durationInFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const useFade =
        scene.animation === "fade" || scene.transition === "fade";
    const opacity = useFade ? Math.min(fadeIn, fadeOut) : 1;

    const highlightRegion =
        scene.focus ?? scene.camera?.to ?? scene.camera?.from;

    return (
        <AbsoluteFill style={{ backgroundColor: "#0f172a", opacity }}>
            <div
                style={{
                    position: "absolute",
                    left: pageRect.x,
                    top: pageRect.y,
                    width: pageRect.width,
                    height: pageRect.height,
                    overflow: "hidden",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        transformOrigin: "0 0",
                        transform: `translate(${camera.translateX}px, ${camera.translateY}px) scale(${camera.scale})`,
                    }}
                >
                    <Img
                        src={pageImageUrl}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "fill",
                        }}
                    />
                    {highlightRegion && highlightOpacity > 0 ? (
                        <div
                            style={{
                                position: "absolute",
                                left: `${clamp01(highlightRegion.x) * 100}%`,
                                top: `${clamp01(highlightRegion.y) * 100}%`,
                                width: `${clamp01(highlightRegion.width) * 100}%`,
                                height: `${clamp01(highlightRegion.height) * 100}%`,
                                border: "4px solid rgba(250, 204, 21, 0.95)",
                                backgroundColor: `rgba(250, 204, 21, ${0.12 * highlightOpacity})`,
                                boxShadow: `0 0 0 9999px rgba(15, 23, 42, ${0.28 * highlightOpacity})`,
                                pointerEvents: "none",
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </AbsoluteFill>
    );
};
