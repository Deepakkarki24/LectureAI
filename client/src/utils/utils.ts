/**
 * AI script generation.
 */
export async function mockGenerateAiScript(extractedContent: string): Promise<string> {
  const topic = extractedContent.split('\n')[0]?.trim() || 'the uploaded document'

  return `[Opening]
Welcome everyone. Today we're going to explore ${topic} — a topic that's shaping how we think about technology and its role in our everyday lives.

[Section 1 — Introduction]
Let's start with the basics. Machine learning is essentially a way for computers to learn from data, rather than following a fixed set of instructions. Think of it like teaching a child — you show examples, and over time, they start recognizing patterns on their own.

[Section 2 — Key Concepts]
There are three main approaches worth understanding:
First, supervised learning — where we train models using labeled examples.
Second, unsupervised learning — where the system discovers hidden patterns without guidance.
And third, reinforcement learning — where an agent learns by receiving rewards or penalties for its actions.

[Section 3 — Real-World Applications]
You've probably interacted with machine learning today without realizing it. Recommendation engines on streaming platforms, spam filters in your email, voice assistants, and even medical diagnostic tools — all powered by machine learning.

[Section 4 — Deep Learning]
At the heart of modern AI breakthroughs lies deep learning, built on neural networks that mimic how our brains process information. This is what enables computers to recognize faces, translate languages, and generate human-like text.

[Closing]
Machine learning isn't just a technical field — it's a tool that's reshaping every industry. As we continue to generate more data, the possibilities will only expand. Thank you for listening, and I hope this gives you a solid foundation to explore further.`
}

/**
 * Mock voice conversion. Replace with ElevenLabs or another voice API when ready.
 */
export async function mockConvertToVoice(script: string): Promise<void> {
  void script
}
