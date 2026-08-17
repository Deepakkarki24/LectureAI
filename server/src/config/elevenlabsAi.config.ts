import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import { ELEVENLABS_API_KEY } from './env.js';

export const runElevenLabsAiModel = async (scriptText: string) => {
    try {
        console.log("Generating voice...")
        const elevenlabs = new ElevenLabsClient({
            apiKey: ELEVENLABS_API_KEY || "",
        });

        const audio = await elevenlabs.textToSpeech.convert(
            'JBFqnCBsd6RMkjVDRZzb', // voice_id
            {
                text: scriptText,
                modelId: 'eleven_multilingual_v2',
                outputFormat: 'mp3_44100_128', // output_format
            }
        );

        if (!audio) {
            console.log("error while generating the voice")
            return;

        }

        console.log("Generated!")

        return audio;
    } catch (err: any) {
        console.log(err)
    }
}