import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HighlightedText } from "../components/HighlightedText";
import { ConceptSceneData, Scene } from "../types/scene";
import { extractKeywords } from "../utils/keywords";
import {
    getTeachingTiming,
    useEntranceSpring,
} from "../utils/sceneAnimations";

type ConceptSceneProps = {
    scene: Scene;
    durationInFrames: number;
};

export const ConceptScene = ({ scene, durationInFrames }: ConceptSceneProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const data = scene.data as ConceptSceneData;
    const { contentStart } = getTeachingTiming(durationInFrames, fps);

    const keywords = extractKeywords(`${data.title} ${data.subtitle}`);

    const titleProgress = useEntranceSpring(4, 110);
    const titleScale = interpolate(titleProgress, [0, 1], [0.88, 1]);
    const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

    const subtitleStart = contentStart;
    const subtitleOpacity = interpolate(
        frame,
        [subtitleStart, subtitleStart + 18],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const subtitleY = interpolate(
        frame,
        [subtitleStart, subtitleStart + 22],
        [24, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const accentWidth = interpolate(
        frame,
        [subtitleStart + 8, subtitleStart + 30],
        [0, 100],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
        <>
            <div
                style={{
                    opacity: titleProgress,
                    transform: `translateY(${titleY}px) scale(${titleScale})`,
                    textAlign: "center",
                    maxWidth: 1200,
                }}
            >
                <div
                    style={{
                        display: "inline-block",
                        padding: "8px 20px",
                        borderRadius: 999,
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                        color: "#60a5fa",
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: 28,
                    }}
                >
                    Key Concept
                </div>

                <h1
                    style={{
                        fontSize: 52,
                        color: "#f8fafc",
                        lineHeight: 1.25,
                        marginBottom: 0,
                    }}
                >
                    <HighlightedText
                        text={data.title}
                        keywords={keywords}
                        highlightOpacity={1}
                    />
                </h1>
            </div>

            <div
                style={{
                    marginTop: 48,
                    opacity: subtitleOpacity,
                    transform: `translateY(${subtitleY}px)`,
                    textAlign: "center",
                    maxWidth: 900,
                }}
            >
                <div
                    style={{
                        height: 3,
                        width: `${accentWidth}%`,
                        maxWidth: 120,
                        margin: "0 auto 28px",
                        background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                        borderRadius: 2,
                    }}
                />

                <p
                    style={{
                        fontSize: 30,
                        color: "#cbd5e1",
                        lineHeight: 1.6,
                    }}
                >
                    <HighlightedText
                        text={data.subtitle}
                        keywords={keywords}
                        highlightOpacity={0.95}
                    />
                </p>
            </div>
        </>
    );
};
