import { avatar_Id } from "@/config/model.js"
import { createHeyGenVideo } from "@/services/heygen.service.js"
import { errorResponse, successResponse } from "@/utils/apiResponse.js"
import type { Request, Response } from "express"
import { spawn } from "child_process";
import path from "path";
import cloudinary from "@/config/cloudinary.config.js";

export const generateLectureVideo = async (
    req: Request,
    res: Response
) => {
    try {
        const { introAudioEnglishUrl, outroAudioEnglishUrl, lectureId } = req.body

        console.log("Video generate request received!")

        if (!introAudioEnglishUrl || !outroAudioEnglishUrl) {
            return res.status(400).json({
                success: false,
                message: "Audio URL is required"
            })
        }

        const [introVideoId, outroVideoId] = await Promise.all([
            createHeyGenVideo({
                avatarId: avatar_Id,
                audioUrl: introAudioEnglishUrl,
                callbackId: lectureId
            }),

            createHeyGenVideo({
                avatarId: avatar_Id,
                audioUrl: outroAudioEnglishUrl,
                callbackId: lectureId
            })
        ]
        )

        if (!introVideoId || !outroVideoId) return errorResponse(res, 400, "Error while generating videos")

        console.log("Video generated!")

        // Store @introVideoId and @outroVideoId in Database, videoId requires to getting the videoUrl once heygen creates video it sends the videoUrl with the help of videoId using webhook

        return res.status(200).json({
            success: true,
            message: "Video generation started",
            introVideoId,
            outroVideoId,
        })

    } catch (error: any) {

        console.error(
            "HeyGen video generation error:",
            error.response?.data || error.message
        )

        return res.status(500).json({
            success: false,
            message: "Failed to generate HeyGen video"
        })
    }
}

export const renderVideo = async (
    req: Request,
    res: Response
) => {
    try {
        const remotionPath = path.resolve(
            process.cwd(),
            "../remotion-animation"
        );

        const outputPath = path.join(
            remotionPath,
            "out",
            "video.mp4"
        );

        const renderProcess = spawn(
            "npx",
            ["tsx", "run-render.ts"],
            {
                cwd: remotionPath,
                shell: true,
            }
        );

        renderProcess.stdout.on("data", (data) => {
            console.log(`[Remotion]: ${data}`);
        });

        renderProcess.stderr.on("data", (data) => {
            console.error(`[Remotion]: ${data}`);
        });

        renderProcess.on("close", async (code) => {
            if (code !== 0) {
                console.error(
                    `Remotion process exited with code ${code}`
                );
                return;
            }

            console.log("Remotion video generated.");

            try {
                const result = await cloudinary.uploader.upload(
                    outputPath,
                    {
                        resource_type: "video",
                        folder: "lecture-videos",
                    }
                );

                if (!result) return errorResponse(res, 499, "Error while uploading the video!")

                const secure_url = result.secure_url

                console.log("Video uploaded successfully.");

                return successResponse(res, 200, secure_url, "Vido rendered successfully.")
            } catch (error) {
                console.error(
                    "Cloudinary upload failed:",
                    error
                );
            }
        });
    } catch (error) {
        console.error("Video generation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to start video generation",
        });
    }
};