export const sanitizeFileName = (fileName: string): string => {
    return fileName
        .replace(/\.[^/.]+$/, "") // remove extension
        .trim()
        .replace(/\s+/g, "_")     // spaces → _
        .replace(/[^a-zA-Z0-9_-]/g, ""); // remove special characters
};