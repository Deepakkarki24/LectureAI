import {
    GoogleGenAI,
} from '@google/genai';
import { GOOGLE_API_KEY, OPENAI_API_KEY } from './env.js';
import { gemini2Dot5Flash, gpt5Mini } from './model.js';
import OpenAI from "openai";
import type { AudioSegment } from '@/utils/segment.js';
import { scenePlanSchema, type ScenePlan } from '@/validators/scene.shema.js';
import { validateScenePlanAgainstSegments } from '@/validators/validateScenePlan.js';

export interface LectureScript {
    intro: string;
    content: string;
    outro: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runGoogleGeminiModel = async (
    systemInstruction: string,
    script: string,
) => {
    try {
        const ai = new GoogleGenAI({
            apiKey: GOOGLE_API_KEY || "",
        });

        const config = {
            systemInstruction,
            responseMimeType: "application/json",
        };

        const model = gemini2Dot5Flash;

        const contents = [
            {
                role: "user",
                parts: [
                    {
                        text: script,
                    },
                ],
            },
        ];

        const maxRetries = 2;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `Gemini Request Attempt ${attempt}/${maxRetries}`
                );

                const response = await ai.models.generateContent({
                    model,
                    config,
                    contents,
                });

                const finalResult = response.text || "";

                console.log("Raw Gemini response:", finalResult);

                if (!finalResult) {
                    throw new Error("Empty response received from Gemini");
                }

                let parsedResult: LectureScript;

                try {
                    parsedResult = JSON.parse(finalResult);
                } catch {
                    throw new Error("Gemini returned invalid JSON");
                }

                if (
                    typeof parsedResult.intro !== "string" ||
                    typeof parsedResult.content !== "string" ||
                    typeof parsedResult.outro !== "string"
                ) {
                    throw new Error(
                        "Gemini response does not contain intro, content and outro"
                    );
                }

                return {
                    success: true,
                    script: parsedResult,
                    message: "AI script generated",
                    service: "google",
                    err: "",
                };
            } catch (err: any) {
                const status = err?.status;

                console.error(
                    `Attempt ${attempt} failed with status:`,
                    status,
                    err
                );

                if (
                    status === 400 ||
                    status === 401 ||
                    status === 403 ||
                    status === 404 ||
                    status === 429
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
        console.error("Gemini generation failed:", err);

        return {
            success: false,
            script: null,
            message: "Failed to generate AI script",
            service: "google",
            err: err?.message || "Unknown error",
        };
    }
};

export const runGoogleGeminiSceneModel = async (
    systemInstruction: string,
    script: string,
    audioSegments: AudioSegment[]
) => {
    try {
        const ai = new GoogleGenAI({
            apiKey: GOOGLE_API_KEY || "",
        });

        const config = {
            systemInstruction,
            responseMimeType: "application/json",
        };

        const contents = [
            {
                role: "user",
                parts: [
                    {
                        text: JSON.stringify({
                            contentScript: script,
                            alignmentSegments: audioSegments,
                        }),
                    },
                ],
            },
        ];

        const maxRetries = 2;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `Gemini Scene Request Attempt ${attempt}/${maxRetries}`
                );

                const response = await ai.models.generateContent({
                    model: gemini2Dot5Flash,
                    config,
                    contents,
                });

                const finalResult = response.text || "";

                console.log(
                    "Raw Gemini scene response:",
                    finalResult
                );

                if (!finalResult) {
                    throw new Error(
                        "Empty response received from Gemini"
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
                        "Gemini returned invalid JSON"
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
                    service: "google",
                    err: "",
                };

            } catch (err: any) {

                const status = err?.status;

                console.error(
                    `Attempt ${attempt} failed with status:`,
                    status,
                    err
                );

                if (
                    status === 400 ||
                    status === 401 ||
                    status === 403 ||
                    status === 404 ||
                    status === 429
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
            "Gemini scene generation failed:",
            err
        );

        return {
            success: false,
            scenes: null,
            message: "Failed to generate scene plan",
            service: "google",
            err: err?.message || "Unknown error",
        };
    }
};

export const runOpenAiModel = async (systemInstruction: string, script: string) => {
    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });

    const model = gpt5Mini

    const config = {
        text: {
            format: {
                type: "text",
            },
            verbosity: "medium",
        },

        reasoning: {
            effort: "medium",
            mode: "standard",
        },
    } as const

    const response = await openai.responses.create({
        model,
        instructions: systemInstruction,
        input: script,
        ...config,
    })

}