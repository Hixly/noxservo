/**
 * /api/search
 * Fetches web search results via Brave Search API.
 * Env var: BRAVE_API_KEY (set in Vercel dashboard)
 */

function cleanSnippet(text) {
  if (!text) return ''
  return text.replace(/<\/?strong>/g, '').slice(0, 180)
}

export default async function handler(req, res) {
  const query = req.query?.q || ''

  if (!query.trim()) {
    return res.status(400).json({ error: 'Missing query parameter: q' })
  }

  if (!process.env.BRAVE_API_KEY) {
    return res.status(500).json({ error: 'BRAVE_API_KEY not configured' })
  }

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=20`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': process.env.BRAVE_API_KEY,
      },
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[api/search] Brave error:', err)
      return res.status(502).json({ error: 'Search provider error' })
    }

    const data = await response.json()

    const results = (data.web?.results || []).map((r) => {
      let domain = ''
      try {
        domain = new URL(r.url).hostname.replace(/^www\./, '')
      } catch {
        domain = ''
      }
      return {
        title: r.title,
        url: r.url,
        domain,
        snippet: cleanSnippet(r.description),
      }
    })

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ results })
  } catch (err) {
    console.error('[api/search] error:', err)
    return res.status(500).json({ error: 'Failed to fetch results' })
  }
}
