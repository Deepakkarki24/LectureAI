import {
    AbsoluteFill,
    Audio,
    Sequence,
    useVideoConfig,
} from "remotion";

import { SceneSlide } from "./scenes/SceneSlide";
import { LectureVideoProps } from "./types/scene";

export const LectureVideo = ({ audioUrl, scenes }: LectureVideoProps) => {
    const { fps } = useVideoConfig();
    return (
        <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
            {scenes.map((scene, index) => {
                const startFrame = Math.round(scene.start * fps);
                const durationInFrames = Math.max(
                    Math.round((scene.end - scene.start) * fps),
                    1
                );
                return (
                    <Sequence
                        key={scene.id ?? `scene-${index}`}
                        from={startFrame}
                        durationInFrames={durationInFrames}
                    >
                        <SceneSlide
                            scene={scene}
                            sceneIndex={index}
                            totalScenes={scenes.length}
                            durationInFrames={durationInFrames}
                        />
                    </Sequence>
                );
            })}
            {audioUrl ? <Audio src={audioUrl} /> : null}
        </AbsoluteFill>
    );
};

