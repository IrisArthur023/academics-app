// Sends the conversation to your backend. Without VITE_AI_ENDPOINT, returns a placeholder reply
// so the UI works while you wire up a real model.
const ENDPOINT = import.meta.env.VITE_AI_ENDPOINT

export async function askAI({ mode, messages }) {
  if (!ENDPOINT) {
    await new Promise(r => setTimeout(r, 500))
    const last = messages[messages.length - 1].content
    return `(Demo reply, ${mode} mode) You asked: "${last}". Set VITE_AI_ENDPOINT in .env to connect a real model.`
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, messages })
  })
  if (!res.ok) throw new Error(`AI request failed (${res.status})`)
  const data = await res.json()
  return data.reply
}
