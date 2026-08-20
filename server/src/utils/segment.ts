export interface ElevenLabsAlignment {
    characters: string[];
    characterStartTimesSeconds: number[];
    characterEndTimesSeconds: number[];
}

export interface AudioSegment {
    id: string;
    text: string;
    start: number;
    end: number;
}


export const createSentenceTimestamps = (
    alignment: ElevenLabsAlignment
): AudioSegment[] => {

    console.log("function start running..")

    const segments: AudioSegment[] = [];

    let text = "";
    let start: number | null = null;

    for (let i = 0; i < alignment.characters.length; i++) {

        const char = alignment.characters[i];

        if (start === null && char?.trim()) {
            start = alignment.characterStartTimesSeconds[i] as number;
        }

        text += char;

        if ([".", "?", "!"].includes(char as string)) {

            segments.push({
                id: `segment_${segments.length + 1}`,
                text: text.trim(),
                start: start ?? 0,
                end: alignment.characterEndTimesSeconds[i] as number
            });

            text = "";
            start = null;
        }
    }

    console.log("function start emd and return response..")

    return segments;
};