import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadImage } from "@napi-rs/canvas";
import { DEFAULT_PAGE_ASPECT } from "./constants.js";

const extensionFromBuffer = (buffer: Buffer): string => {
    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
    ) {
        return ".png";
    }

    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
        return ".jpg";
    }

    return ".bin";
};

const toLocalPath = (url: string): string | null => {
    if (/^https?:\/\//i.test(url)) {
        return null;
    }

    if (url.startsWith("file:")) {
        return fileURLToPath(url);
    }

    return url;
};

const downloadBuffer = async (url: string): Promise<Buffer> => {
    const localPath = toLocalPath(url);
    if (localPath) {
        return fs.readFile(localPath);
    }

    const response = await axios.get<ArrayBuffer>(url, {
        responseType: "arraybuffer",
        timeout: 120_000,
    });
    return Buffer.from(response.data);
};

export type DownloadedPage = {
    url: string;
    filePath: string;
    aspectRatio: number;
};

export const downloadPageImages = async (
    urls: string[],
    tempDir: string
): Promise<Map<string, DownloadedPage>> => {
    const unique = [...new Set(urls.filter(Boolean))];
    const result = new Map<string, DownloadedPage>();

    await Promise.all(
        unique.map(async (url, index) => {
            const buffer = await downloadBuffer(url);
            const filePath = path.join(
                tempDir,
                `page-${index}${extensionFromBuffer(buffer)}`
            );
            await fs.writeFile(filePath, buffer);

            let aspectRatio = DEFAULT_PAGE_ASPECT;
            try {
                const image = await loadImage(buffer);
                if (image.width > 0 && image.height > 0) {
                    aspectRatio = image.width / image.height;
                }
            } catch {
                aspectRatio = DEFAULT_PAGE_ASPECT;
            }

            result.set(url, { url, filePath, aspectRatio });
        })
    );

    return result;
};

export const downloadAudio = async (
    url: string,
    tempDir: string
): Promise<string> => {
    const buffer = await downloadBuffer(url);
    const ext = extensionFromBuffer(buffer);
    const filePath = path.join(
        tempDir,
        `narration${ext === ".bin" ? ".mp3" : ext}`
    );
    await fs.writeFile(filePath, buffer);
    return filePath;
};
