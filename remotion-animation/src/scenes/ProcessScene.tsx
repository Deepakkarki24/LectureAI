import { BulletPointsScene } from "./BulletPointsScene";
import { isProcessData, Scene } from "../types/scene";

type ProcessSceneProps = {
    scene: Scene;
    durationInFrames: number;
};

export const ProcessScene = ({ scene, durationInFrames }: ProcessSceneProps) => {
    if (!isProcessData(scene.data)) {
        return null;
    }

    const mappedScene: Scene = {
        ...scene,
        type: "bulletPoints",
        data: {
            title: scene.data.title,
            points: scene.data.steps,
        },
    };

    return (
        <BulletPointsScene
            scene={mappedScene}
            durationInFrames={durationInFrames}
        />
    );
};
