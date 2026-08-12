import { useState } from 'react'
import { Document, Page } from 'react-pdf'
import { CaretLeftIcon, CaretRightIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@phosphor-icons/react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../lib/pdfConfig'

interface PdfViewerProps {
  fileUrl: string
  onDocumentLoad?: (pageCount: number) => void
  onDocumentError?: (message: string) => void
  onLoadStart?: () => void
}

const MIN_SCALE = 0.6
const MAX_SCALE = 2.0
const DEFAULT_SCALE = 1.0

export default function PdfViewer({
  fileUrl,
  onDocumentLoad,
  onDocumentError,
  onLoadStart,
}: PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [pageCount, setPageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const goToPrevious = () => setCurrentPage((p) => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage((p) => Math.min(pageCount, p + 1))
  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + 0.1).toFixed(1)))
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - 0.1).toFixed(1)))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">PDF Preview</h2>

        {pageCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={currentPage <= 1}
                className="rounded-l-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <CaretLeftIcon size={18} />
              </button>
              <span className="border-x border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                {currentPage} / {pageCount}
              </span>
              <button
                type="button"
                onClick={goToNext}
                disabled={currentPage >= pageCount}
                className="rounded-r-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <CaretRightIcon size={18} />
              </button>
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= MIN_SCALE}
                className="rounded-l-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom out"
              >
                <MagnifyingGlassMinusIcon size={18} />
              </button>
              <span className="border-x border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE}
                className="rounded-r-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom in"
              >
                <MagnifyingGlassPlusIcon size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-h-130 overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4">
        <div className="flex justify-center">
          <Document
            file={fileUrl}
            loading={
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                Loading PDF…
              </div>
            }
            onLoadStart={() => {
              setIsLoading(true)
              onLoadStart?.()
            }}
            onLoadSuccess={({ numPages }) => {
              setPageCount(numPages)
              setIsLoading(false)
              onDocumentLoad?.(numPages)
            }}
            onLoadError={(error) => {
              setIsLoading(false)
              onDocumentError?.(
                error.message || 'Unable to read the PDF file. It may be corrupted or password-protected.',
              )
            }}
          >
            {!isLoading && pageCount > 0 && (
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer
                className="shadow-md"
              />
            )}
          </Document>
        </div>
      </div>
    </section>
  )
}
