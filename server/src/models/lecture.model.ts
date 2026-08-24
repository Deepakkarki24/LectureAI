import mongoose, { model, Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Lecture document for the PDF → script → TTS → video pipeline.
 *
 * Flow that this schema is meant to persist:
 * 1. PDF extract  → pdfName, extractedContent
 * 2. Script gen   → script.hinglish + script.english (intro / content / outro)
 * 3. TTS          → audio URLs (Hinglish final mix + English segments) + scenes
 * 4. Video        → HeyGen intro/outro videoIds, Remotion URL, then Cloudinary URLs
 * 5. Combine      → finalVideoUrl once intro + remotion + outro are all ready
 *
 * HeyGen webhook uses callback_id = lecture _id. Both intro and outro share that
 * id, so clips are matched by videoId, not by callback_id alone.
 */

interface IScriptParts {
    intro: string,
    content: string,
    outro: string,
}

interface IHeyGenClip {
    videoId: string,
    status: "idle" | "processing" | "completed" | "failed",
    url: string | null;
}

interface ISceneAnimation {
    entrance: string;
    exit: string;
    emphasis?: string;
}

/**
 * One Remotion slide. `data` is mixed because it is a discriminated union
 * keyed by `type` (title, concept, comparison, …) — same shape as
 * `Scene` from validators/scene.shema.ts.
 */
interface IScene {
    id: string;
    type: string;
    start: number;
    end: number;
    narrationSegments: string[];
    animation: ISceneAnimation;
    data: Record<string, unknown>;
}

interface ILecture {
    pdfName: string;
    extractedContent: string;

    script: {
        hinglish: IScriptParts;
        english: IScriptParts;
    };

    /** Validated scene plan from generateSceneFromModel (`parsedResult.scenes`). */
    scenes: IScene[];

    audio: {
        hinglish: {
            finalUrl: string | null;
        };
        english: {
            introUrl: string | null;
            contentUrl: string | null;
            outroUrl: string | null;
        };
    };

    video: {
        heygen: {
            intro: IHeyGenClip;
            outro: IHeyGenClip;
        };
        remotionUrl: string | null;
        finalUrl: string | null;
    };

    status:
    | "draft"
    | "extracted"
    | "script_generated"
    | "audio_generated"
    | "video_processing"
    | "completed"
    | "combining"
    | "error";

    error: string | null;
}

const lectureSchema = new Schema<ILecture>(
    {
        pdfName: {
            type: String,
            required: true,
            trim: true,
        },

        extractedContent: {
            type: String,
            default: "",
        },

        script: {
            hinglish: {
                intro: { type: String, default: "" },
                content: { type: String, default: "" },
                outro: { type: String, default: "" },
            },

            english: {
                intro: { type: String, default: "" },
                content: { type: String, default: "" },
                outro: { type: String, default: "" },
            },
        },

        scenes: {
            type: [
                {
                    id: { type: String, required: true },
                    type: {
                        type: String,
                        required: true,
                        enum: [
                            "title",
                            "concept",
                            "definition",
                            "bulletPoints",
                            "comparison",
                            "process",
                            "timeline",
                            "flowchart",
                            "diagram",
                            "example",
                            "question",
                            "statistics",
                            "quote",
                            "summary",
                        ],
                    },
                    start: { type: Number, required: true },
                    end: { type: Number, required: true },
                    narrationSegments: { type: [String], default: [] },
                    animation: {
                        entrance: { type: String, required: true },
                        exit: { type: String, required: true },
                        emphasis: { type: String, default: undefined },
                    },
                    data: { type: Schema.Types.Mixed, required: true },
                },
            ],
            default: [],
        },

        audio: {
            hinglish: {
                finalUrl: { type: String, default: null },
            },

            english: {
                introUrl: { type: String, default: null },
                contentUrl: { type: String, default: null },
                outroUrl: { type: String, default: null },
            },
        },


        video: {
            heygen: {
                intro: {
                    videoId: { type: String, default: null },
                    status: {
                        type: String,
                        enum: ["idle", "processing", "completed", "failed"],
                        default: "idle",
                    },
                    url: { type: String, default: null },
                },

                outro: {
                    videoId: { type: String, default: null },
                    status: {
                        type: String,
                        enum: ["idle", "processing", "completed", "failed"],
                        default: "idle",
                    },
                    url: { type: String, default: null },
                },
            },

            remotionUrl: {
                type: String,
                default: null,
            },

            finalUrl: {
                type: String,
                default: null,
            },
        },

        status: {
            type: String,
            enum: [
                "draft",
                "extracted",
                "script_generated",
                "audio_generated",
                "video_processing",
                "completed",
                "combining",
                "error",
            ],
            default: "draft",
            index: true,
        },

        error: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "lectures",
    }
);

export const Lecture = model<ILecture>("Lecture", lectureSchema);