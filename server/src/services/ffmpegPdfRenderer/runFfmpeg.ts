import { spawn } from "node:child_process";

export const runFfmpeg = (args: string[]): Promise<void> =>
    new Promise((resolve, reject) => {
        const proc = spawn(
            "ffmpeg",
            ["-hide_banner", "-y", ...args],
            { windowsHide: true }
        );

        let stderr = "";

        proc.stderr.on("data", (chunk: Buffer | string) => {
            stderr += chunk.toString();
        });

        proc.on("error", (error) => {
            reject(
                new Error(
                    `ffmpeg failed to start: ${error.message}. Ensure ffmpeg is on PATH.`
                )
            );
        });

        proc.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(
                new Error(
                    `ffmpeg exited with code ${code}: ${stderr.slice(-4000)}`
                )
            );
        });
    });
