export default function Card({ children, className = '', padding = 'p-5' }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-card ${padding} ${className}`}
      style={{ borderColor: '#e5e7eb' }}
    >
      {children}
    </div>
  )
}
