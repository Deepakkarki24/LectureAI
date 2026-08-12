import { Router } from 'express'
import { upload } from '@/config/multer.config.js'
import { generateScript, runPdfExtracter } from '@/controllers/pdfController.js'

const router = Router()

router.post('/extract', upload.single('pdf'), runPdfExtracter)
router.post('/generate-script', upload.none(), generateScript)

export default router
