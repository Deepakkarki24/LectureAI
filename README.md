# Lecture AI

Turn PDF study material into a spoken lecture and, on the backend, into a full teaching video.

Upload a PDF, preview it in the browser, extract the text on the server, generate teacher-style **Hinglish** and **English** scripts with Google Gemini, convert them to speech with ElevenLabs, then assemble an **intro (HeyGen avatar) + content (Remotion animation) + outro (HeyGen avatar)** video stored on Cloudinary.

## What it does

```
Upload PDF → Preview → Extract text → Generate scripts → TTS + scene plan → Lecture video
 (client)    (client)    (server)        (Gemini)        (ElevenLabs)      (HeyGen + Remotion + FFmpeg)
                              ↓
                         MongoDB lecture record
```

1. **Upload & preview** — Drag and drop a PDF. The app checks file type, size, and page count, then shows a page-by-page preview.
2. **Extract content** — The PDF is sent to the backend. Text is pulled from each page and a `Lecture` document is created in MongoDB.
3. **Generate scripts** — Gemini produces two speech-ready lecture scripts from the extracted text:
   - **Hinglish** (Roman Hindi mixed with English) for listening
   - **English** (simple Indian English) for video narration
   Each script has `intro`, `content`, and `outro`.
4. **Text to speech** — ElevenLabs turns those scripts into MP3s. English **content** audio includes character timestamps so Gemini can plan timed Remotion scenes. Audio files are uploaded to Cloudinary.
5. **Lecture video** (API) — HeyGen generates avatar clips for intro and outro. Remotion renders animated slides for the content. When all three clips are ready, FFmpeg concatenates them into one 1920×1080 MP4.

The **frontend dashboard** currently covers steps 1–4 (upload, extract, script, voice). Video generation is started with `POST /api/video/create` once audio exists on the lecture record.

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, react-pdf, pdfjs-dist |
| Backend | Node.js, Express 5, TypeScript, Multer, Mongoose, pdfjs-dist, Zod |
| AI | Google Gemini (`gemini-2.5-flash`), ElevenLabs TTS (`eleven_multilingual_v2`) |
| Video | HeyGen Avatar III, Remotion 4, FFmpeg (`fluent-ffmpeg`) |
| Storage | MongoDB, Cloudinary |
| Rate limiting | `express-rate-limit` |

OpenAI (`gpt-5-mini`) is wired in `server/src/config/modelAi.config.ts` but the live script and scene pipeline uses **Gemini**.

## Project structure

```
lectureAi/
├── client/                      # React + Vite dashboard
│   ├── src/
│   │   ├── components/          # Uploader, viewer, extracted text, script editor
│   │   ├── pages/Dashboard.tsx  # Main workflow UI
│   │   ├── services/api.ts      # Backend HTTP client
│   │   └── lib/pdfConfig.ts     # PDF worker + client-side validation
│   └── package.json
│
├── server/                      # Express API
│   ├── src/
│   │   ├── index.ts             # App entry, CORS, route mount, DB connect
│   │   ├── controllers/         # PDF, voice, video handlers
│   │   ├── routes/              # /api/pdf, /api/text-to-speech, /api/video
│   │   ├── models/              # Lecture mongoose schema
│   │   ├── services/            # PDF extract, HeyGen, Remotion, FFmpeg merge
│   │   ├── runner/              # Gemini + ElevenLabs orchestration
│   │   ├── validators/          # Zod scene-plan schema
│   │   ├── middleware/          # Rate limiters
│   │   ├── config/              # Env, DB, Multer, AI, Cloudinary
│   │   └── utils/               # Responses, Cloudinary upload, HeyGen webhook
│   └── package.json
│
├── remotion-animation/          # Local Remotion package (linked from the server)
│   ├── src/                     # Scene components (concept, definition, …)
│   └── render.ts                # Programmatic renderLectureVideo() API
│
└── README.md
```

## Pipeline and lecture status

Each upload becomes a MongoDB `lectures` document. Status moves through:

