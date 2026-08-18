import { generateVoiceFromText } from "@/runner/runner.js";
import { errorResponse } from "@/utils/apiResponse.js";
import { uploadAudioToCloudinary } from "@/utils/cloudinaryUploader.js";
import { sanitizeFileName } from "@/utils/utils.js";
import type { Request, Response } from "express";

export const convertTextToVoice = async (
    req: Request,
    res: Response
) => {
    try {
        const { intro, content, outro, pdfName } = req.body;

        if (!intro || !content || !outro) {
            return res.status(400).json({
                success: false,
                message: "Script is required to convert into audio!",
            });
        }

        const [introAudio, contentAudio, outroAudio] = await Promise.all([
            generateVoiceFromText(intro),
            generateVoiceFromText(content),
            generateVoiceFromText(outro),
        ]);

        if (!introAudio || !contentAudio || !outroAudio) {
            return res.status(500).json({
                success: false,
                message: "Error while generating one or more audio files!",
            });
        }

        // Convert all audio responses to buffers
        const [
            introArrayBuffer,
            contentArrayBuffer,
            outroArrayBuffer,
        ] = await Promise.all([
            new Response(introAudio).arrayBuffer(),
            new Response(contentAudio).arrayBuffer(),
            new Response(outroAudio).arrayBuffer(),
        ]);

        const introBuffer = Buffer.from(introArrayBuffer);
        const contentBuffer = Buffer.from(contentArrayBuffer);
        const outroBuffer = Buffer.from(outroArrayBuffer);

        console.log("Intro audio size:", introBuffer.length);
        console.log("Content audio size:", contentBuffer.length);
        console.log("Outro audio size:", outroBuffer.length);

        // make file name sanitized while removing spaces to store as a assetId in clouds
        const fileName = sanitizeFileName(pdfName)

        const [introUpload, contentUpload, outroUpload] = await Promise.all([
            uploadAudioToCloudinary(
                introBuffer,
                `lectures/${fileName}/intro`
            ),

            uploadAudioToCloudinary(
                contentBuffer,
                `lectures/${fileName}/content`
            ),

            uploadAudioToCloudinary(
                outroBuffer,
                `lectures/${fileName}/outro`
            ),
        ]);

        const introUrl = introUpload.secure_url
        const contentUrl = contentUpload.secure_url
        const outroUrl = outroUpload.secure_url

        /*Note: Store this Url's in the database according to your schema
        
        save url's according to the lecture ids or name whatever you store in schema*/

        return res.status(200).json({
            success: true,
            message: "Audio generated successfully!",
            audio: {
                introAudioUrl: introUrl,
                contentAudioUrl: contentUrl,
                outroAudioUrl: outroUrl,
            },
        });
    } catch (err: any) {
        console.error(err);

        return errorResponse(res, 500, "Failed to generate audio")
    }
};