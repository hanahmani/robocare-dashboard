import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Search, X } from 'lucide-react'

const DATE_OPTIONS = ['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last 3 Months']
const CHANNEL_OPTIONS = ['All Channels', 'Email', 'WhatsApp', 'SMS', 'Push']
const STATUS_OPTIONS = ['All Statuses', 'Sent', 'Failed', 'Partial']

function Dropdown({ options, value, onChange, icon }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const isActive = value !== options[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
          isActive
            ? 'bg-brand-50 border-brand-300 text-brand-700'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {icon}
        {value}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''} ${isActive ? 'text-brand-400' : 'text-gray-400'}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[160px] py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                value === opt
                  ? 'text-brand-600 font-medium bg-brand-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FilterBar({ filters, onFilterChange }) {
  const hasActiveFilters =
    filters.date !== DATE_OPTIONS[0] ||
    filters.channel !== CHANNEL_OPTIONS[0] ||
    filters.status !== STATUS_OPTIONS[0] ||
    filters.search !== ''

  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap">
      <Dropdown
        options={DATE_OPTIONS}
        value={filters.date}
        onChange={(v) => onFilterChange({ ...filters, date: v })}
        icon={<Calendar className="w-4 h-4 text-gray-500" strokeWidth={1.75} />}
      />
      <Dropdown
        options={CHANNEL_OPTIONS}
        value={filters.channel}
        onChange={(v) => onFilterChange({ ...filters, channel: v })}
      />
      <Dropdown
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(v) => onFilterChange({ ...filters, status: v })}
      />
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.75} />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="Search recipients or IDs..."
          className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-gray-400"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ ...filters, search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {hasActiveFilters && (
        <button
          onClick={() =>
            onFilterChange({ date: DATE_OPTIONS[0], channel: CHANNEL_OPTIONS[0], status: STATUS_OPTIONS[0], search: '' })
          }
          className="text-xs text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2"
        >
          Reset
        </button>
      )}
    </div>
  )
}
