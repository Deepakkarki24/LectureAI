# Lecture AI

Turn PDF study material into a spoken Hinglish lecture. Upload a PDF, preview it in the browser, extract the text on the server, generate a teacher-style script with Google Gemini, and convert that script to audio with ElevenLabs.

## What it does

```
Upload PDF  →  Preview PDF  →  Extract text  →  Generate AI script  →  Convert to voice
   (client)      (client)         (server)           (server)              (server)
```

1. **Upload & preview** — Drag and drop a PDF on the frontend. The app validates file type, size, and page count, then shows a page-by-page preview.
2. **Extract content** — The PDF is sent to the backend, which pulls out readable text from each page.
3. **Generate script** — Gemini turns the extracted content into a natural, speech-ready Hinglish lecture script.
4. **Text to speech** — ElevenLabs converts the final script into an MP3 you can play in the browser.

## Tech stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, react-pdf, pdfjs-dist |
| Backend  | Node.js, Express 5, TypeScript, Multer, pdfjs-dist |
| AI       | Google Gemini (`gemini-2.5-flash`), ElevenLabs TTS |
| Database | MongoDB (optional — connection is set up but not required for the core PDF workflow) |

## Project structure

```
lectureAi/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # UI components (uploader, viewer, editor, etc.)
│   │   ├── pages/          # Dashboard — main app screen
│   │   ├── services/       # API calls to the backend
│   │   └── lib/            # PDF viewer config & validation helpers
│   └── package.json
│
├── server/                 # Backend (Express API)
│   ├── src/
│   │   ├── controllers/    # Request handlers (PDF, voice)
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # PDF text extraction logic
│   │   ├── config/         # Env, DB, Multer, AI clients
│   │   └── runner/         # Gemini & ElevenLabs orchestration
│   └── package.json
│
└── README.md
```

## Prerequisites

- **Node.js** 20+ (recommended)
- **npm**
- API keys:
  - [Google AI Studio](https://aistudio.google.com/) — for Gemini script generation
  - [ElevenLabs](https://elevenlabs.io/) — for voice generation
- **MongoDB URI** (optional for local dev — only needed if you use database features)

## Getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd lectureAi
```

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` folder:

```env
PORT=3000
NODE_ENV=development

# Required for AI features
GOOGLE_API_KEY=your_google_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Optional — MongoDB (used on server startup)
MONGODB_URI=mongodb://localhost:27017/lectureai
```

Start the backend:

```bash
npm run dev
```

The API runs at **http://localhost:3000**.

### 3. Set up the client

Open a new terminal:

```bash
cd client
npm install
```

Optional: create a `.env` file inside `client/` if your backend runs on a different URL:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

Open the URL shown in the terminal (usually **http://localhost:5173**).

## How to use the app

1. Open the frontend in your browser.
2. Upload a PDF (max **20 MB**, max **8 pages**).
3. Wait for the PDF preview to load and confirm the page count.
4. Click **Extract PDF Content** — text is extracted on the server and shown on screen.
5. Click **Generate AI Script** — Gemini creates a Hinglish lecture from the extracted text.
6. Review or edit the script in the editor.
7. Click **Convert to Voice** — ElevenLabs returns an audio file you can play.

## API reference

Base URL: `http://localhost:3000` (or your `VITE_API_URL`)

### Extract PDF text

```http
POST /api/pdf/extract
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| `pdf` | File | PDF file to extract |

**Success (200)**

```json
{
  "content": "--- Page 1 ---\n\nExtracted text here..."
}
```

**Error (400)**

```json
{
  "error": "PDF file is required."
}
```

---

### Generate AI script

```http
POST /api/pdf/generate-script
Content-Type: multipart/form-data
```

| Field    | Type   | Description              |
|----------|--------|--------------------------|
| `script` | string | Extracted PDF text content |

**Success (200)**

```json
{
  "success": true,
  "data": "Generated Hinglish lecture script..."
}
```

---

### Convert text to speech

```http
POST /api/text-to-speech/generate
Content-Type: multipart/form-data
```

| Field        | Type   | Description        |
|--------------|--------|--------------------|
| `scriptText` | string | Final script text  |

**Success (200)** — returns `audio/mpeg` (MP3 binary)

**Error (400/500)**

```json
{
  "success": false,
  "message": "Script is required to convert into audio!"
}
```

## Environment variables

### Server (`server/.env`)

| Variable            | Required | Description                          |
|---------------------|----------|--------------------------------------|
| `PORT`              | No       | Server port (default: `3000`)        |
| `NODE_ENV`          | No       | `development` or `Production`        |
| `GOOGLE_API_KEY`    | Yes*     | Google Gemini API key                |
| `ELEVENLABS_API_KEY`| Yes*     | ElevenLabs API key                   |
| `MONGODB_URI`       | No       | MongoDB connection string            |
| `MONGODB_USERNAME`  | No       | Used in production Atlas connection  |
| `MONGODB_PASSWORD`  | No       | Used in production Atlas connection  |
| `CLIENT_URL`        | No       | Frontend URL (for CORS if needed)    |

\*Required for script generation and voice conversion.

### Client (`client/.env`)

| Variable       | Required | Description                              |
|----------------|----------|------------------------------------------|
| `VITE_API_URL` | No       | Backend URL (default: `http://localhost:3000`) |

## Available scripts

### Server

| Command         | Description                    |
|-----------------|--------------------------------|
| `npm run dev`   | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/`  |
| `npm start`     | Run compiled production build  |

### Client

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Start Vite dev server    |
| `npm run build`   | Type-check and build     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## PDF rules

These limits apply on both frontend validation and backend extraction:

- **File type:** PDF only
- **Max size:** 20 MB
- **Max pages:** 8

The frontend handles **preview only** (via `react-pdf`). All **text extraction** runs on the server using `pdfjs-dist`.

## Architecture notes

- **Frontend** — Responsible for upload UI, PDF preview, and calling backend APIs. No PDF text extraction on the client.
- **Backend** — Handles PDF parsing, Gemini script generation, and ElevenLabs audio generation.
- **PDF worker** — `pdfjs-dist@5.4.296` is pinned to match `react-pdf@10.4.1` to avoid version mismatch errors in the viewer.

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| PDF preview fails | Ensure `pdfjs-dist` version matches `react-pdf` (both should be `5.4.296`) |
| Extract / script / voice fails | Confirm the server is running and API keys are set in `server/.env` |
| CORS or network errors | Set `VITE_API_URL` in `client/.env` to your backend URL |
| MongoDB connection error | Add a valid `MONGODB_URI` or ignore if you are not using DB features yet |
| Empty or bad script | Use a PDF with selectable text; scanned/image-only PDFs may extract poorly |

## License

ISC
