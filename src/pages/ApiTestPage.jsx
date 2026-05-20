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
      if (method !== 'GET' && body) opts.body = body
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
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-purple-500" />API Test Panel
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_ENDPOINTS.map((p, i) => (
            <button key={i} onClick={() => loadPreset(p)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <select value={method} onChange={e => setMethod(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 font-mono font-bold focus:outline-none">
            {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m}>{m}</option>)}
          </select>
          <input value={url} onChange={e => setUrl(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"/>
          <button onClick={run} disabled={loading}
            className="px-5 py-2 text-sm rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-60 transition">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Headers (JSON)</label>
            <textarea value={headers} onChange={e => setHeaders(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono focus:outline-none resize-none"/>
          </div>
          {method !== 'GET' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Request Body (JSON)</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono focus:outline-none resize-none"/>
            </div>
          )}
        </div>
        {response && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${response.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {response.status || 'ERR'}
              </span>
              <span className="text-xs text-gray-400">{elapsed}ms</span>
              <span className="text-xs text-gray-400 font-mono">{method} {url}</span>
            </div>
            <pre className="bg-gray-950 text-green-400 rounded-xl p-4 text-xs overflow-auto max-h-64 font-mono">
              {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data)}
            </pre>
          </div>
        )}
      </div>
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="font-semibold text-sm text-gray-900 mb-3">Request History</div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} onClick={() => { setMethod(h.method); setUrl(h.url); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
                <span className={`font-bold ${h.ok ? 'text-green-600' : 'text-red-600'}`}>{h.status || 'ERR'}</span>
                <span className="font-mono text-gray-500">{h.method}</span>
                <span className="text-gray-700 flex-1 truncate font-mono">{h.url}</span>
                <span className="text-gray-400">{h.ms}ms</span>
                <span className="text-gray-400">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
