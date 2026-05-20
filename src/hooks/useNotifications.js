import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  fetchSentNotifications,
  fetchHealth,
  computeStats,
  buildVolumeByDay,
  buildVolumeByHour,
  normalizeNotification,
} from '../api/Notificationapi'

export function useNotifications({ autoRefreshInterval = 30000 } = {}) {
  const [raw, setRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(false)
  const firstLoad = useRef(false)

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      firstLoad.current ? setRefreshing(true) : setLoading(true)
    }
    try {
      const data = await fetchSentNotifications()
      setRaw(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      firstLoad.current = true
      if (!silent) { setLoading(false); setRefreshing(false) }
    }
  }, [])

  useEffect(() => {
    load()
    const healthCheck = async () => {
      try { await fetchHealth(); setIsOnline(true) }
      catch { setIsOnline(false) }
    }
    healthCheck()
    const healthId = setInterval(healthCheck, 30000)
    const refreshId = autoRefreshInterval
      ? setInterval(() => load({ silent: true }), autoRefreshInterval)
      : null

    const onGlobalRefresh = () => load({ silent: false })
    window.addEventListener('robocare:refresh', onGlobalRefresh)

    return () => {
      clearInterval(healthId)
      if (refreshId) clearInterval(refreshId)
      window.removeEventListener('robocare:refresh', onGlobalRefresh)
    }
  }, [load, autoRefreshInterval])

  const stats = useMemo(() => computeStats(raw), [raw])
  const normalized = useMemo(() => raw.map(normalizeNotification), [raw])
  const volumeByHour = useMemo(() => buildVolumeByHour(raw), [raw])
  const volumeByDay = useMemo(() => buildVolumeByDay(raw), [raw])

  const retryNotification = useCallback(async (notification, newChannel = null) => {
    setRaw(prev => prev.map(n =>
      String(n.id) === String(notification.id || notification.raw?.id)
        ? { ...n, status: 'PENDING', errorMessage: null }
        : n
    ))
  }, [])

  const retryAll = useCallback(() => {
    setRaw(prev => prev.map(n =>
      n.status === 'FAILED' ? { ...n, status: 'PENDING', errorMessage: null } : n
    ))
  }, [])

  return {
    raw, normalized, loading, refreshing, error, isOnline,
    stats, volumeByHour, volumeByDay,
    reload: load, retryNotification, retryAll,
  }
}
