import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import { HighlightedText } from "../components/HighlightedText";
import { parseSceneContent, Scene } from "../utils/parseSceneContent";

type SceneSlideProps = {
    scene: Scene;
    sceneIndex: number;
    totalScenes: number;
    durationInFrames: number;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

export const SceneSlide = ({
    scene,
    sceneIndex,
    totalScenes,
    durationInFrames,
}: SceneSlideProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const content = parseSceneContent(scene);

    const fadeInEnd = Math.round(fps * 0.4);
    const fadeOutStart = durationInFrames - Math.round(fps * 0.4);

    const sceneOpacity = interpolate(
        frame,
        [0, fadeInEnd, fadeOutStart, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const headlineProgress = spring({
        frame: frame - 3,
        fps,
        config: { damping: 18, stiffness: 120 },
    });

    const headlineY = interpolate(headlineProgress, [0, 1], [30, 0]);

    const contentStart = Math.round(fps * 0.6);
    const contentEnd = durationInFrames - Math.round(fps * 0.8);
    const contentDuration = Math.max(contentEnd - contentStart, 1);

    const allLines = content.lines;
    const lineCount = Math.max(allLines.length, 1);
    const lineDuration = contentDuration / lineCount;

    const progress = clamp(frame / durationInFrames, 0, 1);

    const renderLine = (line: string, index: number) => {
        const lineStart = contentStart + index * lineDuration;
        const lineEnd = lineStart + lineDuration;

        const lineOpacity = interpolate(
            frame,
            [lineStart, lineStart + 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const lineX = interpolate(
            frame,
            [lineStart, lineStart + 15],
            [40, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const isActive =
            frame >= lineStart && frame < lineEnd + Math.round(fps * 0.3);

        const highlightOpacity = isActive
            ? interpolate(
                  frame,
                  [lineStart + 5, lineStart + 20],
                  [0.3, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )
            : 0.5;

        return (
            <div
                key={index}
                style={{
                    opacity: lineOpacity,
                    transform: `translateX(${lineX}px)`,
                    marginBottom: 16,
                    padding: "14px 20px",
                    borderRadius: 10,
                    backgroundColor: isActive
                        ? "rgba(59, 130, 246, 0.12)"
                        : "rgba(255, 255, 255, 0.04)",
                    borderLeft: isActive
                        ? "4px solid #3b82f6"
                        : "4px solid transparent",
                    transition: "background-color 0.2s",
                }}
            >
                {content.layout === "list" && (
                    <span
                        style={{
                            color: "#3b82f6",
                            fontWeight: 700,
                            marginRight: 10,
                        }}
                    >
                        {index + 1}.
                    </span>
                )}
                <span
                    style={{
                        fontSize: 28,
                        lineHeight: 1.5,
                        color: "#e2e8f0",
                    }}
                >
                    <HighlightedText
                        text={line}
                        keywords={content.keywords}
                        highlightOpacity={highlightOpacity}
                    />
                </span>
            </div>
        );
    };

    const renderComparison = () => {
        if (!content.comparison) {
            return null;
        }

        const leftStart = contentStart;
        const rightStart = contentStart + Math.round(lineDuration * 0.6);

        const leftOpacity = interpolate(
            frame,
            [leftStart, leftStart + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const rightOpacity = interpolate(
            frame,
            [rightStart, rightStart + 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

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

        const cardStyle = (side: "left" | "right") => ({
            flex: 1,
            opacity: side === "left" ? leftOpacity : rightOpacity,
            transform: `scale(${side === "left" ? leftScale : rightScale})`,
            padding: 40,
            borderRadius: 16,
            textAlign: "center" as const,
            backgroundColor:
                side === "left"
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(168, 85, 247, 0.15)",
            border: `2px solid ${side === "left" ? "#3b82f6" : "#a855f7"}`,
        });

        return (
            <div
                style={{
                    display: "flex",
                    gap: 50,
                    marginTop: 40,
                    width: "100%",
                    maxWidth: 1400,
                }}
            >
                <div style={cardStyle("left")}>
                    <h2
                        style={{
                            fontSize: 42,
                            color: "#3b82f6",
                            marginBottom: 20,
                        }}
                    >
                        {content.comparison.leftTitle}
                    </h2>
                    <p
                        style={{
                            fontSize: 26,
                            color: "#e2e8f0",
                            whiteSpace: "pre-line",
                            lineHeight: 1.6,
                        }}
                    >
                        {content.comparison.leftBody}
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: 36,
                        color: "#64748b",
                        fontWeight: 700,
                    }}
                >
                    VS
                </div>

                <div style={cardStyle("right")}>
                    <h2
                        style={{
                            fontSize: 42,
                            color: "#a855f7",
                            marginBottom: 20,
                        }}
                    >
                        {content.comparison.rightTitle}
                    </h2>
                    <p
                        style={{
                            fontSize: 26,
                            color: "#e2e8f0",
                            whiteSpace: "pre-line",
                            lineHeight: 1.6,
                        }}
                    >
                        {content.comparison.rightBody}
                    </p>
                </div>
            </div>
        );
    };

    const renderQuote = () => {
        if (!content.quote) {
            return null;
        }

        const quoteStart = contentStart + lineDuration;
        const quoteOpacity = interpolate(
            frame,
            [quoteStart, quoteStart + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const quoteScale = spring({
            frame: frame - quoteStart,
            fps,
            config: { damping: 14, stiffness: 80 },
        });

        return (
            <div
                style={{
                    opacity: quoteOpacity,
                    transform: `scale(${quoteScale})`,
                    marginTop: 40,
                    padding: "30px 50px",
                    borderLeft: "6px solid #fbbf24",
                    backgroundColor: "rgba(251, 191, 36, 0.08)",
                    borderRadius: 12,
                    maxWidth: 1200,
                }}
            >
                <p
                    style={{
                        fontSize: 32,
                        fontStyle: "italic",
                        color: "#fbbf24",
                        lineHeight: 1.6,
                    }}
                >
                    "{content.quote}"
                </p>
            </div>
        );
    };

    return (
        <AbsoluteFill
            style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                opacity: sceneOpacity,
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
                    backgroundColor: "#3b82f6",
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
                <h1
                    style={{
                        opacity: headlineProgress,
                        transform: `translateY(${headlineY}px)`,
                        fontSize: 48,
                        color: "#f8fafc",
                        textAlign: "center",
                        marginBottom: 30,
                        maxWidth: 1400,
                        lineHeight: 1.3,
                    }}
                >
                    <HighlightedText
                        text={content.headline}
                        keywords={content.keywords}
                        highlightOpacity={1}
                    />
                </h1>

                {content.layout === "comparison" && (
                    <>
                        {renderComparison()}
                        {allLines.length > 0 && (
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: 1200,
                                    marginTop: 30,
                                }}
                            >
                                {allLines.map(renderLine)}
                            </div>
                        )}
                    </>
                )}

                {content.layout === "quote" && (
                    <>
                        <div style={{ width: "100%", maxWidth: 1200 }}>
                            {allLines.map(renderLine)}
                        </div>
                        {renderQuote()}
                    </>
                )}

                {content.layout !== "comparison" &&
                    content.layout !== "quote" && (
                        <div style={{ width: "100%", maxWidth: 1200 }}>
                            {allLines.map(renderLine)}
                        </div>
                    )}
            </div>
        </AbsoluteFill>
    );
};
