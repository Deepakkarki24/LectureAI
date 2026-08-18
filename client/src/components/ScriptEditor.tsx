import { CircleNotchIcon, MicrophoneIcon } from '@phosphor-icons/react'
import type { AudioUrlInterface, ScriptInterface } from '../pages/Dashboard'

interface ScriptEditorProps {
  script: ScriptInterface
  audioUrl: AudioUrlInterface | null
  disabled: boolean
  isGenerating: boolean
  setScript: (value: ScriptInterface) => void
  canConvertToVoice: boolean
  isConverting: boolean
  voiceReady: boolean
  onConvertToVoice: () => void
}

export default function ScriptEditor({
  script,
  audioUrl,
  disabled,
  isGenerating,
  setScript,
  canConvertToVoice,
  isConverting,
  voiceReady,
  onConvertToVoice,
}: ScriptEditorProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI Generated Script</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review and edit the generated narration script
          </p>
        </div>
        <button
          type="button"
          onClick={onConvertToVoice}
          disabled={!canConvertToVoice || isConverting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isConverting ? (
            <>
              <CircleNotchIcon size={16} className="animate-spin" />
              Converting…
            </>
          ) : (
            <>
              <MicrophoneIcon size={16} />
              Convert Script to Voice
            </>
          )}
        </button>
      </div>

      <div className="relative flex flex-col gap-4">
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/80">
            <CircleNotchIcon size={28} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-600">Generating AI script…</p>
          </div>
        )}

        <div className='w-full flex flex-col gap-2'>
          <span className='font-semibold w-full text-xl'>Intro</span>
          <textarea
            value={script.intro}
            onChange={(e) =>
              setScript({
                ...script,
                intro: e.target.value,
              })
            }
            disabled={disabled || isGenerating}
            placeholder="Your AI-generated script will appear here. You can edit it before converting to voice."
            rows={5}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>

        <div className='w-full flex flex-col gap-2'>
          <span className='font-semibold w-full text-xl'>Content</span>
          <textarea
            value={script.content}
            onChange={(e) =>
              setScript({
                ...script,
                content: e.target.value,
              })
            }
            disabled={disabled || isGenerating}
            placeholder="Your AI-generated script will appear here. You can edit it before converting to voice."
            rows={14}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>

        <div className='w-full flex flex-col gap-2'>
          <span className='font-semibold w-full text-xl'>Outro</span>
          <textarea
            value={script.outro}
            onChange={(e) =>
              setScript({
                ...script,
                outro: e.target.value,
              })
            }
            disabled={disabled || isGenerating}
            placeholder="Your AI-generated script will appear here. You can edit it before converting to voice."
            rows={5}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>
      </div>

      {!voiceReady && !audioUrl ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <MicrophoneIcon size={32} className="mx-auto mb-2 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">
            Voice generation will be available here.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Audio playback and download will be added when the voice API is connected.
          </p>
        </div>
      ) : <div className="mt-4 w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
        <div className='w-full'>
          <audio className='w-full' controls src={audioUrl?.intro} />
        </div>
        <div className='w-full'>
          <audio className='w-full' controls src={audioUrl?.content} />
        </div>
        <div className='w-full'>
          <audio className='w-full' controls src={audioUrl?.outro} />
        </div>
      </div>

      }
    </section>
  )
}
