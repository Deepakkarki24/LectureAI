export type SceneAnimation = {
    entrance: string;
    exit: string;
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

export type SceneData =
    | ComparisonSceneData
    | ConceptSceneData
    | BulletPointsSceneData
    | Record<string, unknown>;

export type SceneType = "comparison" | "concept" | "bulletPoints" | string;

export type Scene = {
    id: string;
    type: SceneType;
    start: number;
    end: number;
    narrationSegments: string[];
    data: SceneData;
    animation: SceneAnimation;
};

export type LectureVideoProps = {
    audioUrl: string;
    scenes: Scene[];
};

export const isComparisonData = (data: SceneData): data is ComparisonSceneData =>
    typeof data === "object" &&
    data !== null &&
    "left" in data &&
    "right" in data;

export const isConceptData = (data: SceneData): data is ConceptSceneData =>
    typeof data === "object" &&
    data !== null &&
    "title" in data &&
    "subtitle" in data &&
    !("points" in data);

export const isBulletPointsData = (data: SceneData): data is BulletPointsSceneData =>
    typeof data === "object" &&
    data !== null &&
    "points" in data &&
    Array.isArray((data as BulletPointsSceneData).points);
