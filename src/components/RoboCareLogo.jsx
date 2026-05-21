export default function RoboCareLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-2">
      <RoboCareIcon size={compact ? 30 : 40} />
      <div className="leading-none">
        <div
          className="font-black tracking-tight leading-none"
          style={{ fontSize: compact ? 13 : 18 }}
        >
          <span className="text-gray-900 dark:text-white">ROBO</span>
          <span style={{ color: '#2d7a1f' }}>CARE</span>
        </div>
        <div
          className="tracking-widest font-semibold uppercase mt-0.5"
          style={{ fontSize: compact ? 7 : 9, color: '#2d7a1f' }}
        >
          Agriculture 4.0
        </div>
      </div>
    </div>
  )
}

function RoboCareIcon({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Leaf 1 — light green, upper-right */}
      <path d="M20 3 C20 3 37 5 35 21 C35 21 18 19 20 3Z" fill="#5db85c" />
      {/* Leaf 2 — dark green, lower-right */}
      <path d="M22 11 C22 11 39 18 33 35 C33 35 15 26 22 11Z" fill="#2d7a1f" />
      {/* Bird — crimson */}
      <path
        d="M13 15 C15 11 19 13 21 11 C23 7 28 9 31 7"
        stroke="#c41e3a"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom zigzag / checkmark */}
      <path
        d="M4 37 L9 32 L14 37 L20 27 L27 33"
        stroke="#1a2a1a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
