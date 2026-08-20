import { avatar_Id } from "@/config/model.js"
import { createHeyGenVideo } from "@/services/heygen.service.js"
import { errorResponse } from "@/utils/apiResponse.js"
import type { Request, Response } from "express"

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