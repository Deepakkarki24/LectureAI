import express from 'express'
import cors from 'cors'
import { MONGODB_URI, NODE_ENV, PORT } from '@/config/env.js'
import { connectDatabase, connectMongoDBAtlas } from '@/config/db.js'
import pdfRoutes from "@/routes/pdf.routes.js"
import audioRoutes from "@/routes/audio.routes.js"

const app = express()
const port = Number(PORT) || 3000

if (NODE_ENV !== 'Production') {
  connectDatabase(MONGODB_URI || '')
} else {
  connectMongoDBAtlas()
}

app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// app.get('/', (_req, res) => {
//   return res.send('Server is working!')
// })

app.use('/api/pdf', pdfRoutes)
app.use('/api/text-to-speech', audioRoutes)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
