import { CircleNotchIcon, SparkleIcon } from '@phosphor-icons/react'

interface ExtractedContentProps {
  content: string
  isExtracting: boolean
  isGeneratingScript: boolean
  canGenerateScript: boolean
  onGenerateScript: () => void
}

export default function ExtractedContent({
  content,
  isExtracting,
  isGeneratingScript,
  canGenerateScript,
  onGenerateScript,
}: ExtractedContentProps) {
  const hasContent = content.length > 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Extracted Content</h2>
          <p className="mt-1 text-sm text-slate-500">
            Text extracted from your PDF document
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateScript}
          disabled={!canGenerateScript || isGeneratingScript}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isGeneratingScript ? (
            <>
              <CircleNotchIcon size={16} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <SparkleIcon size={16} />
              Generate AI Script
            </>
          )}
        </button>
      </div>

      <div className="relative min-h-50 rounded-lg border border-slate-200 bg-slate-50">
        {isExtracting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-slate-50/90">
            <CircleNotchIcon size={28} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-600">Extracting PDF content…</p>
          </div>
        )}

        {!isExtracting && !hasContent && (
          <div className="flex h-50 items-center justify-center px-4">
            <p className="text-center text-sm text-slate-400">
              Extracted content will appear here after processing your PDF.
            </p>
          </div>
        )}

        {hasContent && (
          <div className="max-h-80 overflow-y-auto p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
              {content}
            </pre>
          </div>
        )}
      </div>
    </section>
  )
}