| Status | Meaning |
|--------|---------|
| `draft` | Default empty record |
| `extracted` | PDF text saved |
| `script_generated` | Hinglish + English scripts saved |
| `audio_generated` | Cloudinary audio URLs + Remotion scene plan saved |
| `video_processing` | HeyGen jobs started; Remotion render in progress |
| `combining` | Intro, Remotion, and outro are all ready; FFmpeg is merging |
| `completed` | Final MP4 URL stored on `video.finalUrl` |
| `error` | Failure message stored on `error` |

```
extractedContent
      ↓
script.hinglish / script.english   (intro, content, outro)
      ↓
audio.hinglish.finalUrl
audio.english.{introUrl, contentUrl, outroUrl}
scenes[]                            (timed Remotion slides)
      ↓
video.heygen.intro / outro          (videoId, status, url)
video.remotionUrl
video.finalUrl
```

HeyGen callbacks identify clips by **HeyGen `video_id`**, not by lecture id alone, because intro and outro share the same lecture.

## Prerequisites

- **Node.js** 20+ (recommended)
- **npm**
- **MongoDB** (local or Atlas) — required; the server connects on startup
- **FFmpeg** on the PATH — required to merge intro + animation + outro
- A Chromium/Chrome-capable environment for Remotion (`ensureBrowser`)
- API / cloud accounts:
  - [Google AI Studio](https://aistudio.google.com/) — Gemini
  - [ElevenLabs](https://elevenlabs.io/) — TTS
  - [HeyGen](https://www.heygen.com/) — avatar intro/outro
  - [Cloudinary](https://cloudinary.com/) — audio and video hosting
  - A public **HeyGen webhook URL** (for example ngrok in local development) pointing at `POST /api/video/webhook/heygen`

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Deepakkarki24/LectureAI.git
cd lectureAi
```

### 2. Set up the Remotion package

The server depends on this package via `"remotion-animation": "file:../remotion-animation"`.

```bash
cd remotion-animation
npm install
npm run build:node
cd ..
```

Optional: preview compositions in Remotion Studio:

```bash
cd remotion-animation
npm start
```

### 3. Set up the server

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3000
NODE_ENV=development

# Required
MONGODB_URI=mongodb://localhost:27017/lectureai
GOOGLE_API_KEY=your_google_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
HEYGEN_API_KEY=your_heygen_api_key
HEYGEN_WEBHOOK_URL=https://your-public-host/api/video/webhook/heygen
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret

# Optional
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:5173

# Production Atlas (used when NODE_ENV=Production)
MONGODB_USERNAME=
MONGODB_PASSWORD=
```

Start the API:

```bash
npm run dev
```

The API listens at **http://localhost:3000**.

When `NODE_ENV` is `Production`, the server uses MongoDB Atlas (`connectMongoDBAtlas`) instead of `MONGODB_URI`.

### 4. Set up the client

```bash
cd client
npm install
```

Optional `client/.env` if the API is not on port 3000:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

## How to use the dashboard

1. Open the frontend.
2. Upload a PDF (max **20 MB**, max **8 pages**).
3. Confirm the page-by-page preview.
4. Click **Extract PDF Content**. The server stores text and returns a `lectureId`.
5. Click **Generate AI Script**. Gemini writes intro / content / outro (Hinglish is shown in the editor).
6. Review or edit the three fields.
7. Click **Convert Script to Voice**. The backend generates Hinglish + English audio, a scene plan, and Cloudinary URLs.

To start the video pipeline for that lecture (HeyGen + Remotion + merge), call `POST /api/video/create` with the same `lectureId` after audio has been generated.

## API reference

Base URL: `http://localhost:3000` (or `VITE_API_URL`).

JSON success shape from most handlers:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

JSON error shape:

```json
{
  "success": false,
  "message": "...",
  "error": null
}
```

### Extract PDF text

```http
POST /api/pdf/extract
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| `pdf` | File | PDF to extract |

Rate limit: **20 requests / 15 minutes**.

**Success (200)** — `data`:

```json
{
  "content": "--- Page 1 ---\n\nExtracted text...",
  "lectureId": "665f..."
}
```

Creates a `Lecture` with `status: "extracted"`.

---

### Generate AI scripts

```http
POST /api/pdf/generate-script
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| `lectureId` | string | ID from extract |

Rate limit: **10 requests / hour**.

Loads `extractedContent` from MongoDB, calls Gemini twice (Hinglish + English), and stores both scripts.

**Success (200)** — `data`:

```json
{
  "script": {
    "intro": "...",
    "content": "...",
    "outro": "..."
  },
  "scriptEnglish": {
    "intro": "...",
    "content": "...",
    "outro": "..."
  }
}
```

Sets `status: "script_generated"`.

---

### Convert scripts to speech (and scene plan)

```http
POST /api/text-to-speech/generate
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| `lectureId` | string | Lecture that already has scripts |

Rate limit: **10 requests / hour**.

What the server does:

1. Cleans Hinglish intro + content + outro and synthesizes **one** Hinglish MP3 (`vidhiVoiceOver`).
2. Synthesizes English intro, content, and outro separately (`ritikaVoiceOver`). Content is generated **with timestamps**.
3. Builds sentence-level segments from ElevenLabs alignment.
4. Asks Gemini for a validated Remotion **scene plan** (Zod + timing checks).
5. Uploads MP3s to Cloudinary under `audio/lectures/<pdfName>/...`.

**Success (200)**

```json
{
  "success": true,
  "message": "Audio generated successfully!",
  "audio": {
    "introEnglishAudioUrl": "https://...",
    "contentEnglishAudioUrl": "https://...",
    "outroEnglishAudioUrl": "https://...",
    "hinglishAudioUrl": "https://..."
  },
  "scenes": []
}
```

Sets `status: "audio_generated"`.

---

### Start lecture video generation

```http
POST /api/video/create
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| `lectureId` | string | Lecture with English audio URLs and `scenes` |

Rate limit: **10 requests / hour**.

Requires `audio.english.introUrl`, `contentUrl`, `outroUrl`, and `scenes` in the database.

- Starts two HeyGen avatar jobs (intro + outro audio URLs, 16:9 MP4, Avatar III).
- Starts Remotion render of the content track (scenes + English content audio), then uploads the MP4 to Cloudinary.
- Returns immediately with HeyGen video ids; the rest finishes asynchronously.

**Success (200)** — `data` includes HeyGen `introVideoId` and `outroVideoId`. Sets `status: "video_processing"`.

---

### HeyGen webhook

```http
POST /api/video/webhook/heygen
Content-Type: application/json
```

Configure this URL in `HEYGEN_WEBHOOK_URL`.

On `avatar_video.success`, the handler:

1. Finds the lecture by intro or outro `videoId`.
2. Re-uploads the HeyGen MP4 to Cloudinary (`lectures/`).
3. Marks that clip `completed`.
4. If intro URL, outro URL, **and** `remotionUrl` are all present, concatenates them with FFmpeg and stores `video.finalUrl`.

Other event types are ignored with HTTP 200.

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3000`) |
| `NODE_ENV` | No | `development` uses `MONGODB_URI`. `Production` uses Atlas username/password |
| `MONGODB_URI` | Yes* | Local / custom MongoDB URI |
| `MONGODB_USERNAME` | Production | Atlas username |
| `MONGODB_PASSWORD` | Production | Atlas password |
| `GOOGLE_API_KEY` | Yes | Gemini script and scene generation |
| `ELEVENLABS_API_KEY` | Yes | TTS |
| `HEYGEN_API_KEY` | Yes | Avatar video jobs |
| `HEYGEN_WEBHOOK_URL` | Yes | Public webhook for completed HeyGen videos |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary key |
| `CLOUDINARY_SECRET_KEY` | Yes | Cloudinary secret |
| `OPENAI_API_KEY` | No | Present for optional OpenAI helper; not used by the current runner |
| `CLIENT_URL` | No | Frontend origin (CORS currently allows `*`) |

\*Required unless `NODE_ENV=Production` and Atlas credentials are set.

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend URL (default `http://localhost:3000`) |

## Available scripts

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run `node dist/index.js` |

### Client (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

### Remotion (`remotion-animation/`)

| Command | Description |
|---------|-------------|
| `npm start` | Remotion Studio |
| `npm run build:node` | Compile the Node render API (`prepare` also runs this) |
| `npm run render` | CLI helper (`tsx run-render.ts`) |
| `npm run build` | `remotion render LectureVideo` |

## PDF rules

Enforced on the client (`client/src/lib/pdfConfig.ts`) and server (`pdfExtract.service.ts` + Multer):

- **Type:** PDF only
- **Max size:** 20 MB
- **Max pages:** 8

The frontend **previews** with `react-pdf`. **Text extraction** always runs on the server with `pdfjs-dist` (legacy build). `pdfjs-dist@5.4.296` is pinned to match `react-pdf@10.4.1`.

Scanned / image-only PDFs often extract poorly because there is no OCR step.

## Video architecture

| Piece | Role |
|-------|------|
| **ElevenLabs** | Hinglish listen track + English intro/content/outro. Content uses `convertWithTimestamps` so scenes can follow speech. |
| **Gemini scene planner** | Maps English narration + alignment segments to a Zod-validated scene list. |
| **Remotion** | 1920×1080, 30 fps composition `LectureVideo`. Implemented scene UIs include concept, definition, bullet points, comparison, process, and question. |
| **HeyGen** | Talking-head intro and outro from English audio URLs. Avatar id lives in `server/src/config/model.ts`. |
| **FFmpeg** | Scales all three clips to 1920×1080 @ 30 fps and concatenates video + audio. |
| **Cloudinary** | MP3s (`audio/`) and MP4s (`lectures/`, `lecture-videos/`). |

Remotion scene types in the renderer (`remotion-animation/src/types/scene.ts`):

`concept`, `definition`, `bulletPoints`, `comparison`, `process`, `question`

The MongoDB / Zod schema also allows additional types (for example `title`, `timeline`, `summary`). Those are accepted on the lecture document; the Remotion package currently renders the types listed above.

## Architecture notes

- **Frontend** — Upload UI, PDF preview, extracted-text display, script editor, and API calls. No server-side PDF parsing in the browser.
- **Backend** — Extraction, persistence, Gemini, TTS, scene planning, HeyGen, Remotion, FFmpeg, Cloudinary.
- **Lecture id** — After extract, almost every step is keyed by `lectureId`, not by re-uploading the PDF.
- **Concurrency** — TTS jobs are limited with `p-limit` (3 at a time). Final merge uses a `combining` status lock so intro and outro webhooks do not merge twice.
- **CORS** — Currently `origin: "*"`.

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| Server exits on start | `MONGODB_URI` is missing or MongoDB is not running |
| PDF preview fails | `pdfjs-dist` must match `react-pdf` (both `5.4.296`) |
| Extract / script / voice fails | Server running; Gemini and ElevenLabs keys in `server/.env` |
| Empty or broken extract | Use a PDF with selectable text; image-only scans will not OCR |
| Rate-limit JSON errors | PDF extract: 20 / 15 min. Script, TTS, and video: 10 / hour |
| CORS or network errors | Set `VITE_API_URL` to the API origin |
| Audio generated but no video | Call `/api/video/create`; HeyGen key + public webhook URL; Cloudinary credentials |
| HeyGen never completes | `HEYGEN_WEBHOOK_URL` must be reachable from the internet |
| Remotion render fails | Run `npm run build:node` in `remotion-animation`; Chrome/Chromium available |
| FFmpeg combine fails | Install FFmpeg and confirm `ffmpeg` is on the PATH |
| Final video never appears | Intro, outro, **and** `remotionUrl` must all exist; then status becomes `combining` then `completed` |

## License

ISC
