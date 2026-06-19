import { useEffect, useState } from 'react'

const DISMISS_KEY = 'noxservo-install-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
  )
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    && !window.MSStream
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('ios')
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === '1') return

    if (isIOS()) {
      const timer = window.setTimeout(() => {
        setMode('ios')
        setVisible(true)
      }, 2400)
      return () => window.clearTimeout(timer)
    }

    function onBeforeInstallPrompt(event) {
      event.preventDefault()
      setDeferredPrompt(event)
      setMode('native')
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="install-prompt" role="dialog" aria-label="Install Noxservo">
      <div className="install-prompt__card">
        <div className="install-prompt__icon-wrap">
          <img src="/apple-touch-icon.png" alt="" className="install-prompt__icon" />
        </div>

        <div className="install-prompt__copy">
          <p className="install-prompt__title">Install Noxservo</p>
          <p className="install-prompt__subtitle">
            {mode === 'ios'
              ? 'Add to your Home Screen for a clean, full-screen app.'
              : 'Save Noxservo to your device for quick, quiet search.'}
          </p>
        </div>

        {mode === 'ios' ? (
          <p className="install-prompt__steps">
            Tap
            {' '}
            <span className="install-prompt__share" aria-hidden="true">Share</span>
            {' '}
            then
            {' '}
            <strong>Add to Home Screen</strong>
          </p>
        ) : (
          <button type="button" className="install-prompt__action" onClick={install}>
            Install app
          </button>
        )}

        <button type="button" className="install-prompt__dismiss" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}
