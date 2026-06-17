import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import TopAnswer from '../components/TopAnswer.jsx'
import SourceResults from '../components/SourceResults.jsx'
import { classifyIntent } from '../lib/intent.js'

const LOADING_MSGS = [
  'querying the void...',
  'decrypting the web...',
  'whispering to the servers...',
  'shushing the internet...',
  'asking nicely...',
  'tiptoeing through the data...',
  'consulting the oracle...',
  'mining for signal...',
  'bothering a satellite...',
  'translating human curiosity...',
]

const BASE_WH = 0.05

export default function Results() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [answer, setAnswer] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRequested, setAiRequested] = useState(false)
  const [usedAI, setUsedAI] = useState(false)
  const [energyWh, setEnergyWh] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState('')
  const msgInterval = useRef(null)

  useEffect(() => {
    if (query) {
      document.title = `${query} — Noxservo`
    }
    return () => { document.title = 'Noxservo' }
  }, [query])

  // Run the AI answer path for the current query + already-fetched results.
  const runAnswer = async (q, currentResults) => {
    setAiLoading(true)
    try {
      const resp = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, results: currentResults.slice(0, 3) }),
      })
      const answerData = await resp.json()
      setAnswer(answerData)
      setUsedAI(true)
      const tokens = answerData?.tokens
      const wh = tokens
        ? BASE_WH + ((tokens.input + tokens.output) * 0.002) / 1000
        : BASE_WH
      const whRounded = parseFloat(wh.toFixed(3))
      setEnergyWh(whRounded)
      fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wh: whRounded }),
      }).catch(() => {})
    } catch {
      setAnswer(null)
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    if (!query) return
    setLoading(true)
    setAnswer(null)
    setResults([])
    setEnergyWh(null)
    setUsedAI(false)
    setAiRequested(false)

    const intent = classifyIntent(query)

    const pick = () => LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)]
    setLoadingMsg(pick())
    msgInterval.current = setInterval(() => setLoadingMsg(pick()), 1800)

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then(async (searchData) => {
        const resultList = searchData.results || []
        setResults(resultList)

        if (intent === 'question') {
          await runAnswer(query, resultList)
        } else {
          // Direct: no AI. Report the low baseline energy.
          const whRounded = parseFloat(BASE_WH.toFixed(3))
          setEnergyWh(whRounded)
          fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wh: whRounded }),
          }).catch(() => {})
        }
      })
      .catch(() => {
        setResults([])
        setAnswer(null)
      })
      .finally(() => {
        clearInterval(msgInterval.current)
        setLoading(false)
      })
  }, [query])

  const handleAskAI = () => {
    setAiRequested(true)
    runAnswer(query, results)
  }

  return (
    <div className="min-h-screen bg-black">

      {/* Top bar */}
      <header className="border-b border-[#111] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          <Link to="/" className="pixel-logo shrink-0" style={{ fontSize: '0.6rem' }}>
            NOXSERVO
          </Link>
          <div className="flex-1 max-w-lg">
            <SearchBar initialValue={query} compact />
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-2xl mx-auto px-4 py-10">

        {loading ? (
          <div className="flex flex-col gap-3">
            <p className="text-[#3a3a3a] text-xs tracking-widest font-mono transition-all duration-500">
              {loadingMsg}
            </p>
            <div className="h-24 bg-black border border-[#1a1a1a] rounded-lg animate-pulse" />
          </div>
        ) : (
          <>
            {/* AI answer (question intent or manual override) */}
            {answer && <TopAnswer answer={answer} query={query} />}

            {/* Manual override pill — only when no AI answer is shown yet */}
            {!answer && !aiLoading && results.length > 0 && (
              <button
                onClick={handleAskAI}
                className="text-[#3d3d3d] text-xs tracking-widest uppercase hover:text-[#c8c8c8] transition-colors duration-200 mb-6"
              >
                Ask Noxservo AI ↵
              </button>
            )}

            {aiLoading && !answer && (
              <p className="text-[#3a3a3a] text-xs tracking-widest font-mono mb-6">
                consulting the oracle...
              </p>
            )}

            {/* Blue-links — always expanded */}
            {results.length > 0 && (
              <div className={answer ? 'mt-8' : ''}>
                <SourceResults results={results} />
              </div>
            )}

            {/* Energy note */}
            {energyWh !== null && (
              <p className="text-[#272727] text-xs tracking-widest mt-12">
                this search used ~{energyWh} Wh{usedAI ? '' : ' · no AI'}
              </p>
            )}
          </>
        )}

      </main>
    </div>
  )
}
