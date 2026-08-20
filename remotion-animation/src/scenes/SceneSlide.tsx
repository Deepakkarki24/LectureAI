import { SceneWrapper } from "../components/SceneWrapper";
import { Scene } from "../types/scene";
import { BulletPointsScene } from "./BulletPointsScene";
import { ComparisonScene } from "./ComparisonScene";
import { ConceptScene } from "./ConceptScene";

type SceneSlideProps = {
    scene: Scene;
    sceneIndex: number;
    totalScenes: number;
    durationInFrames: number;
};

const renderSceneContent = (scene: Scene, durationInFrames: number) => {
    switch (scene.type) {
        case "comparison":
            return (
                <ComparisonScene scene={scene} durationInFrames={durationInFrames} />
            );
        case "concept":
            return (
                <ConceptScene scene={scene} durationInFrames={durationInFrames} />
            );
        case "bulletPoints":
            return (
                <BulletPointsScene scene={scene} durationInFrames={durationInFrames} />
            );
        default:
            return (
                <ConceptScene scene={scene} durationInFrames={durationInFrames} />
            );
    }
};

export const SceneSlide = ({
    scene,
    sceneIndex,
    totalScenes,
    durationInFrames,
}: SceneSlideProps) => {
    return (
        <SceneWrapper
            sceneIndex={sceneIndex}
            totalScenes={totalScenes}
            durationInFrames={durationInFrames}
            animation={scene.animation}
        >
            {renderSceneContent(scene, durationInFrames)}
        </SceneWrapper>
    );
};
