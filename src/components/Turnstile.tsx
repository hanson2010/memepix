'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface TurnstileProps {
  siteKey: string
  onSuccess: (token: string) => void
  onError?: () => void
  action?: string
}

export function Turnstile({ siteKey, onSuccess, onError, action = 'upload' }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !containerRef.current) return

    const container = containerRef.current

    const renderTurnstile = () => {
      if (container && (window as any).turnstile) {
        (window as any).turnstile.render(container, {
          sitekey: siteKey,
          action: action,
          callback: onSuccess,
          'error-callback': onError,
        })
      }
    }

    if (!(window as any).turnstile) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.onload = renderTurnstile
      document.head.appendChild(script)
    } else {
      renderTurnstile()
    }

    return () => {
      if ((window as any).turnstile && container) {
        try {
          (window as any).turnstile.remove(container)
        } catch (e) {}
      }
    }
  }, [isMounted, siteKey, action, onSuccess, onError])

  return <div ref={containerRef} className="turnstile-container" />
}
