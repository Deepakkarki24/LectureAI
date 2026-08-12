import { Router } from 'express'
import { upload } from '@/config/multer.config.js'
import { convertTextToVoice } from '@/controllers/voiceController.js'

const router = Router()

router.post('/generate', upload.none(), convertTextToVoice)

export default router
