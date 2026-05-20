import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('robocare.theme')
      if (saved !== null) return saved === 'dark'
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('robocare.theme', dark ? 'dark' : 'light') } catch {}
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return [dark, setDark]
}
