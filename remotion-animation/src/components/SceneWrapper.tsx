import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ReactNode } from "react";
import { SceneAnimation } from "../types/scene";
import { clamp, useSceneOpacity } from "../utils/sceneAnimations";

type SceneWrapperProps = {
    sceneIndex: number;
    totalScenes: number;
    durationInFrames: number;
    animation: SceneAnimation;
    children: ReactNode;
};

export const SceneWrapper = ({
    sceneIndex,
    totalScenes,
    durationInFrames,
    animation,
    children,
}: SceneWrapperProps) => {
    const frame = useCurrentFrame();
    const sceneOpacity = useSceneOpacity(durationInFrames, animation);
    const progress = clamp(frame / durationInFrames, 0, 1);

    const slideY = interpolate(frame, [0, 12], [animation.entrance === "slide" ? 24 : 0, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%)",
                opacity: sceneOpacity,
                transform: `translateY(${slideY}px)`,
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 4,
                    width: `${progress * 100}%`,
                    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    boxShadow: "0 0 12px rgba(59, 130, 246, 0.6)",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    top: 30,
                    right: 50,
                    fontSize: 18,
                    color: "#64748b",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                }}
            >
                Section {sceneIndex + 1} / {totalScenes}
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    padding: "80px 100px",
                }}
            >
                {children}
            </div>
        </AbsoluteFill>
    );
};
