import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

export const renderLectureVideo = async () => {
    console.log("start generating..")
    //   const inputProps = {
    //     scenes: [],
    //     audioSegments: [],
    //   };

    const serveUrl = await bundle({
        entryPoint: "./src/index.ts",
    });

    const composition = await selectComposition({
        serveUrl,
        id: "LectureVideo",
        // inputProps,
    });

    await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: "./out/video.mp4",
        // inputProps,
    });

    console.log("generated")

    return "./out/video.mp4";
};