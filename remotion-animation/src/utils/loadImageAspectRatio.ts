export const loadImageAspectRatio = async (url: string): Promise<number> => {
    const fallback = 8.5 / 11;
    const ImageCtor = globalThis.Image;

    if (!url || typeof ImageCtor !== "function") {
        return fallback;
    }

    return new Promise((resolve) => {
        const img = new ImageCtor();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            if (!img.naturalWidth || !img.naturalHeight) {
                resolve(fallback);
                return;
            }
            resolve(img.naturalWidth / img.naturalHeight);
        };
        img.onerror = () => resolve(fallback);
        img.src = url;
    });
};
