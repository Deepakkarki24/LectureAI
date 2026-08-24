import cloudinary from "@/config/cloudinary.config.js"
import { Lecture } from "@/models/lecture.model.js"
import { combineVideosWithFFmpeg } from "@/services/merge.ffmpeg.js"
import { renderVideoAnimation } from "@/services/renderAnimationVideo.js"
import fs from 'fs'

export const checkAndCombineIfReady = async (lectureId: string) => {
    console.log("Combine function started!")
    const lecture = await Lecture.findById(lectureId)

    if (!lecture) throw Error("Lecture not found!")

    const allReady =
        !!lecture.video.heygen.intro.url &&
        !!lecture.video.heygen.outro.url &&
        !!lecture.video.remotionUrl;

    console.log("already?", allReady)

    if (!allReady) {
        return;
    }

    // Atomically acquire the combining lock
    const lockResult = await Lecture.updateOne(
        {
            _id: lectureId,
            status: { $ne: "combining" }
        },
        {
            $set: { status: "combining" }
        }
    );

    // Another request already acquired the lock
    if (lockResult.modifiedCount === 0) {
        return;
    }

    const intro = lecture?.video.heygen.intro.url as string
    const content = lecture?.video.remotionUrl as string
    const outro = lecture?.video.heygen.outro.url as string

    try {
        const finalVideoPath = await combineVideosWithFFmpeg(intro, content, outro)

        if (!finalVideoPath) throw Error("Error while merging files!")

        const finalUrl = await cloudinary.uploader.upload(
            finalVideoPath,
            {
                resource_type: "video",
                folder: "lecture-videos",
            }
        );

        // Cleanup temp file
        fs.unlink(finalVideoPath, () => { })

        await lecture.updateOne({
            $set: {
                "video.finalUrl": finalUrl.secure_url,
                status: 'completed',
                error: null
            }
        })


    } catch (err) {
        await Lecture.updateOne(
            { _id: lectureId },
            {
                $set: {
                    status: "error",
                    error: String(err)
                }
            }
        );
    }
}

export const processRemotion = async (lectureId: string, audioUrl: string, scenes: any) => {
    try {
        const remotionResponse = await renderVideoAnimation(audioUrl, scenes, lectureId)
        const remotionUrl = remotionResponse

        await Lecture.findByIdAndUpdate(
            lectureId,
            {
                $set: {
                    "video.remotionUrl": remotionUrl,
                }
            }
        )

        console.log("Remotion url stored in db!")

        await checkAndCombineIfReady(lectureId)  // <-- the key function
    } catch (err) {
        await Lecture.findByIdAndUpdate(
            lectureId,
            {
                $set: { status: 'error', error: String(err) }
            }
        )
    }
}