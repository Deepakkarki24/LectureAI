import { Lecture } from "@/models/lecture.model.js";
import { generatePdfAnimationSceneFromModel } from "@/runner/generatePdfAnimationScene.js";
import { generateSceneFromModel, generateVoiceFromText } from "@/runner/runner.js";
import { parsePdfPagesFromExtractedContent, type PdfPageLayout } from "@/services/pdfExtract.service.js";
import { resolvePdfSceneCoordinates, type RawScene } from "@/services/pdfLayout/resolvePdfSceneCoordinates.js";
import { errorResponse } from "@/utils/apiResponse.js";
import { uploadAudioToCloudinary } from "@/utils/cloudinaryUploader.js";
import { createSentenceTimestamps, type ElevenLabsAlignment } from "@/utils/segment.js";
import { cleanTextForTTS, sanitizeFileName } from "@/utils/utils.js";
import type { Request, Response } from "express";
import pLimit from "p-limit";

export const convertTextToVoice = async (
    req: Request,
    res: Response
) => {
    try {
        const { lectureId } = req.body;

        if (!lectureId) {
            return res.status(400).json({
                success: false,
                message: "Lecture Id is required!",
            });
        }

        const foundLecture = await Lecture.findById(lectureId)

        if (!foundLecture) return errorResponse(res, 401, "Lecture not found!")

        const { hinglish, english } = foundLecture.script
        const { pdfName } = foundLecture

        // hinglish
        const introCleanText = cleanTextForTTS(hinglish.intro)
        const contentCleanText = cleanTextForTTS(hinglish.content)
        const outroCleanText = cleanTextForTTS(hinglish.outro)

        const fullCleanHinglishText = [
            introCleanText,
            contentCleanText,
            outroCleanText
        ].join(" ");


        // english
        const introEnglishCleanText = cleanTextForTTS(english.intro)
        const contentEnglishCleanText = cleanTextForTTS(english.content)
        const outroEnglishCleanText = cleanTextForTTS(english.outro)

        // limit the concurrent taks
        const limit = pLimit(3)

        const [
            hinglishAudio,
            introAudioEnglish,
            contentAudioEnglish,
            outroAudioEnglish
        ] = await Promise.all([
            limit(() => generateVoiceFromText(fullCleanHinglishText, false, true)),

            limit(() => generateVoiceFromText(introEnglishCleanText)),
            limit(() => generateVoiceFromText(contentEnglishCleanText, true, false)),
            limit(() => generateVoiceFromText(outroEnglishCleanText)),
        ]);


        if (!hinglishAudio || !introAudioEnglish || !contentAudioEnglish || !outroAudioEnglish) {
            return res.status(500).json({
                success: false,
                message: "Error while generating one or more audio files!",
            });
        }

        const reframeAudioSegments = createSentenceTimestamps(contentAudioEnglish.alignment as ElevenLabsAlignment)

        if (!reframeAudioSegments) return errorResponse(res, 400, "Error while reframing segments")

        console.log("start generating scene from audio segment...")

        const pdfLayout = foundLecture.pdfLayout as PdfPageLayout[]

        if (!pdfLayout || pdfLayout.length === 0) {
            return errorResponse(res, 400, "PDF layout not found. Re-upload the PDF.")
        }

        const [sceneModelResponse, rawPdfAnimationSceneResponse] = await Promise.all([
            generateSceneFromModel(english.content, reframeAudioSegments),
            generatePdfAnimationSceneFromModel(english.content, reframeAudioSegments, pdfLayout),
        ])

        console.log("generating scene completed from audio segment!")

        if (!sceneModelResponse) return errorResponse(res, 400, "Error while generating scene from model")

        const { scenes } = sceneModelResponse

        if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
            return errorResponse(res, 400, "Error while generating scene from model")
        }

        if (
            !rawPdfAnimationSceneResponse?.success ||
            !rawPdfAnimationSceneResponse?.scenes ||
            rawPdfAnimationSceneResponse.scenes.length === 0
        ) {
            return errorResponse(
                res,
                400,
                rawPdfAnimationSceneResponse?.err || "Error while generating PDF animation scene plan"
            )
        }

        const pdfAnimationScenes = resolvePdfSceneCoordinates(
            rawPdfAnimationSceneResponse.scenes as RawScene[],
            pdfLayout
        )

        const hinglishBuffer = hinglishAudio.audioBuffer;

        const introBufferEnglish = introAudioEnglish.audioBuffer;
        const contentBufferEnglish = contentAudioEnglish.audioBuffer;
        const outroBufferEnglish = outroAudioEnglish.audioBuffer;

        console.log("hinglish audio size:", hinglishBuffer.length);

        console.log("IntroEnglish audio size:", introBufferEnglish.length);
        console.log("ContentEnglish audio size:", contentBufferEnglish.length);
        console.log("OutroEnglish audio size:", outroBufferEnglish.length);

        // make pdf file name sanitized while removing spaces to store as a assetId in clouds
        const fileName = sanitizeFileName(pdfName)

        const [hinglishAudioUpload, introUploadEnglish, contentUploadEnglish, outroUploadEnglish] = await Promise.all([

            // Hinglish audio upload
            uploadAudioToCloudinary(
                hinglishBuffer,
                `lectures/${fileName}/HinglishAudio`
            ),

            // Hinglish audio uploads
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

        const hinglishAudioUrl = hinglishAudioUpload.secure_url

        const introEnglishUrl = introUploadEnglish.secure_url
        const contentEnglishUrl = contentUploadEnglish.secure_url
        const outroEnglishUrl = outroUploadEnglish.secure_url

        /*Note: Store this Url's in the database according to your schema
        save url's according to the lecture ids or name whatever you store in schema*/

        await Lecture.findByIdAndUpdate(
            lectureId,
            {
                $set: {
                    scenes,
                    pdfAnimationScenes,
                    audio: {
                        hinglish: {
                            finalUrl: hinglishAudioUrl
                        },

                        english: {
                            introUrl: introEnglishUrl,
                            contentUrl: contentEnglishUrl,
                            outroUrl: outroEnglishUrl,
                        }
                    },
                    status: 'audio_generated'

                }
            }
        )

        console.log("Audio files uploaded on cloud and secureUrl stored in DB!")

        return res.status(200).json({
            success: true,
            message: "Audio generated successfully!",
            audio: {
                introEnglishAudioUrl: introEnglishUrl,
                contentEnglishAudioUrl: contentEnglishUrl,
                outroEnglishAudioUrl: outroEnglishUrl,
                hinglishAudioUrl: hinglishAudioUrl
            },
            scenes,
            pdfAnimationScenes
        });
    } catch (err: any) {
        console.error(err);

        return errorResponse(res, 500, "Failed to generate audio")
    }
};