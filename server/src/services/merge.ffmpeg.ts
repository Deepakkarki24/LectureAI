import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const combineVideosWithFFmpeg = async (
    intro: string,
    content: string,
    outro: string
) => {

    const tmpDir = os.tmpdir();

    await fs.promises.mkdir(tmpDir, {
        recursive: true
    });

    const outputPath = path.join(
        tmpDir,
        `final_${Date.now()}.mp4`
    );

    return new Promise<string>((resolve, reject) => {
        ffmpeg()
            .input(intro)
            .input(content)
            .input(outro)
            .complexFilter([
                // Normalize each stream to same resolution + fps
                '[0:v]scale=1920:1080,fps=30,setsar=1[v0]',
                '[1:v]scale=1920:1080,fps=30,setsar=1[v1]',
                '[2:v]scale=1920:1080,fps=30,setsar=1[v2]',
                // Concatenate all three
                '[v0][0:a][v1][1:a][v2][2:a]concat=n=3:v=1:a=1[v][a]'
            ])
            .outputOptions([
                '-map [v]',
                '-map [a]',
                '-c:v libx264',
                '-c:a aac',
                '-movflags +faststart'
            ])
            .output(outputPath)
            .on('start', (cmd) => {
                console.log('FFmpeg started:', cmd)
            })
            .on('progress', (progress) => {
                console.log(`FFmpeg progress: ${progress.percent?.toFixed(1)}%`)
            })
            .on('end', () => {
                console.log('FFmpeg combine complete:', outputPath)
                resolve(outputPath)
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err.message)
                reject(new Error(`FFmpeg failed: ${err.message}`))
            })
            .run()
    })
}