import { Lecture } from "@/models/lecture.model.js"
import { generateModelResponse, generateModelResponseII } from "@/runner/runner.js"
import { extractPdfLayout, extractPdfText } from "@/services/pdfExtract.service.js"
import { rasterizePdfPages } from "@/services/pdfPageImage.service.js"
import { errorResponse, successResponse } from "@/utils/apiResponse.js"
import { uploadImageToCloudinary } from "@/utils/cloudinaryUploader.js"
import { sanitizeFileName } from "@/utils/utils.js"
import type { Request, Response } from "express"

// Extract all the content from the uploaded PDF file and return @content
export const runPdfExtracter = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return errorResponse(
                res,
                400,
                "PDF file is required."
            )
        }

        const content = await extractPdfText(req.file.buffer)

        if (!content) {
            return errorResponse(
                res,
                400,
                "Error while extracting content, Please try again!"
            )
        }

        const pdfLayout = await extractPdfLayout(req.file.buffer)

        const pageImages = await rasterizePdfPages(req.file.buffer)

        const fileName = sanitizeFileName(req.file.originalname)

        const lecture = await Lecture.create({
            pdfName: fileName,
            extractedContent: content,
            pdfLayout,
            status: 'extracted'
        })

        const lectureId = lecture._id.toString()

        const pageImageUrls: string[] = []

        try {
            for (const pageImage of pageImages) {
                const uploaded = await uploadImageToCloudinary(
                    pageImage.pngBuffer,
                    `${lectureId}/page-${pageImage.page}`
                )
                pageImageUrls.push(uploaded.secure_url)
            }
        } catch (uploadError) {
            await Lecture.findByIdAndDelete(lectureId)
            throw uploadError
        }

        if (pageImageUrls.length !== pageImages.length) {
            return errorResponse(res, 500, "Failed to store all PDF page images")
        }

        await Lecture.findByIdAndUpdate(lectureId, {
            $set: { pageImageUrls },
        })

        return successResponse(res, 200, "Content extracted!", { content, lectureId })
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Unable to extract PDF content. The file may be corrupted or password-protected.'

        return errorResponse(res, 400, message)
    }
}

/*
 * Generate an AI lecture script from the extracted PDF content.
 *
 * @param content - Text extracted from the uploaded PDF
 * We send the extracted text to the AI model @fn(generateModelResponse) along with system instructions
 * to generate a teacher-style Hinglish explanation. The generated
 * script is then returned to the frontend so the user can review it
 * before converting it into audio.
 */
export const generateScript = async (req: Request, res: Response) => {
    try {
        const { lectureId } = req.body

        if (!lectureId) return errorResponse(res, 401, "Lecture id is required!")

        const lecture = await Lecture.findById(lectureId)

        const modelResponse = await generateModelResponse(lecture?.extractedContent as string)
        const modelResponseII = await generateModelResponseII(lecture?.extractedContent as string)

        console.log("modelResponse:", modelResponse)
        console.log("modelResponseII:", modelResponseII)

        if (!modelResponse?.success || !modelResponseII?.success) {
            return errorResponse(
                res,
                503,
                "AI service is temporarily busy. Please try again."
            )
        }

        const { script } = modelResponse
        const scriptEnglish = modelResponseII.script

        await Lecture.findByIdAndUpdate(
            lectureId,
            {
                $set: {
                    script: {
                        hinglish: {
                            intro: script?.intro,
                            content: script?.content,
                            outro: script?.outro
                        },

                        english: {
                            intro: scriptEnglish?.intro,
                            content: scriptEnglish?.content,
                            outro: scriptEnglish?.outro,
                        },
                    },
                    status: 'script_generated'
                }
            },
            { new: true }
        )

        console.log("modelResponse", script, scriptEnglish)

        return successResponse(res, 200, "Script generated!", { script, scriptEnglish })
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
}