import { avatar_Id } from "@/config/model.js"
import { createHeyGenVideo } from "@/services/heygen.service.js"
import { errorResponse, successResponse } from "@/utils/apiResponse.js"
import type { Request, Response } from "express"
import { Lecture } from "@/models/lecture.model.js";
import { processRemotion } from "@/utils/remotionProcess.js";

export const generateLectureVideo = async (
    req: Request,
    res: Response
) => {
    try {
        const { lectureId } = req.body

        console.log("Video generate request received!")

        if (!lectureId) {
            return res.status(400).json({
                success: false,
                message: "Lecture Id is required"
            })
        }

        const foundLecture = await Lecture.findById(lectureId)

        if (!foundLecture) return errorResponse(res, 404, "Lecture not found!")

        const { introUrl, contentUrl, outroUrl } = foundLecture.audio.english
        const scenes = foundLecture.scenes ?? []
        const pdfAnimationScenes = foundLecture.pdfAnimationScenes ?? []
        const pageImageUrls = foundLecture.pageImageUrls ?? []

        if (!introUrl || !contentUrl || !outroUrl) return errorResponse(res, 400, "Required audio URLs are not available in DB"
        )

        const canRenderPdfAnimation =
            pdfAnimationScenes.length > 0 && pageImageUrls.length > 0
        const canRenderSlides = scenes.length > 0

        if (!canRenderPdfAnimation && !canRenderSlides) {
            return errorResponse(
                res,
                400,
                "No Remotion scene plan found. Generate audio/scenes first."
            )
        }

        if (canRenderPdfAnimation) {
            for (const scene of pdfAnimationScenes) {
                const pageUrl = pageImageUrls[scene.page - 1]
                if (!pageUrl) {
                    return errorResponse(
                        res,
                        400,
                        `Missing PDF page image for page ${scene.page} (scene ${scene.id})`
                    )
                }
            }
        }


        const [introVideoId, outroVideoId] = await Promise.all([
            createHeyGenVideo({
                avatarId: avatar_Id,
                audioUrl: introUrl,
            }),

            createHeyGenVideo({
                avatarId: avatar_Id,
                audioUrl: outroUrl,
            })
        ]
        )

        if (!introVideoId || !outroVideoId) return errorResponse(res, 400, "Error while generating videos")

        // Save IDs to DB immediately
        await foundLecture.updateOne({
            $set: {
                "video.heygen.intro.videoId": introVideoId.data.video_id,
                "video.heygen.intro.status": "processing",

                "video.heygen.outro.videoId": outroVideoId.data.video_id,
                "video.heygen.outro.status": "processing",

                status: "video_processing"
            }
        });

        // Renders this lecture's PDF page animation (or legacy slides) with Remotion
        processRemotion(lectureId)

        console.log("Video Id generated!")

        return successResponse(
            res,
            200,
            "Video generation started",
            {
                introVideoId,
                outroVideoId
            }
        )

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