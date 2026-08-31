import type { Request, Response } from "express"
import { errorResponse, successResponse } from "./apiResponse.js"
import cloudinary from "@/config/cloudinary.config.js"
import { Lecture } from "@/models/lecture.model.js"
import { checkAndCombineIfReady } from "./ProcessPdfAnimation.js";

export const heygenWebhook = async (
    req: Request,
    res: Response
) => {
    try {

        console.log(
            "HeyGen webhook:",
            JSON.stringify(req.body, null, 2)
        );

        const event_type = req.body.event_type;

        // Ignore GIF events
        if (event_type !== "avatar_video.success") {
            return successResponse(
                res,
                200,
                "Webhook event ignored"
            );
        }

        const video_id = req.body.event_data?.video_id;
        const video_url = req.body.event_data?.url;

        console.log({
            event_type,
            video_id,
            video_url
        });

        if (!video_id || !video_url) {
            return errorResponse(
                res,
                400,
                "Missing video_id or video_url"
            );
        }

        const lecture = await Lecture.findOne({
            $or: [
                {
                    "video.heygen.intro.videoId": video_id
                },
                {
                    "video.heygen.outro.videoId": video_id
                }
            ]
        });

        if (!lecture) {
            return errorResponse(
                res,
                404,
                "Lecture for this video not found"
            );
        }

        // -----------------------------
        // INTRO
        // -----------------------------

        if (
            lecture.video.heygen.intro.videoId === video_id
        ) {

            const result = await cloudinary.uploader.upload(
                video_url,
                {
                    resource_type: "video",
                    folder: "lectures"
                }
            );

            await lecture.updateOne({
                $set: {
                    "video.heygen.intro.status": "completed",
                    "video.heygen.intro.url":
                        result.secure_url
                }
            });
        }

        // -----------------------------
        // OUTRO
        // -----------------------------

        else if (
            lecture.video.heygen.outro.videoId === video_id
        ) {

            const result = await cloudinary.uploader.upload(
                video_url,
                {
                    resource_type: "video",
                    folder: "lectures"
                }
            );

            await lecture.updateOne({
                $set: {
                    "video.heygen.outro.status": "completed",
                    "video.heygen.outro.url":
                        result.secure_url
                }
            });
        }

        // Check if Remotion + intro + outro are ready
        await checkAndCombineIfReady(
            lecture._id.toString()
        );

        return successResponse(
            res,
            200,
            "HeyGen webhook processed successfully"
        );

    } catch (error) {

        console.error(
            "HeyGen webhook error:",
            error
        );

        return errorResponse(
            res,
            500,
            "HeyGen webhook error!"
        );
    }
};