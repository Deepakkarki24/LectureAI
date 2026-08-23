import { z } from "zod";

/**
 * ============================================================
 * ANIMATION
 * ============================================================
 */

const animationSchema = z
    .object({
        entrance: z.enum([
            "fade",
            "slideLeft",
            "slideRight",
            "slideUp",
            "slideDown",
            "scale",
            "reveal",
        ]),

        exit: z.enum([
            "fade",
            "slideLeft",
            "slideRight",
            "slideUp",
            "slideDown",
            "scale",
        ]),

        emphasis: z.enum([
            "highlight",
            "pulse",
            "underline",
            "zoom",
        ]),
    })
    .strict();


/**
 * ============================================================
 * BASE SCENE FIELDS
 * ============================================================
 */

const baseScene = {
    id: z
        .string()
        .regex(/^scene_\d+$/, {
            message: "Scene ID must be like scene_1, scene_2, etc.",
        }),

    start: z
        .number()
        .finite(),

    end: z
        .number()
        .finite(),

    narrationSegments: z
        .array(z.string())
        .min(1),

    animation: animationSchema,
};


/**
 * ============================================================
 * TITLE
 * ============================================================
 */

const titleSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("title"),

        data: z
            .object({
                title: z.string(),
                subtitle: z.string(),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * CONCEPT
 * ============================================================
 */

const conceptSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("concept"),

        data: z
            .object({
                title: z.string(),
                subtitle: z.string(),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * DEFINITION
 * ============================================================
 */

const definitionSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("definition"),

        data: z
            .object({
                term: z.string(),
                definition: z.string(),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * BULLET POINTS
 * ============================================================
 */

const bulletPointsSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("bulletPoints"),

        data: z
            .object({
                title: z.string(),
                points: z
                    .array(z.string())
                    .min(1),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * COMPARISON
 * ============================================================
 */

const comparisonSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("comparison"),

        data: z
            .object({
                left: z
                    .object({
                        title: z.string(),
                        description: z.string(),
                    })
                    .strict(),

                right: z
                    .object({
                        title: z.string(),
                        description: z.string(),
                    })
                    .strict(),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * PROCESS
 * ============================================================
 */

const processSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("process"),

        data: z
            .object({
                title: z.string(),
                steps: z
                    .array(z.string())
                    .min(1),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * TIMELINE
 * ============================================================
 */

const timelineSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("timeline"),

        data: z
            .object({
                title: z.string(),

                events: z
                    .array(
                        z
                            .object({
                                label: z.string(),
                                description: z.string(),
                            })
                            .strict()
                    )
                    .min(1),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * FLOWCHART
 * ============================================================
 */

const flowchartSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("flowchart"),

        data: z
            .object({
                title: z.string(),
                steps: z
                    .array(z.string())
                    .min(1),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * DIAGRAM
 * ============================================================
 */

const diagramSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("diagram"),

        data: z
            .object({
                title: z.string(),
                labels: z
                    .array(z.string())
                    .min(1),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * EXAMPLE
 * ============================================================
 */

const exampleSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("example"),

        data: z
            .object({
                title: z.string(),
                example: z.string(),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * QUESTION
 * ============================================================
 */

const questionSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("question"),

        data: z
            .object({
                question: z.string(),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * STATISTICS
 * ============================================================
 */

const statisticsSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("statistics"),

        data: z
            .object({
                title: z.string(),

                statistics: z
                    .array(
                        z
                            .object({
                                label: z.string(),
                                value: z.string(),
                            })
                            .strict()
                    )
                    .min(1),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * QUOTE
 * ============================================================
 */

const quoteSceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("quote"),

        data: z
            .object({
                quote: z.string(),
                source: z.string(),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * SUMMARY
 * ============================================================
 */

const summarySceneSchema = z
    .object({
        ...baseScene,

        type: z.literal("summary"),

        data: z
            .object({
                title: z.string(),

                points: z
                    .array(z.string())
                    .min(1),
            })
            .strict(),
    })
    .strict();


/**
 * ============================================================
 * SCENE UNION
 * ============================================================
 *
 * "type" determines which data schema is valid.
 */

export const sceneSchema = z.discriminatedUnion("type", [
    titleSceneSchema,
    conceptSceneSchema,
    definitionSceneSchema,
    bulletPointsSceneSchema,
    comparisonSceneSchema,
    processSceneSchema,
    timelineSceneSchema,
    flowchartSceneSchema,
    diagramSceneSchema,
    exampleSceneSchema,
    questionSceneSchema,
    statisticsSceneSchema,
    quoteSceneSchema,
    summarySceneSchema,
]);


/**
 * ============================================================
 * COMPLETE SCENE PLAN
 * ============================================================
 */

export const scenePlanSchema = z
    .object({
        scenes: z
            .array(sceneSchema)
            .min(1),
    })
    .strict();


/**
 * ============================================================
 * TYPESCRIPT TYPE
 * ============================================================
 */

export type ScenePlan = z.infer<typeof scenePlanSchema>;

export type Scene = z.infer<typeof sceneSchema>;