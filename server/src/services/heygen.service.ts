import { HEYGEN_API_KEY, HEYGEN_WEBHOOK_URL } from "@/config/env.js"
import axios from "axios"

interface CreateHeyGenVideoParams {
    avatarId: string
    audioUrl: string
}

interface HeyGenResponse {
    data: {
        video_id: string
    }
}

export const createHeyGenVideo = async ({
    avatarId,
    audioUrl,
}: CreateHeyGenVideoParams) => {

    console.log("Video generation starts")

    const response = await axios.post<HeyGenResponse>(
        "https://api.heygen.com/v3/videos",
        {
            type: "avatar",
            avatar_id: avatarId,
            aspect_ratio: "16:9",
            audio_url: audioUrl,
            output_format: "mp4",
            fit: "contain",
            callback_url: HEYGEN_WEBHOOK_URL,
            engine: {
                type: "avatar_iii"
            }
        },
        {
            headers: {
                "X-Api-Key": HEYGEN_API_KEY,
                "Content-Type": "application/json"
            }
        }
    )

    console.log("Video generation end")

    return response.data
}