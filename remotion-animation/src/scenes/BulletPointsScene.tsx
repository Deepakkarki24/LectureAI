import { useVideoConfig } from "remotion";
import { HighlightedText } from "../components/HighlightedText";
import { isBulletPointsData, Scene } from "../types/scene";
import { extractKeywords } from "../utils/keywords";
import {
    getTeachingTiming,
    useEntranceSpring,
} from "../utils/sceneAnimations";
import { BulletPointItem } from "./BulletPointItem";

type BulletPointsSceneProps = {
    scene: Scene;
    durationInFrames: number;
};

export const BulletPointsScene = ({
    scene,
    durationInFrames,
}: BulletPointsSceneProps) => {
    const { fps } = useVideoConfig();
    if (!isBulletPointsData(scene.data)) {
        return null;
    }

    const data = scene.data;
    const { contentStart, contentDuration } = getTeachingTiming(
        durationInFrames,
        fps
    );

    const keywords = extractKeywords(
        [data.title, ...data.points].join(" ")
    );

    const headlineProgress = useEntranceSpring(3);
    const pointCount = Math.max(data.points.length, 1);
    const pointDuration = contentDuration / pointCount;
    const staggerFrames = Math.round(pointDuration * 0.85);

    return (
        <>
            <h1
                style={{
                    opacity: headlineProgress,
                    fontSize: 48,
                    color: "#f8fafc",
                    textAlign: "center",
                    marginBottom: 48,
                    maxWidth: 1200,
                    lineHeight: 1.3,
                }}
            >
                <HighlightedText
                    text={data.title}
                    keywords={keywords}
                    highlightOpacity={1}
                />
            </h1>

            <div style={{ width: "100%", maxWidth: 1200 }}>
                {data.points.map((point, index) => (
                    <BulletPointItem
                        key={`${scene.id}-point-${index}`}
                        point={point}
                        index={index}
                        keywords={keywords}
                        contentStart={contentStart}
                        staggerFrames={staggerFrames}
                        pointDuration={pointDuration}
                    />
                ))}
            </div>
        </>
    );
};
