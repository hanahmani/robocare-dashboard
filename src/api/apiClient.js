import axios from 'axios'

// baseURL vide → les requêtes passent par le proxy Vite (/api → http://localhost:8081)
const apiClient = axios.create({ baseURL: '' })

let _onAuthError = null

export function setAuthToken(token) {
  if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete apiClient.defaults.headers.common['Authorization']
}

export function setAuthErrorHandler(handler) {
  _onAuthError = handler
}

// ── Intercepteur de requête ──────────────────────────────────────────────
// Sécurité supplémentaire : si le header Authorization n'est pas encore défini
// (ex : juste après un rechargement de page, avant que AuthContext n'ait appelé
// setAuthToken), on récupère le token directement depuis localStorage. Cela
// évite qu'un premier appel parte sans token et provoque un 403.
apiClient.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    const token = localStorage.getItem('rc_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || ''
    if (!url.includes('/api/auth/') && (error.response?.status === 401 || error.response?.status === 403)) {
      _onAuthError?.()
    }
    return Promise.reject(error)
  },
)

export default apiClient
