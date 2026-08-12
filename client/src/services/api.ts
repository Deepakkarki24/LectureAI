const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function extractPdfContent(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('pdf', file)

  const response = await fetch(`${API_BASE_URL}/api/pdf/extract`, {
    method: 'POST',
    body: formData,
  })

  const data = (await response.json()) as { content?: string; error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to extract PDF content.')
  }

  return data.content ?? ''
}
