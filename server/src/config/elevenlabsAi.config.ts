import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import { ELEVENLABS_API_KEY } from './env.js';

const elevenlabs = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY || "",
});

const audio = await elevenlabs.textToSpeech.convert(
    'JBFqnCBsd6RMkjVDRZzb', // voice_id
    {
        text: 'The first move is what sets everything in motion.',
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128', // output_format
    }
);

await play(audio);