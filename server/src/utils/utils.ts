export const sanitizeFileName = (fileName: string): string => {
    return fileName
        .replace(/\.[^/.]+$/, "") // remove extension
        .trim()
        .replace(/\s+/g, "_")     // spaces → _
        .replace(/[^a-zA-Z0-9_-]/g, ""); // remove special characters
};

export const cleanTextForTTS = (text: string): string => {
    return text
        // Convert literal escaped newlines into spaces
        .replace(/\\n+/g, " ")

        // Convert actual newlines into spaces
        .replace(/\r?\n+/g, " ")

        // Remove excessive whitespace
        .replace(/\s+/g, " ")

        .trim();
};