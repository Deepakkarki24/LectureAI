import type { PdfAnimationScene } from "./pdfAnimationScene.js";

export type SceneAnimation = {
    entrance: string;
    exit: string;
    emphasis?: string;
};

export type ComparisonSide = {
    title: string;
    description: string;
};

export type ComparisonSceneData = {
    left: ComparisonSide;
    right: ComparisonSide;
};

export type ConceptSceneData = {
    title: string;
    subtitle: string;
};

export type BulletPointsSceneData = {
    title: string;
    points: string[];
};

export type DefinitionSceneData = {
    term: string;
    definition: string;
};

export type ProcessSceneData = {
    title: string;
    steps: string[];
};

export type QuestionSceneData = {
    question: string;
};

export type SceneData =
    | ComparisonSceneData
    | ConceptSceneData
    | BulletPointsSceneData
    | DefinitionSceneData
    | ProcessSceneData
    | QuestionSceneData;

export type SceneType =
    | "comparison"
    | "concept"
    | "bulletPoints"
    | "definition"
    | "process"
    | "question";

type SceneBase = {
    id: string;
    start: number;
    end: number;
    narrationSegments: string[];
    animation: SceneAnimation;
};

export type Scene = SceneBase &
    (
        | { type: "comparison"; data: ComparisonSceneData }
        | { type: "concept"; data: ConceptSceneData }
        | { type: "bulletPoints"; data: BulletPointsSceneData }
        | { type: "definition"; data: DefinitionSceneData }
        | { type: "process"; data: ProcessSceneData }
        | { type: "question"; data: QuestionSceneData }
    );

export type LectureVideoProps = {
    audioUrl: string;
    scenes: Scene[];
    pageImageUrls?: string[];
    pdfAnimationScenes?: PdfAnimationScene[];
    pageAspectRatios?: number[];
};

const isRecord = (data: unknown): data is Record<string, unknown> =>
    typeof data === "object" && data !== null;

export const isComparisonData = (
    data: unknown
): data is ComparisonSceneData =>
    isRecord(data) && "left" in data && "right" in data;

export const isConceptData = (data: unknown): data is ConceptSceneData =>
    isRecord(data) &&
    typeof data.title === "string" &&
    typeof data.subtitle === "string" &&
    !("points" in data) &&
    !("steps" in data);

export const isBulletPointsData = (
    data: unknown
): data is BulletPointsSceneData =>
    isRecord(data) && Array.isArray(data.points);

export const isDefinitionData = (
    data: unknown
): data is DefinitionSceneData =>
    isRecord(data) &&
    typeof data.term === "string" &&
    typeof data.definition === "string";

export const isProcessData = (data: unknown): data is ProcessSceneData =>
    isRecord(data) &&
    typeof data.title === "string" &&
    Array.isArray(data.steps);

export const isQuestionData = (data: unknown): data is QuestionSceneData =>
    isRecord(data) && typeof data.question === "string";
