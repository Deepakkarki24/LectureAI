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


export const generateAiScript = async (content: string) => {
  const formData = new FormData()
  formData.append('content', content)

  const response = await fetch(`${API_BASE_URL}/api/pdf/generate-script`, {
    method: 'POST',
    body: formData,
  })

  const data = (await response.json()) as { data?: string; error?: string }

  console.log(data)

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to generate ai script.')
  }

  return data.data ?? ''
}

export const generateAudioFromScript = async (scriptText: string) => {
  const formData = new FormData()
  formData.append('scriptText', scriptText)

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

  const audioBlob = await response.blob();

  const audioUrl = URL.createObjectURL(audioBlob);

  return audioUrl
}