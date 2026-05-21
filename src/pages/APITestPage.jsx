import { Terminal } from 'lucide-react'

export default function APITestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center">
        <Terminal className="w-7 h-7 text-green-700 dark:text-green-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">API Test</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        Interactive API testing console is coming soon.
      </p>
    </div>
  )
}
