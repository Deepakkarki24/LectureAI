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

    console.log("Creating sentence timestamps...");

    const segments: AudioSegment[] = [];

    let text = "";
    let start: number | null = null;

    for (
        let i = 0;
        i < alignment.characters.length;
        i++
    ) {

        const char = alignment.characters[i];

        if (!char) {
            continue;
        }

        // Start timestamp at the first non-whitespace character
        if (start === null && char.trim()) {

            const startTime =
                alignment.characterStartTimesSeconds[i];

            if (startTime === undefined) {
                throw new Error(
                    `Missing start timestamp at character index ${i}`
                );
            }

            start = startTime;
        }

        text += char;

        // Sentence completed
        if ([".", "?", "!"].includes(char)) {

            const endTime =
                alignment.characterEndTimesSeconds[i];

            if (endTime === undefined) {
                throw new Error(
                    `Missing end timestamp at character index ${i}`
                );
            }

            if (start === null) {
                throw new Error(
                    `Unable to determine sentence start at index ${i}`
                );
            }

            const sentenceText = text.trim();

            if (sentenceText) {

                segments.push({
                    id: `segment_${segments.length + 1}`,
                    text: sentenceText,
                    start,
                    end: endTime,
                });
            }

            text = "";
            start = null;
        }
    }

    // Handle remaining text if the narration
    // doesn't end with punctuation
    if (text.trim()) {

        const lastIndex =
            alignment.characters.length - 1;

        const endTime =
            alignment.characterEndTimesSeconds[lastIndex];

        if (endTime === undefined) {
            throw new Error(
                "Missing end timestamp for final segment"
            );
        }

        if (start === null) {
            throw new Error(
                "Unable to determine start timestamp for final segment"
            );
        }

        segments.push({
            id: `segment_${segments.length + 1}`,
            text: text.trim(),
            start,
            end: endTime,
        });
    }

    console.log(
        `Created ${segments.length} audio segments`
    );

    return segments;
};