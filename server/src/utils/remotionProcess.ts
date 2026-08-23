import { renderVideoAnimation } from "@/services/renderAnimationVideo.js"

const processRemotion = async (lectureId: string, audioUrl: string, scenes: any) => {
    try {
        const remotionResponse = await renderVideoAnimation(audioUrl, scenes)
        const remotionUrl = remotionResponse

        // await db.lectures.update(lectureId, { remotionUrl })
        // await checkAndCombineIfReady(lectureId)  // <-- the key function
    } catch (err) {
        // await db.lectures.update(lectureId, { status: 'error', error: String(err) })
    }
}