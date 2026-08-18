import type { Request, Response } from "express"
import { errorResponse, successResponse } from "./apiResponse.js"
import cloudinary from "@/config/cloudinary.config.js"

export const heygenWebhook = async (
    req: Request,
    res: Response
) => {
    try {

        console.log("HeyGen webhook:", req.body)

        const {
            callback_id,
            event_type,
            video_id,
            status,
            video_url
        } = req.body

        console.log({
            callback_id,
            event_type,
            video_id,
            status,
            video_url
        })

        let secure_url = null

        if (video_url) {
            const result = await cloudinary.uploader.upload(video_url, {
                resource_type: "video",
                folder: "lectures"
            })

            if (!result) return errorResponse(res, 400, "Error while saving the video")

            secure_url = result.secure_url //this will be store in DB
        }


        // Find lecture using callback_id
        // Update Database with:
        //
        // videoId
        // videoStatus
        // @secure_url

        return successResponse(res, 200, "VideoUrl stored in DB!")

    } catch (error) {

        console.error("HeyGen webhook error:", error)

        return errorResponse(res, 500, "HeyGen webhook error!")
    }
}