import { SceneWrapper } from "../components/SceneWrapper";
import { Scene } from "../types/scene";
import { BulletPointsScene } from "./BulletPointsScene";
import { ComparisonScene } from "./ComparisonScene";
import { ConceptScene } from "./ConceptScene";
import { DefinitionScene } from "./DefinitionScene";
import { ProcessScene } from "./ProcessScene";
import { QuestionScene } from "./QuestionScene";

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
        case "definition":
            return (
                <DefinitionScene scene={scene} durationInFrames={durationInFrames} />
            );
        case "process":
            return (
                <ProcessScene scene={scene} durationInFrames={durationInFrames} />
            );
        case "question":
            return (
                <QuestionScene scene={scene} durationInFrames={durationInFrames} />
            );
        default:
            return null;
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
