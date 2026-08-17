import { Router } from 'express'
import { upload } from '@/config/multer.config.js'
import { generateScript, runPdfExtracter } from '@/controllers/pdfController.js'
import { aiLimiter, pdfExtractionLimiter } from '@/middleware/rateLimit.js'

const router = Router()

router.post('/extract', pdfExtractionLimiter, upload.single('pdf'), runPdfExtracter)
router.post('/generate-script', aiLimiter, upload.none(), generateScript)

export default router
