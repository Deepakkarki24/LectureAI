import { generateModelResponse, generateModelResponseII } from "@/runner/runner.js"
import { extractPdfText } from "@/services/pdfExtract.service.js"
import { errorResponse, successResponse } from "@/utils/apiResponse.js"
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

        console.log(content)

        if (!content) {
            return errorResponse(
                res,
                400,
                "Error while extracting content, Please try again!"
            )
        }

        return successResponse(res, 200, "Content extracted!", content)
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
        const { content } = req.body

        if (!content) return errorResponse(res, 401, "Script is required!")

        const modelResponse = await generateModelResponse(content)
        const modelResponseII = await generateModelResponseII(content)

        console.log("modelResponse:", modelResponse)
        console.log("modelResponseII:", modelResponseII)

        if (!modelResponse || !modelResponseII) {
            return errorResponse(
                res,
                503,
                "AI service is temporarily busy. Please try again."
            )
        }

        const { script } = modelResponse
        const scriptEnglish = modelResponseII.script

        console.log("modelResponse", script, scriptEnglish)

        return successResponse(res, 200, "Script generated!", { script, scriptEnglish })
    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
}