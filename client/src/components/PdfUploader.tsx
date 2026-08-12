import { useRef, useState } from 'react'
import { FilePdfIcon, UploadSimpleIcon, XIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { formatFileSize } from '../lib/pdfConfig'

interface PdfUploaderProps {
  file: File | null
  pageCount: number | null
  error: string | null
  isValidating: boolean
  onFileSelect: (file: File) => void
  onRemove: () => void
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  file,
  pageCount,
  error,
  isValidating,
  onFileSelect,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0]
    if (selected) onFileSelect(selected)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const isValid = file && !error && pageCount !== null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Upload PDF</h2>
        <p className="mt-1 text-sm text-slate-500">
          PDF only · Max 20 MB · Max 8 pages
        </p>
      </div>

      {!file ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 transition-colors ${isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
            }`}
        >
          <UploadSimpleIcon size={36} className="mb-3 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">
            Drag and drop your PDF here
          </p>
          <p className="mt-1 text-sm text-slate-500">or click to browse</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                <FilePdfIcon size={22} className="text-red-500" weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">{formatFileSize(file.size)}</p>
                {isValidating && (
                  <p className="mt-1 text-sm text-blue-600">Validating PDF…</p>
                )}
                {!isValidating && pageCount !== null && !error && (
                  <p className="mt-1 text-sm text-emerald-600">
                    {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
              aria-label="Remove PDF"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <WarningCircleIcon size={18} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isValid && (
        <p className="mt-3 text-sm text-emerald-600">PDF validated successfully.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </section>
  )
}
