import { generateVoiceFromText } from "@/runner/runner.js";
import type { Request, Response } from "express";

export const convertTextToVoice = async (
    req: Request,
    res: Response
) => {
    try {
        const { scriptText } = req.body;

        if (!scriptText) {
            return res.status(400).json({
                success: false,
                message: "Script is required to convert into audio!",
            });
        }

        const audio = await generateVoiceFromText(scriptText);

        const arrayBuffer = await new Response(audio).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log("Audio size:", buffer.length);

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Length", buffer.length);

        return res.send(buffer);
    } catch (err: any) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message || "Failed to generate audio",
        });
    }
};