import cloudinary from "@/config/cloudinary.config.js";
import { renderLectureVideo } from "remotion-animation";
import type { Scene } from "remotion-animation";

const parseScenes = (scenes: unknown): Scene[] => {
    if (typeof scenes === "string") {
        const parsed: unknown = JSON.parse(scenes);
        if (!Array.isArray(parsed)) {
            throw new Error("scenes must be a JSON array");
        }
        return parsed as Scene[];
    }

    if (!Array.isArray(scenes)) {
        throw new Error("scenes must be an array");
    }

    return scenes as Scene[];
};

// remotion connector
export const renderVideoAnimation = async (audioUrl: string, scenes: any, lectureId: string) => {
    try {
        console.log("Remotion process started!")
        const parsedScenes = parseScenes(scenes);

        const outputPath = await renderLectureVideo({
            inputProps: {
                scenes: parsedScenes,
                audioUrl,
            },
        });

        console.log("Remotion video generated.");

        console.log("Video uploading to cloud...");
        const result = await cloudinary.uploader.upload(
            outputPath,
            {
                resource_type: "video",
                folder: "lecture-videos",
            }
        );

        if (!result) throw Error('Unable to upload video in Cloudinary!')

        console.log("Video uploaded successfully.");

        const secure_url = result.secure_url

        return secure_url;

    } catch (error) {
        console.error("Video generation error:", error);
    }
}
