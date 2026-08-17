import { useCallback, useEffect, useState } from 'react'
import { CircleNotchIcon, FileTextIcon } from '@phosphor-icons/react'
import { PdfUploader } from '../components/PdfUploader'
import ScriptEditor from '../components/ScriptEditor'
import { validatePageCount, validatePdfFileBasic } from '../lib/pdfConfig'
import { extractPdfContent, generateAiScript, generateAudioFromScript } from '../services/api'
import { ExtractedContent } from '../components/ExtractedContent'
import { PdfViewer } from '../components/PdfViewer'

export default function Dashboard() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractedContent, setExtractedContent] = useState('')
  const [hasExtracted, setHasExtracted] = useState(false)

  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [script, setScript] = useState('')
  const [hasGeneratedScript, setHasGeneratedScript] = useState(false)

  const [isConverting, setIsConverting] = useState(false)
  const [voiceReady, setVoiceReady] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")

  const isValidPdf = pdfFile !== null && !validationError && pageCount !== null && !isValidating

  const resetWorkflow = useCallback(() => {
    setExtractedContent('')
    setExtractError(null)
    setHasExtracted(false)
    setIsExtracting(false)
    setScript('')
    setHasGeneratedScript(false)
    setIsGeneratingScript(false)
    setIsConverting(false)
    setVoiceReady(false)
  }, [])

  const resetAll = useCallback(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfFile(null)
    setPdfUrl(null)
    setPageCount(null)
    setValidationError(null)
    setIsValidating(false)
    resetWorkflow()
  }, [pdfUrl, resetWorkflow])

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const handleFileSelect = (file: File) => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)

    setPdfFile(file)
    setPdfUrl(null)
    setPageCount(null)
    setValidationError(null)
    resetWorkflow()
    setIsValidating(true)

    const result = validatePdfFileBasic(file)

    if ('error' in result) {
      setValidationError(result.error)
      setIsValidating(false)
      return
    }

    setPdfUrl(URL.createObjectURL(file))
  }

  const handleDocumentLoad = (numPages: number) => {
    const pageError = validatePageCount(numPages)

    if (pageError) {
      setValidationError(pageError)
      setPageCount(null)
    } else {
      setPageCount(numPages)
      setValidationError(null)
    }

    setIsValidating(false)
  }

  const handleDocumentError = (message: string) => {
    setValidationError(message)
    setPageCount(null)
    setIsValidating(false)
  }

  const handleExtract = async () => {
    if (!pdfFile || !isValidPdf) return

    setIsExtracting(true)
    setExtractedContent('')
    setExtractError(null)
    setHasExtracted(false)
    setScript('')
    setHasGeneratedScript(false)
    setVoiceReady(false)

    try {
      const response = await extractPdfContent(pdfFile)
      setExtractedContent(response)
      setHasExtracted(true)
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : 'Failed to extract PDF content.',
      )
    } finally {
      setIsExtracting(false)
    }
  }

  const handleGenerateScript = async () => {
    if (!hasExtracted || !extractedContent) return

    setIsGeneratingScript(true)
    setScript('')
    setHasGeneratedScript(false)
    setVoiceReady(false)

    try {
      const generated = await generateAiScript(extractedContent)
      console.log("generated",)
      setScript(generated)
      setHasGeneratedScript(true)
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const handleConvertToVoice = async () => {
    if (!hasGeneratedScript || !script.trim()) return

    setIsConverting(true)
    setVoiceReady(false)

    try {
      const response = await generateAudioFromScript(script)

      if (!response) {
        throw new Error("Failed to generate audio");
      }

      console.log(response)

      setAudioUrl(response as string);
      setVoiceReady(true)
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
            <FileTextIcon size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Lecture AI</h1>
            <p className="text-sm text-slate-500">
              PDF to AI Script to Voice
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <PdfUploader
          file={pdfFile}
          pageCount={pageCount}
          error={validationError}
          isValidating={isValidating}
          onFileSelect={handleFileSelect}
          onRemove={resetAll}
        />

        {pdfUrl && (
          <PdfViewer
            fileUrl={pdfUrl}
            onLoadStart={() => setIsValidating(true)}
            onDocumentLoad={handleDocumentLoad}
            onDocumentError={handleDocumentError}
          />
        )}

        {isValidPdf && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <CircleNotchIcon size={16} className="animate-spin" />
                  Extracting…
                </>
              ) : (
                'Extract PDF Content'
              )}
            </button>
          </div>
        )}

        {extractError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {extractError}
          </div>
        )}

        {isValidPdf && (
          <ExtractedContent
            content={extractedContent}
            setContent={setExtractedContent}
            isExtracting={isExtracting}
            isGeneratingScript={isGeneratingScript}
            canGenerateScript={hasExtracted && !isExtracting}
            onGenerateScript={handleGenerateScript}
          />
        )}

        {isValidPdf && (
          <ScriptEditor
            script={script}
            disabled={!hasGeneratedScript}
            isGenerating={isGeneratingScript}
            onChange={setScript}
            canConvertToVoice={hasGeneratedScript && script.trim().length > 0}
            isConverting={isConverting}
            voiceReady={voiceReady}
            audioUrl={audioUrl}
            onConvertToVoice={handleConvertToVoice}
          />
        )}
      </main>
    </div>
  )
}
