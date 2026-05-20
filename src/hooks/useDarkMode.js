import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('robocare-dark-mode')
      if (saved !== null) return JSON.parse(saved)
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('robocare-dark-mode', JSON.stringify(dark)) } catch {}
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return [dark, setDark]
}
