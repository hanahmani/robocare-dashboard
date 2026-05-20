import { useEffect, useState } from 'react'

export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        setClients(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  return { clients, loading, error }
}
