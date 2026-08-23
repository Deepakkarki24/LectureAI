import { avatar_Id } from "@/config/model.js"
import { createHeyGenVideo } from "@/services/heygen.service.js"
import { errorResponse, successResponse } from "@/utils/apiResponse.js"
import type { Request, Response } from "express"
import { renderVideoAnimation } from "@/services/renderAnimationVideo.js";

export const generateLectureVideo = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            introAudioEnglishUrl,
            contentAudioEnglishUrl,
            outroAudioEnglishUrl,
            scenes,
            lectureId
        } = req.body

        console.log("Video generate request received!")

        if (!introAudioEnglishUrl
            || !contentAudioEnglishUrl
            || !outroAudioEnglishUrl
            || !scenes
            || !lectureId
        ) {
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

        // Store @introVideoId and @outroVideoId in Database, videoId requires to getting the videoUrl once heygen creates video it sends the videoUrl with the help of videoId using webhook
        
        // Save IDs to DB immediately
        // await db.lectures.update(lectureId, {
        //     introVideoId,
        //     outroVideoId,
        //     status: 'processing'
        // })

        // Generates animation from pdf content with remotion
        const remotionResponse = await renderVideoAnimation(contentAudioEnglishUrl, scenes)

        if (!remotionResponse) return errorResponse(res, 402, "Error while render video from remotion")

        console.log("Video Id generated!")

        return res.status(200).json({
            success: true,
            message: "Video generation started",
            introVideoId,
            outroVideoId,
            remotionResponse
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

// export const renderVideo = async (
//     req: Request,
//     res: Response
// ) => {
//     try {
//         const { audioUrl } = req.body ?? {};

//         const scenes = JSON.parse(req.body.scenes)

//         console.log("scenes:", scenes);
//         console.log("isArray:", Array.isArray(scenes));

//         const outputPath = await renderLectureVideo(
//             scenes || audioUrl
//                 ? {
//                     inputProps: {
//                         ...(scenes ? { scenes } : {}),
//                         ...(audioUrl ? { audioUrl } : {}),
//                     },
//                 }
//                 : {},
//         );

//         console.log("Remotion video generated.");

//         const result = await cloudinary.uploader.upload(
//             outputPath,
//             {
//                 resource_type: "video",
//                 folder: "lecture-videos",
//             }
//         );

//         if (!result) return errorResponse(res, 499, "Error while uploading the video!")

//         const secure_url = result.secure_url

//         console.log("Video uploaded successfully.");

//         return successResponse(res, 200, secure_url, "Vido rendered successfully.")
//     } catch (error) {
//         console.error("Video generation error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to start video generation",
//         });
//     }
// };