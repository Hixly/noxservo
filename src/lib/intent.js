/**
 * Classify a search query as 'direct' (keyword / navigational — blue-links only)
 * or 'question' (natural-language — also worth an AI answer).
 * Pure and synchronous: runs client-side before any request. Favors 'direct'
 * when uncertain (cheaper + faster); the UI always offers a manual AI override.
 */

const QUESTION_STARTERS = new Set([
  'who', 'what', 'when', 'where', 'why', 'how', 'which', 'whose',
  'is', 'are', 'am', 'can', 'could', 'should', 'would', 'will',
  'do', 'does', 'did', 'has', 'have', 'was', 'were',
  'explain', 'define', 'compare', 'difference',
])

export function classifyIntent(query) {
  const q = (query || '').trim()
  if (!q) return 'direct'

  // URL-like: a dotted token with no spaces (navigational) → direct
  if (!/\s/.test(q) && /^\S+\.\S+$/.test(q)) return 'direct'

  if (q.endsWith('?')) return 'question'

  const tokens = q.split(/\s+/)
  const first = tokens[0].toLowerCase()

  if (QUESTION_STARTERS.has(first) && tokens.length >= 3) return 'question'
  if (tokens.length >= 8) return 'question'

  return 'direct'
}
