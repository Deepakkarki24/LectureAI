import express from 'express'
import cors from 'cors'
import { MONGODB_URI, NODE_ENV, PORT } from '@/config/env.js'
import { connectDatabase, connectMongoDBAtlas } from '@/config/db.js'
import pdfRoutes from "@/routes/pdf.routes.js"
import audioRoutes from "@/routes/audio.routes.js"
import videoRoutes from "@/routes/video.routes.js"
import { heygenWebhook } from './utils/heyGenWebhook.js'

const app = express()
const port = Number(PORT) || 3000

if (NODE_ENV !== 'Production') {
  connectDatabase(MONGODB_URI || '')
} else {
  connectMongoDBAtlas()
}

app.use(
  cors({
    // origin: ['http://localhost:5173', 'http://localhost:5174/'], //local production phase
    origin: "*", //local production phase
    credentials: true,
  }),
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// app.get("/message", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Hello from my local server through ngrok!"
//   });
// });

app.use('/api/pdf', pdfRoutes)
app.use('/api/text-to-speech', audioRoutes)
app.use('/api/video', videoRoutes)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
