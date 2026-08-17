import { Router } from 'express'
import { upload } from '@/config/multer.config.js'
import { convertTextToVoice } from '@/controllers/voiceController.js'
import { aiLimiter } from '@/middleware/rateLimit.js'


const router = Router()

router.post('/generate', aiLimiter, upload.none(), convertTextToVoice)

export default router
