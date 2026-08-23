import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

export type {
    Scene,
    SceneType,
    SceneData,
    SceneAnimation,
    LectureVideoProps,
    ComparisonSceneData,
    ConceptSceneData,
    BulletPointsSceneData,
    DefinitionSceneData,
    ProcessSceneData,
    QuestionSceneData,
} from "./types/scene";

registerRoot(RemotionRoot);
