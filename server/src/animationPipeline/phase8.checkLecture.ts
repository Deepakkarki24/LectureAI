import { Lecture } from "@/models/lecture.model.js";
import { MONGODB_URI } from "@/config/env.js";
import { connectDatabase } from "@/config/db.js";

const lectureId = process.argv[2];
if (!lectureId) {
    console.error("Usage: tsx phase8.checkLecture.ts <lectureId>");
    process.exit(1);
}

await connectDatabase(MONGODB_URI || "");
const lecture = await Lecture.findById(lectureId);
if (!lecture) {
    console.error("Lecture not found");
    process.exit(1);
}

console.log(
    JSON.stringify(
        {
            lectureId: lecture._id.toString(),
            status: lecture.status,
            pdfName: lecture.pdfName,
            pageImageCount: lecture.pageImageUrls?.length ?? 0,
            pageImageUrls: lecture.pageImageUrls,
            pdfAnimationSceneCount: lecture.pdfAnimationScenes?.length ?? 0,
            slideSceneCount: lecture.scenes?.length ?? 0,
            hasContentAudio: Boolean(lecture.audio.english.contentUrl),
            remotionUrl: lecture.video.remotionUrl,
            finalUrl: lecture.video.finalUrl,
            error: lecture.error,
            heygenIntro: lecture.video.heygen.intro.status,
            heygenOutro: lecture.video.heygen.outro.status,
        },
        null,
        2
    )
);

process.exit(0);
