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