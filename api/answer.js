/**
 * /api/answer  (POST)
 * Generates a grounded answer via Claude Haiku using results the client
 * already fetched from /api/search. Does NOT fetch its own results.
 * Body: { q: string, results: [{ title, url, snippet }] }
 * Env var: ANTHROPIC_API_KEY
 */

import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = (req.body?.q || '').trim()
  const results = Array.isArray(req.body?.results) ? req.body.results : []

  if (!query) {
    return res.status(400).json({ error: 'Missing query: q' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const snippets = results
      .slice(0, 3)
      .map((r, i) => `[${i + 1}] ${r.title}: ${(r.snippet || '').substring(0, 300)}`)
      .join('\n\n')

    const context = snippets
      ? `Here are web search results for context:\n\n${snippets}\n\n`
      : ''

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `${context}Answer this search query in 2-3 sentences based on the search results above. Be factual and accurate. If the search results don't contain relevant info, say so briefly. Do not use filler phrases. Do not start with "I". Just answer.

Query: ${query}`,
        },
      ],
    })

    const text = message.content?.[0]?.text?.trim() || null
    const inputTokens = message.usage?.input_tokens || 0
    const outputTokens = message.usage?.output_tokens || 0

    return res.status(200).json(
      text ? { text, source: null, tokens: { input: inputTokens, output: outputTokens } } : null
    )
  } catch (err) {
    console.error('[api/answer] error:', err)
    return res.status(200).json(null)
  }
}
