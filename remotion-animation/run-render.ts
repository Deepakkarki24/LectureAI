import { renderLectureVideo } from "./render";

renderLectureVideo()
    .then((output) => {
        console.log(`VIDEO_GENERATED:${output}`);
    })
    .catch((error) => {
        console.error("VIDEO_RENDER_FAILED");
        console.error(error);
        process.exit(1);
    });