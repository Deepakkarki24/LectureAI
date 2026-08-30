import { OPENAI_API_KEY } from './env.js';
import { gpt5Mini } from './model.js';
import OpenAI from "openai";
import type { AudioSegment } from '@/utils/segment.js';
import type { PdfPageText } from '@/services/pdfExtract.service.js';
import { scenePlanSchema, type ScenePlan } from '@/validators/scene.shema.js';
import {
    pdfAnimationScenePlanSchema,
    type PdfAnimationScenePlan,
} from '@/validators/pdfAnimationScene.schema.js';
import { validateScenePlanAgainstSegments } from '@/validators/validateScenePlan.js';
import { validatePdfAnimationScenePlanAgainstSegments } from '@/validators/validatePdfAnimationScenePlan.js';

export interface LectureScript {
    intro: string;
    content: string;
    outro: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getOpenAiClient = () => {
    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
    }

    return new OpenAI({
        apiKey: OPENAI_API_KEY,
    });
};

const openAiJsonConfig = {
    text: {
        format: {
            type: "json_schema" as const,
            name: "lecture_script",
            strict: true,
            schema: {
                type: "object",
                properties: {
                    intro: {
                        type: "string",
                    },
                    content: {
                        type: "string",
                    },
                    outro: {
                        type: "string",
                    },
                },
                required: ["intro", "content", "outro"],
                additionalProperties: false,
            },
        },
        verbosity: "medium" as const,
    },
    reasoning: {
        effort: "medium" as const,
    },
};

const openAiSceneJsonConfig = {
    text: {
        format: {
            type: "json_object" as const,
        },
        verbosity: "medium" as const,
    },
    reasoning: {
        effort: "medium" as const,
    },
};

const getOpenAiErrorStatus = (err: unknown): number | undefined => {
    if (err && typeof err === "object" && "status" in err) {
        const status = (err as { status?: unknown }).status;
        return typeof status === "number" ? status : undefined;
    }
    return undefined;
};

/**
 * Generate lecture script JSON `{ intro, content, outro }` via GPT-5 mini.
 * Drop-in replacement for the previous Gemini script runner.
 */
export const runOpenAiModel = async (
    systemInstruction: string,
    script: string,
) => {
    try {
        const openai = getOpenAiClient();
        const model = gpt5Mini;
        const maxRetries = 2;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `OpenAI Request Attempt ${attempt}/${maxRetries}`
                );

                const response = await openai.responses.create({
                    model,
                    instructions: systemInstruction,
                    input: script,
                    ...openAiJsonConfig,
                });

                const finalResult = response.output_text || "";

                console.log("Raw OpenAI response:", finalResult);

                if (!finalResult) {
                    throw new Error("Empty response received from OpenAI");
                }

                let parsedResult: LectureScript;

                try {
                    parsedResult = JSON.parse(finalResult);
                } catch {
                    throw new Error("OpenAI returned invalid JSON");
                }

                if (
                    typeof parsedResult.intro !== "string" ||
                    typeof parsedResult.content !== "string" ||
                    typeof parsedResult.outro !== "string"
                ) {
                    throw new Error(
                        "OpenAI response does not contain intro, content and outro"
                    );
                }

                return {
                    success: true,
                    script: parsedResult,
                    message: "AI script generated",
                    service: "openai",
                    err: "",
                };
            } catch (err: any) {
                const status = getOpenAiErrorStatus(err);

                console.error(
                    `Attempt ${attempt} failed with status:`,
                    status,
                    err
                );

                if (
                    status === 400 ||
                    status === 401 ||
                    status === 403 ||
                    status === 404
                ) {
                    throw err;
                }

                if (attempt === maxRetries) {
                    throw err;
                }

                const delay = Math.pow(2, attempt) * 1000;

                console.log(`Retrying in ${delay}ms...`);

                await sleep(delay);
            }
        }
    } catch (err: any) {
        console.error("OpenAI generation failed:", err);

        return {
            success: false,
            script: null,
            message: "Failed to generate AI script",
            service: "openai",
            err: err?.message || "Unknown error",
        };
    }
};

/**
 * Generate Remotion scene plan JSON via GPT-5 mini.
 * Drop-in replacement for the previous Gemini scene runner.
 */
