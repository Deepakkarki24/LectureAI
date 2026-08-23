import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HighlightedText } from "../components/HighlightedText";
import { isComparisonData, Scene } from "../types/scene";
import { extractKeywords } from "../utils/keywords";
import {
    getTeachingTiming,
    useEntranceSpring,
} from "../utils/sceneAnimations";

type ComparisonSceneProps = {
    scene: Scene;
    durationInFrames: number;
};

export const ComparisonScene = ({
    scene,
    durationInFrames,
}: ComparisonSceneProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    if (!isComparisonData(scene.data)) {
        return null;
    }

    const { left, right } = scene.data;

    const { contentStart } = getTeachingTiming(durationInFrames, fps);
    const keywords = extractKeywords(
        `${left.title} ${left.description} ${right.title} ${right.description}`
    );

    const headlineProgress = useEntranceSpring(3);
    const headlineY = interpolate(headlineProgress, [0, 1], [28, 0]);

    const leftStart = contentStart;
    const rightStart = contentStart + Math.round(fps * 0.5);
    const vsStart = contentStart + Math.round(fps * 0.35);

    const leftOpacity = interpolate(frame, [leftStart, leftStart + 16], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const rightOpacity = interpolate(frame, [rightStart, rightStart + 16], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const vsOpacity = interpolate(frame, [vsStart, vsStart + 12], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const leftX = interpolate(frame, [leftStart, leftStart + 20], [-60, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const rightX = interpolate(frame, [rightStart, rightStart + 20], [60, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const leftScale = spring({
        frame: frame - leftStart,
        fps,
        config: { damping: 16, stiffness: 100 },
    });
    const rightScale = spring({
        frame: frame - rightStart,
        fps,
        config: { damping: 16, stiffness: 100 },
    });

    const cardStyle = (
        side: "left" | "right",
        opacity: number,
        translateX: number,
        scale: number
    ) => ({
        flex: 1,
        opacity,
        transform: `translateX(${translateX}px) scale(${scale})`,
        padding: "44px 36px",
        borderRadius: 18,
        textAlign: "center" as const,
        backgroundColor:
            side === "left"
                ? "rgba(59, 130, 246, 0.12)"
                : "rgba(168, 85, 247, 0.12)",
        border: `2px solid ${side === "left" ? "#3b82f6" : "#a855f7"}`,
        boxShadow:
            side === "left"
                ? "0 8px 32px rgba(59, 130, 246, 0.15)"
                : "0 8px 32px rgba(168, 85, 247, 0.15)",
    });

    return (
        <>
            <h1
                style={{
                    opacity: headlineProgress,
                    transform: `translateY(${headlineY}px)`,
                    fontSize: 44,
                    color: "#f8fafc",
                    textAlign: "center",
                    marginBottom: 16,
                    maxWidth: 1200,
                    lineHeight: 1.3,
                }}
            >
                {left.title} vs {right.title}
            </h1>

            <p
                style={{
                    opacity: headlineProgress * 0.8,
                    fontSize: 22,
                    color: "#94a3b8",
                    marginBottom: 36,
                    textAlign: "center",
                }}
            >
                Understanding the constitutional difference
            </p>

            <div
                style={{
                    display: "flex",
                    gap: 40,
                    width: "100%",
                    maxWidth: 1400,
                    alignItems: "stretch",
                }}
            >
                <div style={cardStyle("left", leftOpacity, leftX, leftScale)}>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "#3b82f6",
                            marginBottom: 16,
                            textTransform: "uppercase",
                        }}
                    >
                        Role A
                    </div>
                    <h2
                        style={{
                            fontSize: 40,
                            color: "#3b82f6",
                            marginBottom: 20,
                        }}
                    >
                        <HighlightedText
                            text={left.title}
                            keywords={keywords}
                            highlightOpacity={1}
                        />
                    </h2>
                    <p
                        style={{
                            fontSize: 26,
                            color: "#e2e8f0",
                            whiteSpace: "pre-line",
                            lineHeight: 1.65,
                        }}
                    >
                        <HighlightedText
                            text={left.description}
                            keywords={keywords}
                            highlightOpacity={0.9}
                        />
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        opacity: vsOpacity,
                        fontSize: 32,
                        color: "#64748b",
                        fontWeight: 800,
                        flexShrink: 0,
                    }}
                >
                    VS
                </div>

                <div style={cardStyle("right", rightOpacity, rightX, rightScale)}>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "#a855f7",
                            marginBottom: 16,
                            textTransform: "uppercase",
                        }}
                    >
                        Role B
                    </div>
                    <h2
                        style={{
                            fontSize: 40,
                            color: "#a855f7",
                            marginBottom: 20,
                        }}
                    >
                        <HighlightedText
                            text={right.title}
                            keywords={keywords}
                            highlightOpacity={1}
                        />
                    </h2>
                    <p
                        style={{
                            fontSize: 26,
                            color: "#e2e8f0",
                            whiteSpace: "pre-line",
                            lineHeight: 1.65,
                        }}
                    >
                        <HighlightedText
                            text={right.description}
                            keywords={keywords}
                            highlightOpacity={0.9}
                        />
                    </p>
                </div>
            </div>
        </>
    );
};
