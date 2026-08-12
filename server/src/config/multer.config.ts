import multer from 'multer'

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const isPdf =
            file.mimetype === 'application/pdf' ||
            file.originalname.toLowerCase().endsWith('.pdf')

        if (!isPdf) {
            cb(new Error('Only PDF files are allowed.'))
            return
        }

        cb(null, true)
    },
})

export { upload }