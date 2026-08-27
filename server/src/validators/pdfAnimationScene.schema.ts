import { z } from "zod";

/**
 * PDF page-camera scene plan (Phase 2 contract).
 *
 * Live TTS still validates against `scene.shema.ts`. This schema is the
 * target shape for later planner / DB / Remotion phases.
 *
 * Coordinates are normalized 0–1 relative to that lecture’s page image,
 * origin at the top-left. They are not pixels and not percentages 0–100.
 *
 * Page numbers are 1-based and must match that lecture’s PDF (max 8 pages).
 */

export const MAX_LECTURE_PDF_PAGES = 8;

const REGION_EPSILON = 1e-6;

export const pdfAnimationTypeSchema = z.enum([
    "none",
    "zoom_in",
    "zoom_out",
    "highlight",
    "pan",
    "fade",
    "focus",
]);

export const pdfSceneTransitionSchema = z.enum(["none", "fade"]);

export const normalizedRegionSchema = z
    .object({
        x: z.number().finite().min(0).max(1),
        y: z.number().finite().min(0).max(1),
        width: z.number().finite().gt(0).max(1),
        height: z.number().finite().gt(0).max(1),
    })
    .strict()
    .superRefine((region, ctx) => {
        if (region.x + region.width > 1 + REGION_EPSILON) {
            ctx.addIssue({
                code: "custom",
                message: "Region x + width must be <= 1 (normalized page space)",
                path: ["width"],
            });
        }

        if (region.y + region.height > 1 + REGION_EPSILON) {
            ctx.addIssue({
                code: "custom",
                message: "Region y + height must be <= 1 (normalized page space)",
                path: ["height"],
            });
        }
    });

export const pdfSceneCameraSchema = z
    .object({
        from: normalizedRegionSchema.optional(),
        to: normalizedRegionSchema.optional(),
        zoom: z.number().finite().min(1).max(8).optional(),
    })
    .strict();

const ANIMATIONS_REQUIRING_FOCUS = new Set(["zoom_in", "highlight"]);

export const pdfAnimationSceneSchema = z
    .object({
        id: z.string().regex(/^scene_\d+$/, {
            message: "Scene ID must be like scene_1, scene_2, etc.",
        }),

        page: z
            .number()
            .int()
            .min(1)
            .max(MAX_LECTURE_PDF_PAGES),

        start: z.number().finite().nonnegative(),

        end: z.number().finite().nonnegative(),

        narrationSegments: z
            .array(
                z.string().regex(/^segment_\d+$/, {
                    message: "Segment ID must be like segment_1, segment_2, etc.",
                })
            )
            .min(1),

        animation: pdfAnimationTypeSchema,

        focus: normalizedRegionSchema.optional(),

        camera: pdfSceneCameraSchema.optional(),

        transition: pdfSceneTransitionSchema.optional(),
    })
    .strict()
    .superRefine((scene, ctx) => {
        if (scene.end <= scene.start) {
            ctx.addIssue({
                code: "custom",
                message: "end must be greater than start",
                path: ["end"],
            });
        }

        if (ANIMATIONS_REQUIRING_FOCUS.has(scene.animation) && !scene.focus) {
            ctx.addIssue({
                code: "custom",
                message: `${scene.animation} requires a focus region in normalized 0–1 coordinates`,
                path: ["focus"],
            });
        }

        if (scene.animation === "pan") {
            if (!scene.camera?.from || !scene.camera?.to) {
                ctx.addIssue({
                    code: "custom",
                    message: "pan requires camera.from and camera.to regions",
                    path: ["camera"],
                });
            }
        }

        if (scene.animation === "focus") {
            if (!scene.camera?.from || !scene.camera?.to) {
                ctx.addIssue({
                    code: "custom",
                    message:
                        "focus requires camera.from and camera.to regions",
                    path: ["camera"],
                });
            }
        }
    });

export const pdfAnimationScenePlanSchema = z
    .object({
        scenes: z.array(pdfAnimationSceneSchema).min(1),
    })
    .strict()
    .superRefine((plan, ctx) => {
        const ids = new Set<string>();
        let previousStart = -Infinity;

        for (let i = 0; i < plan.scenes.length; i++) {
            const scene = plan.scenes[i];
            if (!scene) {
                continue;
            }

            if (ids.has(scene.id)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Duplicate scene id ${scene.id}`,
                    path: ["scenes", i, "id"],
                });
            }
            ids.add(scene.id);

            if (scene.start < previousStart) {
                ctx.addIssue({
                    code: "custom",
                    message: "Scenes must be in chronological order by start time",
                    path: ["scenes", i, "start"],
                });
            }
            previousStart = scene.start;
        }
    });

export type PdfAnimationType = z.infer<typeof pdfAnimationTypeSchema>;
export type PdfSceneTransition = z.infer<typeof pdfSceneTransitionSchema>;
export type NormalizedRegion = z.infer<typeof normalizedRegionSchema>;
export type PdfSceneCamera = z.infer<typeof pdfSceneCameraSchema>;
export type PdfAnimationScene = z.infer<typeof pdfAnimationSceneSchema>;
export type PdfAnimationScenePlan = z.infer<typeof pdfAnimationScenePlanSchema>;
