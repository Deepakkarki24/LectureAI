import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import { ELEVENLABS_API_KEY } from './env.js';
import { ritikaVoiceOver, vidhiVoiceOver } from './model.js';

// updated config to generate timestamps at the time of voice generation
export const runElevenLabsAiModel = async (
    scriptText: string,
    withTimestamps = false,
    hinglish = false
) => {
    try {
        console.log(
            `Generating voice${withTimestamps ? " with timestamps" : ""}...`
        );

        const elevenlabs = new ElevenLabsClient({
            apiKey: ELEVENLABS_API_KEY || "",
        });

        if (withTimestamps) {
            const response =
                await elevenlabs.textToSpeech.convertWithTimestamps(
                    ritikaVoiceOver,
                    {
                        text: scriptText,
                        modelId: "eleven_multilingual_v2",
                        outputFormat: "mp3_44100_128",
                        voiceSettings: {
                            useSpeakerBoost: true,
                        },
                    }
                );

            if (!response) {
                throw new Error("Error while generating voice with timestamps");
            }

            return {
                audioBuffer: Buffer.from(response.audioBase64, "base64"),
                alignment: response.alignment,
            };
        }

        const audioStream = await elevenlabs.textToSpeech.convert(
            hinglish ? vidhiVoiceOver : ritikaVoiceOver,
            {
                text: scriptText,
                modelId: "eleven_multilingual_v2",
                outputFormat: "mp3_44100_128",
                voiceSettings: {
                    useSpeakerBoost: true,
                },
            }
        );

        const chunks: Buffer[] = [];

        for await (const chunk of audioStream) {
            chunks.push(Buffer.from(chunk));
        }

        return {
            audioBuffer: Buffer.concat(chunks),
            alignment: null,
        };
    } catch (err: any) {
        console.error("ElevenLabs error:", err);
        throw err;
    }
};