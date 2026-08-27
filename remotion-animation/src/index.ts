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

export type {
    PdfAnimationScene,
    PdfAnimationScenePlan,
    PdfAnimationType,
    PdfSceneCamera,
    PdfSceneTransition,
    NormalizedRegion,
} from "./types/pdfAnimationScene";

registerRoot(RemotionRoot);
