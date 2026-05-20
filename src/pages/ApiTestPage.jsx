import { useState } from 'react'
import { Terminal, Play, RefreshCw } from 'lucide-react'

const PRESET_ENDPOINTS = [
  { label: 'GET Sent History',    method: 'GET',  url: '/api/notifications/history/sent' },
  { label: 'GET Health',         method: 'GET',  url: '/api/notifications/health' },
  { label: 'GET Received WA',    method: 'GET',  url: '/api/notifications/history/received' },
  { label: 'POST Send Email',    method: 'POST', url: '/api/notifications/email',
    body: JSON.stringify({ to: 'test@example.com', subject: 'Test', message: 'Hello from API test panel' }, null, 2) },
  { label: 'POST Send SMS',      method: 'POST', url: '/api/notifications/sms',
    body: JSON.stringify({ to: '+21655123456', message: 'Hello from RoboCare!' }, null, 2) },
  { label: 'POST Send WhatsApp', method: 'POST', url: '/api/notifications/whatsapp',
    body: JSON.stringify({ to: '+21655123456', templateName: 'rapo', languageCode: 'en' }, null, 2) },
]

export default function ApiTestPage() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('/api/notifications/health')
  const [body, setBody] = useState('')
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(null)
  const [history, setHistory] = useState([])

  const run = async () => {
    setLoading(true); setResponse(null)
    const t0 = performance.now()
    try {
      let parsedHeaders = {}
      try { parsedHeaders = JSON.parse(headers) } catch {}
      const opts = { method, headers: parsedHeaders }
      if (method !== 'GET' && body) {
        // If content-type is JSON, validate and normalize the body
        const contentType = (parsedHeaders['Content-Type'] || parsedHeaders['content-type'] || '')
        if (contentType.includes('application/json')) {
          let parsedBody = null
          try {
            parsedBody = JSON.parse(body)
          } catch (e) {
            throw new Error('Request body is not valid JSON')
          }
          // Auto-normalize common shapes: ensure "to" is an array when backend expects arrays
          if (parsedBody && typeof parsedBody.to === 'string') {
            parsedBody.to = [parsedBody.to]
          }
          opts.body = JSON.stringify(parsedBody)
        } else {
          opts.body = body
        }
      }
      const res = await fetch(url, opts)
      const text = await res.text()
      const ms = Math.round(performance.now() - t0)
      setElapsed(ms)
      let data
      try { data = JSON.parse(text) } catch { data = text }
      const result = { status: res.status, ok: res.ok, data, ms, url, method }
      setResponse(result)
      setHistory(p => [{ ...result, time: new Date().toLocaleTimeString('fr-FR') }, ...p.slice(0, 9)])
    } catch (e) {
      const ms = Math.round(performance.now() - t0)
      setElapsed(ms)
      setResponse({ status: 0, ok: false, data: e.message, ms, url, method })
    }
    setLoading(false)
  }

  const loadPreset = (preset) => {
    setMethod(preset.method); setUrl(preset.url)
    if (preset.body) setBody(preset.body)
    else setBody('')
  }

  return (
    <div className="page-shell px-4 sm:px-8 py-6 space-y-6 max-w-6xl mx-auto">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-medical-50 p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-700">Developer tools</p>
        <h1 className="mt-2 text-3xl font-extrabold text-surface-900">API Test</h1>
        <p className="mt-2 max-w-2xl text-sm text-surface-500">
          Run endpoints, inspect responses, and verify delivery behavior in a branded panel that matches the rest of the app.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-6 space-y-4">
        <div className="font-semibold text-sm text-surface-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-600" />API Test Panel
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_ENDPOINTS.map((p, i) => (
            <button key={i} onClick={() => loadPreset(p)}
              className="px-3 py-1.5 text-xs font-semibold rounded-full border border-surface-200 text-surface-600 hover:bg-surface-50 transition">
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <select value={method} onChange={e => setMethod(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-surface-200 font-mono font-bold focus:outline-none bg-white">
            {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m}>{m}</option>)}
          </select>
          <input value={url} onChange={e => setUrl(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-surface-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"/>
          <button onClick={run} disabled={loading}
            className="px-5 py-2 text-sm rounded-xl bg-brand-600 text-white hover:bg-brand-700 font-semibold flex items-center gap-2 disabled:opacity-60 transition shadow-glow">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">Headers (JSON)</label>
            <textarea value={headers} onChange={e => setHeaders(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 font-mono focus:outline-none resize-none bg-white"/>
          </div>
          {method !== 'GET' && (
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1">Request Body (JSON)</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-200 font-mono focus:outline-none resize-none bg-white"/>
            </div>
          )}
        </div>
        {response && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${response.ok ? 'bg-medical-50 text-medical-700' : 'bg-alert-50 text-alert-700'}`}>
                {response.status || 'ERR'}
              </span>
              <span className="text-xs text-surface-400">{elapsed}ms</span>
              <span className="text-xs text-surface-400 font-mono">{method} {url}</span>
            </div>
            <pre className="bg-surface-950 text-brand-300 rounded-xl p-4 text-xs overflow-auto max-h-64 font-mono">
              {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data)}
            </pre>
          </div>
        )}
      </div>
      {history.length > 0 && (
        <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-6">
          <div className="font-semibold text-sm text-surface-900 mb-3">Request History</div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} onClick={() => { setMethod(h.method); setUrl(h.url); }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-50 cursor-pointer text-xs border border-transparent hover:border-surface-100 transition-colors">
                <span className={`font-bold ${h.ok ? 'text-medical-700' : 'text-alert-700'}`}>{h.status || 'ERR'}</span>
                <span className="font-mono text-surface-500">{h.method}</span>
                <span className="text-surface-700 flex-1 truncate font-mono">{h.url}</span>
                <span className="text-surface-400">{h.ms}ms</span>
                <span className="text-surface-400">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
