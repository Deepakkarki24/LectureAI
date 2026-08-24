const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const extractPdfContent = async (file: File) => {
  const formData = new FormData()
  formData.append('pdf', file)

  const response = await fetch(`${API_BASE_URL}/api/pdf/extract`, {
    method: 'POST',
    body: formData,
  })

  const data = (await response.json()) as { data?: string; error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to extract PDF content.')
  }

  return data.data ?? ''
}


export const generateAiScript = async (lectureId: string) => {
  const formData = new FormData()
  formData.append('lectureId', lectureId)

  const response = await fetch(`${API_BASE_URL}/api/pdf/generate-script`, {
    method: 'POST',
    body: formData,
  })

  const data = (await response.json()) as { data?: any; error?: string }

  console.log(data.data)

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to generate ai script.')
  }

  return data.data ?? ''
}

export const generateAudioFromScript = async (
  intro: string,
  content: string,
  outro: string,
  pdfName: string
) => {
  const formData = new FormData()
  formData.append('intro', intro)
  formData.append('content', content)
  formData.append('outro', outro)
  formData.append('pdfName', pdfName)

  const response = await fetch(
    `${API_BASE_URL}/api/text-to-speech/generate`,
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate audio");
  }

  // const audioBlob = await response.blob();

  // const audioUrl = URL.createObjectURL(audioBlob);

  const data = (await response.json()) as { data?: any; error?: string }

  const { introAudioUrl, contentAudioUrl, outroAudioUrl } = data.data.audio

  return { introAudioUrl, contentAudioUrl, outroAudioUrl }
}