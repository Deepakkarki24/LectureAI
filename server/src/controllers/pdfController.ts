import { generateModelResponse } from "@/runner/runner.js"
import { extractPdfText } from "@/services/pdfExtract.service.js"
import type { Request, Response } from "express"

export const runPdfExtracter = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required.' })
        }

        const content = await extractPdfText(req.file.buffer)
        return res.json({ content })
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Unable to extract PDF content. The file may be corrupted or password-protected.'

        return res.status(400).json({ error: message })
    }
}

export const generateScript = async (req: Request, res: Response) => {
    try {
        const { script } = req.body

        if (!script) return res.status(401).json({ success: false, message: "Script is required!" })

        const modelResponse = await generateModelResponse(script)

        if (!modelResponse) return res.status(503).json({ success: false, message: "AI service is temporarily busy. Please try again." })

        const { data } = modelResponse
        console.log("modelResponse", data)

        return res.status(200).json({ success: true, data: data })


    } catch (err: any) {
        return res.status(400).json({ error: err.message })
    }
}