export const runOpenAiSceneModel = async (
    systemInstruction: string,
    script: string,
    audioSegments: AudioSegment[]
) => {
    try {
        const openai = getOpenAiClient();
        const model = gpt5Mini;
        const maxRetries = 2;

        const userInput = JSON.stringify({
            contentScript: script,
            alignmentSegments: audioSegments,
        });

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `OpenAI Scene Request Attempt ${attempt}/${maxRetries}`
                );

                const response = await openai.responses.create({
                    model,
                    instructions: systemInstruction,
                    input: [
                        {
                            role: "user",
                            content: `Generate a JSON object for the following input:\n\n${userInput}`
                        }
                    ],
                    ...openAiSceneJsonConfig,
                });

                const finalResult = response.output_text || "";

                console.log(
                    "Raw OpenAI scene response:",
                    finalResult
                );

                if (!finalResult) {
                    throw new Error(
                        "Empty response received from OpenAI"
                    );
                }

                // --------------------------------
                // STEP 1: Parse JSON
                // --------------------------------

                let rawResult: unknown;

                try {
                    rawResult = JSON.parse(finalResult);
                } catch {
                    throw new Error(
                        "OpenAI returned invalid JSON"
                    );
                }

                // --------------------------------
                // STEP 2: ZOD VALIDATION
                // --------------------------------

                const validationResult =
                    scenePlanSchema.safeParse(rawResult);

                if (!validationResult.success) {
                    console.error(
                        "Scene schema validation failed:"
                    );

                    console.error(
                        validationResult.error.format()
                    );

                    throw new Error(
                        `Invalid scene structure: ${validationResult.error.message}`
                    );
                }

                const parsedResult: ScenePlan =
                    validationResult.data;

                console.log(
                    "✅ Scene schema validation successful"
                );

                // --------------------------------
                // STEP 3: Validate against
                //         audioSegments
                // --------------------------------

                validateScenePlanAgainstSegments(
                    parsedResult,
                    audioSegments
                );

                console.log(
                    "✅ Scene segment validation successful"
                );

                // --------------------------------
                // STEP 4: Return validated scenes
                // --------------------------------

                return {
                    success: true,
                    scenes: parsedResult.scenes,
                    message: "Scene plan generated",
                    service: "openai",
                    err: "",
                };

            } catch (err: any) {

                const status = getOpenAiErrorStatus(err);

                console.error(
                    `Attempt ${attempt} failed with status:`,
                    status,
                    err
                );

                if (
                    status === 400 ||
                    status === 401 ||
                    status === 403 ||
                    status === 404
                ) {
                    throw err;
                }

                if (attempt === maxRetries) {
                    throw err;
                }

                const delay =
                    Math.pow(2, attempt) * 1000;

                await sleep(delay);
            }
        }

    } catch (err: any) {

        console.error(
            "OpenAI scene generation failed:",
            err
        );

        return {
            success: false,
            scenes: null,
            message: "Failed to generate scene plan",
            service: "openai",
            err: err?.message || "Unknown error",
        };
    }
};

/**
 * Generate PDF page-camera scene plan JSON via GPT-5 mini.
 * Does not replace runOpenAiSceneModel (live slide Remotion path).
 */

type LayoutForModel = {
    page: number
    lines: { id: string; text: string }[]
}

export const runOpenAiPdfAnimationSceneModel = async (
    systemInstruction: string,
    script: string,
    audioSegments: AudioSegment[],
    pdfPages: LayoutForModel[]
) => {
    try {
        const openai = getOpenAiClient();
        const model = gpt5Mini;
        const maxRetries = 2;
        const pageCount = pdfPages.length;

        const userInput = JSON.stringify({
            contentScript: script,
            alignmentSegments: audioSegments,
            pdfPages,
            pageCount,
        });

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `OpenAI PDF animation scene attempt ${attempt}/${maxRetries}`
                );

                const response = await openai.responses.create({
                    model,
                    instructions: systemInstruction,
                    input: [
                        {
                            role: "user",
                            content: `Generate a JSON object for the following input:\n\n${userInput}`,
                        },
                    ],
                    ...openAiSceneJsonConfig,
                });

                const finalResult = response.output_text || "";

                console.log(
                    "Raw OpenAI PDF animation scene response:",
                    finalResult
                );

                if (!finalResult) {
                    throw new Error("Empty response received from OpenAI");
                }

                let rawResult: unknown;

                try {
                    rawResult = JSON.parse(finalResult);
                } catch {
                    throw new Error("OpenAI returned invalid JSON");
                }

                const validationResult =
                    pdfAnimationScenePlanSchema.safeParse(rawResult);

                if (!validationResult.success) {
                    console.error(
                        "PDF animation scene schema validation failed:"
                    );
                    console.error(validationResult.error.format());
                    throw new Error(
                        `Invalid PDF animation scene structure: ${validationResult.error.message}`
                    );
                }

                const parsedResult: PdfAnimationScenePlan =
                    validationResult.data;

                validatePdfAnimationScenePlanAgainstSegments(
                    parsedResult,
                    audioSegments,
                    pageCount
                );

                console.log(
                    "✅ PDF animation scene plan validation successful"
                );

                return {
                    success: true,
                    scenes: parsedResult.scenes,
                    message: "PDF animation scene plan generated",
                    service: "openai",
                    err: "",
                };
            } catch (err: any) {
                const status = getOpenAiErrorStatus(err);

                console.error(
                    `PDF animation scene attempt ${attempt} failed with status:`,
                    status,
                    err
                );

                if (
                    status === 400 ||
                    status === 401 ||
                    status === 403 ||
                    status === 404
                ) {
                    throw err;
                }

                if (attempt === maxRetries) {
                    throw err;
                }

                await sleep(Math.pow(2, attempt) * 1000);
            }
        }
    } catch (err: any) {
        console.error("OpenAI PDF animation scene generation failed:", err);

        return {
            success: false,
            scenes: null,
            message: "Failed to generate PDF animation scene plan",
            service: "openai",
            err: err?.message || "Unknown error",
        };
    }
};
