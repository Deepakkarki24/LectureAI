import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HighlightedText } from "../components/HighlightedText";
import { isQuestionData, Scene } from "../types/scene";
import { extractKeywords } from "../utils/keywords";
import { useEntranceSpring } from "../utils/sceneAnimations";

type QuestionSceneProps = {
    scene: Scene;
    durationInFrames: number;
};

export const QuestionScene = ({ scene }: QuestionSceneProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    if (!isQuestionData(scene.data)) {
        return null;
    }

    const data = scene.data;
    const keywords = extractKeywords(data.question);
    const titleProgress = useEntranceSpring(4, 110);
    const titleScale = interpolate(titleProgress, [0, 1], [0.88, 1]);
    const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

    const accentStart = Math.round(fps * 0.55);
    const accentWidth = interpolate(
        frame,
        [accentStart + 8, accentStart + 30],
        [0, 100],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
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
                    backgroundColor: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    color: "#c084fc",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 28,
                }}
            >
                Question
            </div>

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

            <h1
                style={{
                    fontSize: 52,
                    color: "#f8fafc",
                    lineHeight: 1.35,
                    marginBottom: 0,
                }}
            >
                <HighlightedText
                    text={data.question}
                    keywords={keywords}
                    highlightOpacity={1}
                />
            </h1>
        </div>
    );
};
