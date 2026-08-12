import { Router } from 'express'
import { upload } from '@/config/multer.config.js'
import { runPdfExtracter } from '@/controllers/pdfController.js'

const router = Router()

router.post('/extract', upload.single('pdf'), runPdfExtracter)

export default router
