import { useCurrentFrame, useVideoConfig } from "remotion";
import { HighlightedText } from "../components/HighlightedText";
import {
    useActiveHighlight,
    useStaggerReveal,
} from "../utils/sceneAnimations";

type BulletPointItemProps = {
    point: string;
    index: number;
    keywords: string[];
    contentStart: number;
    staggerFrames: number;
    pointDuration: number;
};

const BulletPointItem = ({
    point,
    index,
    keywords,
    contentStart,
    staggerFrames,
    pointDuration,
}: BulletPointItemProps) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const { opacity, translateX, start } = useStaggerReveal(
        index,
        contentStart,
        staggerFrames
    );

    const lineEnd = start + pointDuration;
    const { isActive, highlightOpacity } = useActiveHighlight(
        frame,
        start,
        lineEnd,
        fps
    );

    return (
        <div
            style={{
                opacity,
                transform: `translateX(${translateX}px)`,
                marginBottom: 18,
                padding: "16px 22px",
                borderRadius: 12,
                backgroundColor: isActive
                    ? "rgba(59, 130, 246, 0.14)"
                    : "rgba(255, 255, 255, 0.04)",
                borderLeft: isActive
                    ? "4px solid #3b82f6"
                    : "4px solid rgba(148, 163, 184, 0.3)",
                boxShadow: isActive
                    ? "0 4px 20px rgba(59, 130, 246, 0.12)"
                    : "none",
            }}
        >
            <span
                style={{
                    color: "#3b82f6",
                    fontWeight: 700,
                    fontSize: 26,
                    marginRight: 14,
                }}
            >
                {index + 1}.
            </span>
            <span
                style={{
                    fontSize: 28,
                    lineHeight: 1.55,
                    color: "#e2e8f0",
                }}
            >
                <HighlightedText
                    text={point}
                    keywords={keywords}
                    highlightOpacity={highlightOpacity}
                />
            </span>
        </div>
    );
};

export { BulletPointItem };
