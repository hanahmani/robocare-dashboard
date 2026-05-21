/* ── Shared hero section used by all pages ─────────────────────── */
export function PageHero({ label, title, subtitle, right, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-8 py-6 shadow-sm">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          {label && (
            <div className="text-[11px] font-bold tracking-[0.13em] uppercase text-teal-600 dark:text-teal-400 mb-2">
              {label}
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {(right || children) && (
          <div className="flex items-center gap-3 flex-shrink-0 self-start mt-1">
            {right ?? children}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Mini stat chip displayed in hero right slot ───────────────── */
export function HeroStat({ label, value, danger = false }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 text-center min-w-[80px]">
      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-black leading-none ${danger ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
    </div>
  )
}

/* ── Small KPI card for page-level metrics ─────────────────────── */
export function PageKpi({ title, value, desc, accent }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
        {title}
      </div>
      <div
        className="text-[28px] font-black leading-none mb-2 tracking-tight"
        style={accent ? { color: accent } : undefined}
        {...(!accent ? { 'data-default': true } : {})}
      >
        <span className={!accent ? 'text-gray-900 dark:text-white' : ''}>{value}</span>
      </div>
      {desc && <div className="text-[11px] text-gray-500 dark:text-gray-400">{desc}</div>}
    </div>
  )
}

/* ── Unified page wrapper ──────────────────────────────────────── */
export function PageWrapper({ children }) {
  return (
    <div className="p-5 flex flex-col gap-4 min-h-full">
      {children}
    </div>
  )
}
