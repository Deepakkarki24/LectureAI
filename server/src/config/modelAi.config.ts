import {
    GoogleGenAI,
    ThinkingLevel,
    Type,
} from '@google/genai';
import { GOOGLE_API_KEY, OPENAI_API_KEY } from './env.js';
import { gemini2Dot5Flash, gpt5Mini } from './model.js';
import OpenAI from "openai";


const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runGoogleGeminiModel = async (
    systemInstruction: string,
    script: string
) => {

    try {
        const ai = new GoogleGenAI({
            apiKey: GOOGLE_API_KEY || ""
        });

        const config = {
            systemInstruction,
            // thinkingConfig: {
            //   thinkingLevel: ThinkingLevel.MINIMAL,
            // },
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

                console.log("response.text", response.text)

                const finalResult = response.text || "";
                console.log("finalResult", finalResult)

                return {
                    success: true,
                    script: finalResult,
                    message: "AI script generated",
                    service: "google",
                    err: "",
                };
            } catch (err: any) {
                const status = err?.status;

                console.error(
                    `Attempt ${attempt} failed with status:`,
                    status
                );

                // Don't retry client errors except 429 limit exceeded
                if (
                    status === 400 ||
                    status === 401 ||
                    status === 403 ||
                    status === 404 ||
                    status === 429
                ) {
                    throw err;
                }

                // Last attempt
                if (attempt === maxRetries) {
                    throw err;
                }

                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;

                console.log(
                    `Retrying in ${delay}ms...`
                );

                await sleep(delay);
            }
        }
    } catch (err: any) {
        console.log(err)
    }
}


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