import { generateSceneFromModel, generateVoiceFromText } from "@/runner/runner.js";
import { errorResponse } from "@/utils/apiResponse.js";
import { uploadAudioToCloudinary } from "@/utils/cloudinaryUploader.js";
import { createSentenceTimestamps, type ElevenLabsAlignment } from "@/utils/segment.js";
import { cleanTextForTTS, sanitizeFileName } from "@/utils/utils.js";
import type { Request, Response } from "express";

export const convertTextToVoice = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            intro,
            content,
            outro,
            introEnglish,
            contentEnglish,
            outroEnglish,
            pdfName
        } = req.body;

        if (!contentEnglish) {
            return res.status(400).json({
                success: false,
                message: "Script is required to convert into audio!",
            });
        }

        // hinglish
        const introCleanText = cleanTextForTTS(intro)
        const contentCleanText = cleanTextForTTS(content)
        const outroCleanText = cleanTextForTTS(outro)

        // english
        const introEnglishCleanText = cleanTextForTTS(introEnglish)
        const contentEnglishCleanText = cleanTextForTTS(contentEnglish)
        const outroEnglishCleanText = cleanTextForTTS(outroEnglish)


        const [introAudio, contentAudio, outroAudio, introAudioEnglish, contentAudioEnglish, outroAudioEnglish] = await Promise.all([
            generateVoiceFromText(introCleanText),
            generateVoiceFromText(contentCleanText),
            generateVoiceFromText(outroCleanText),

            generateVoiceFromText(introEnglishCleanText),
            generateVoiceFromText(contentEnglishCleanText, true),
            generateVoiceFromText(outroEnglishCleanText),
        ]);

        if (!introAudio || !contentAudio || !outroAudio || !introAudioEnglish || !contentAudioEnglish || !outroAudioEnglish) {
            return res.status(500).json({
                success: false,
                message: "Error while generating one or more audio files!",
            });
        }

        const reframeAudioSegments = createSentenceTimestamps(contentAudioEnglish.alignment as ElevenLabsAlignment)

        if (!reframeAudioSegments) return errorResponse(res, 400, "Error while reframing segments")

        console.log("start generating scene from audio segment...")

        const sceneModelResponse = await generateSceneFromModel(contentEnglish, reframeAudioSegments)

        console.log("generating scene completed from audio segment!")

        if (!sceneModelResponse) return errorResponse(res, 400, "Error while generating scene from model")

        const { scenes } = sceneModelResponse

        const introBuffer = introAudio.audioBuffer;
        const contentBuffer = contentAudio.audioBuffer;
        const outroBuffer = outroAudio.audioBuffer;

        const introBufferEnglish = introAudioEnglish.audioBuffer;
        const contentBufferEnglish = contentAudioEnglish.audioBuffer;
        const outroBufferEnglish = outroAudioEnglish.audioBuffer;

        console.log("Intro audio size:", introBuffer.length);
        console.log("Content audio size:", contentBuffer.length);
        console.log("Outro audio size:", outroBuffer.length);

        console.log("IntroEnglish audio size:", introBufferEnglish.length);
        console.log("ContentEnglish audio size:", contentBufferEnglish.length);
        console.log("OutroEnglish audio size:", outroBufferEnglish.length);

        // make pdf file name sanitized while removing spaces to store as a assetId in clouds
        const fileName = sanitizeFileName(pdfName)

        // we should combine @intro + @content + @outro audio in one mp3, then store that url in cloud or db

        const [introUpload, contentUpload, outroUpload, introUploadEnglish, contentUploadEnglish, outroUploadEnglish] = await Promise.all([
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

            // English audio uploads

            uploadAudioToCloudinary(
                introBufferEnglish,
                `lectures/${fileName}/intro-eng`
            ),

            uploadAudioToCloudinary(
                contentBufferEnglish,
                `lectures/${fileName}/content-eng`
            ),

            uploadAudioToCloudinary(
                outroBufferEnglish,
                `lectures/${fileName}/outro-eng`
            )
        ]);

        const introUrl = introUpload.secure_url
        const contentUrl = contentUpload.secure_url
        const outroUrl = outroUpload.secure_url

        const introEnglishUrl = introUploadEnglish.secure_url
        const contentEnglishUrl = contentUploadEnglish.secure_url
        const outroEnglishUrl = outroUploadEnglish.secure_url

        /*Note: Store this Url's in the database according to your schema

        save url's according to the lecture ids or name whatever you store in schema*/

        return res.status(200).json({
            success: true,
            message: "Audio generated successfully!",
            audio: {
                introAudioUrl: introUrl,
                contentAudioUrl: contentUrl,
                outroAudioUrl: outroUrl,
                introEnglishAudioUrl: introEnglishUrl,
                contentEnglishAudioUrl: contentEnglishUrl,
                outroEnglishAudioUrl: outroEnglishUrl
            },
            scenes
        });
    } catch (err: any) {
        console.error(err);

        return errorResponse(res, 500, "Failed to generate audio")
    }
};