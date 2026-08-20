import { upload } from "@/config/multer.config.js";
import { generateLectureVideo, renderVideo } from "@/controllers/videoController.js";
import { aiLimiter } from "@/middleware/rateLimit.js";
import { Router } from "express";

const router = Router()

router.post("/create", aiLimiter, upload.none(), generateLectureVideo)
router.post("/render", upload.none(), renderVideo)

export default router