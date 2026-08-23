import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const combineAudioProduction = async (
    introBuffer: Buffer,
    contentBuffer: Buffer,
    outroBuffer: Buffer
) => {
    // Write buffers to temp files (ffmpeg needs seekable input for MP3)
    const tmpDir = os.tmpdir();
    const tmpFiles = ["intro", "content", "outro"].map((name) =>
        path.join(tmpDir, `${name}-${Date.now()}.mp3`)
    );

    await Promise.all([
        fs.promises.writeFile(tmpFiles[0] as string, introBuffer),
        fs.promises.writeFile(tmpFiles[1] as string, contentBuffer),
        fs.promises.writeFile(tmpFiles[2] as string, outroBuffer),
    ]);

    const outputPath = path.join(tmpDir, `final-${Date.now()}.mp3`);

    // Concat with ffmpeg (handles VBR headers, ID3 tags, resets timestamps)
    await new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input(`concat:${tmpFiles.join("|")}`)
            .audioCodec("copy")           // no re-encoding = no quality loss
            .output(outputPath)
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .run();
    });

    const finalBuffer = await fs.promises.readFile(outputPath);

    // Cleanup temp files
    await Promise.all(
        [...tmpFiles, outputPath].map((f) => fs.promises.unlink(f).catch(() => { }))
    );

    return finalBuffer;
}