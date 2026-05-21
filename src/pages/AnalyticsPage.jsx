import { BarChart2 } from 'lucide-react'

export default function AnalyticsPage() {
  return <PlaceholderPage icon={BarChart2} title="Analytics" desc="Advanced analytics and reporting features are coming soon." />
}

function PlaceholderPage({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center">
        <Icon className="w-7 h-7 text-green-700 dark:text-green-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">{desc}</p>
    </div>
  )
}
