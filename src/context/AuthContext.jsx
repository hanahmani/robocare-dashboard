import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuthToken, setAuthErrorHandler } from '../api/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem('rc_token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_user') || 'null') }
    catch { return null }
  })

  useEffect(() => {
    if (token) setAuthToken(token)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthError = useCallback(() => {
    setToken(null)
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem('rc_token')
    localStorage.removeItem('rc_user')
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    setAuthErrorHandler(handleAuthError)
  }, [handleAuthError])

  const login = useCallback((tokenValue, userInfo) => {
    setToken(tokenValue)
    setUser(userInfo)
    setAuthToken(tokenValue)
    localStorage.setItem('rc_token', tokenValue)
    localStorage.setItem('rc_user', JSON.stringify(userInfo))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem('rc_token')
    localStorage.removeItem('rc_user')
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
